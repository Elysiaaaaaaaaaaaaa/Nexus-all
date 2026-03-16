import os
from volcenginesdkarkruntime import Ark
from volcenginesdkarkruntime._exceptions import ArkAPIConnectionError
import json
import os
from a2a.server.agent_execution.agent_executor import AgentExecutor
from a2a.server.agent_execution.context import RequestContext
from a2a.server.events.event_queue import EventQueue
from a2a.types import (Part, Task, TextPart, UnsupportedOperationError)
from a2a.utils import (completed_task, new_artifact)
from a2a.utils.errors import ServerError
import asyncio
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate

import time
from functools import wraps
from tools.tool_hub import ark_web_search as web_search_tool
from tools.web_search import web_search
from base import CONTEXT_CACHE_TIME, get_agent_logger
import re
import json

# 创建logger实例
logger = get_agent_logger(__name__, "DIRECTOR_ASSISTANT_LOG_LEVEL", "INFO")
assistant_prompt = PromptTemplate.from_template('''
【角色设定】
你是一位专业、耐心、充满活力的AI视频创作导演助手，擅长引导用户从模糊的创意到具体的视频制作需求，正在辅助用户使用视频生成模型进行创作。

【当前任务】
{task}
【搜索工具使用规则】
向用户询问并征得用户同意后，可以使用function call调用联网搜索工具，最多使用一次。
【用户特点】
- 用户可能没有视频创作经验，不了解视频制作流程
- 用户可能不会主动提供所有必要信息，需要你引导提问
【回复格式要求】
1. 你的回复必须是纯JSON格式，不允许包含任何其他文本或格式！
    请严格按照以下要求输出JSON格式字符串，**必须遵守以下规则**：
    1. 仅输出JSON，无任何额外文字、注释、说明；
    2. JSON字符串中所有换行必须用转义符\\n表示，禁止出现真实换行；
    3. 所有字段名和字符串值必须用双引号包裹，禁止使用单引号；
    4. 禁止添加任何JSON注释（// 或 /* */）。
2. JSON必须包含以下字段：
   - idea：当前我们确认的视频创意想法，详细描述视频的主题、风格、时长、角色等核心要素
   - chat：与用户进行对话的内容
3. 示例：
   - 初始阶段：{{"idea": "当前我们还没有确认具体想法。", "chat": "你需要先描述一下你想要创作的视频类型（如科幻、动作等）和主要角色。"}}
   - 确认部分信息后：{{"idea": "当前我们的想法是做一个关于太空探索的科幻视频，其中包含宇航员和机器人角色", "chat": "你需要确认视频的时长（建议30秒）和是否需要加入背景音乐。"}}
   - 信息完整后：{{"idea": "当前我们已确认完整的视频创意：\n- 视频主题：太空探索科幻故事\n- 视频风格：科幻写实\n- 视频时长：30秒\n- 关键角色：宇航员和智能机器人", "chat": "你需要确认视频的时长（建议30秒）和是否需要加入背景音乐。"}}
   - 修改阶段（传入的material里outline、screen字段不为空）：{{"idea": "当前我们的修改需求是....", "chat": "我们现在要修改的内容是.....你有什么需求？"}}
''')

task_to_prompt = {
    "imagination":"和用户对话以帮用户寻找、激发灵感，或引导用户将用户的灵感变成具体的想法。【视频创作核心要素（这4个尽量确认）】视频主题/核心创意：用户想要表达什么内容或故事？视频风格：写实/科幻/卡通/悬疑等？视频时长：建议控制在1分钟以内（短视频平台友好，且易于操作）关键角色：人物/动物/物体的特点和关系（还需要添加其他你认为重要的元素）",
    "outline":"和用户对话，确认他想要如何修改大纲，确保他的修改方向与他的想法相符。最后输出要交给outline_writer智能体的大纲修改建议。",
    "screen":"和用户对话，确认他想要如何修改分镜脚本，确保想法足够准确，并生成给分镜写作者的详细修改建议",
    "animator":"和用户对话，确认他想要如何修改视频生成参数或内容，确保想法足够准确。视频生成阶段会根据分镜脚本生成最终的视频内容。如果用户对生成的视频有修改需求，请引导用户明确表达修改需求。",
    "figure_design":"和用户对话，确认他想要如何修改角色形象提示词，确保想法足够准确。角色形象提示词是用于驱动图片生成模型生成这个分镜的角色形象图片的提示词。",
    "story_board_prompting":"和用户对话，询问他的修改需求、确认他想要如何修改分镜首帧提示词，确保想法足够准确。如果你认为他的需求不够清晰，引导他细化该需求。在idea字段输出给提示词生成智能体的修改需求。！注意！在用户输入修改需求之前，不能使用function call调用联网搜索工具、不要自己猜测修改的原因。应向用户询问修改需求。",
    "story_board":"和用户对话，询问他的修改需求、确认他想要如何修改分镜首帧提示词，确保想法足够准确。如果你认为他的需求不够清晰，引导他细化该需求。在idea字段输出给提示词生成智能体的修改需求。！注意！在用户输入修改需求之前，不能使用function call调用联网搜索工具、不要自己猜测修改的原因。应向用户询问修改需求。",
    "script":"和用户对话，询问他的修改需求、确认他想要如何修改分镜运动脚本，确保想法足够准确。"
}

material_prompt = PromptTemplate.from_template('''
这是用户当前的创作材料：
{material}
其中，idea是用户通过和你聊天的过程确定的暂时的创作想法，outline是大纲写作者写的视频大纲，screen是分镜写作者写的创作分镜提示词。
''')


# 重试装饰器：对连接错误进行自动重试
def retry_on_connection_error(max_retries=3, base_delay=1.0):
    """
    重试装饰器，用于处理连接错误
    Args:
        max_retries: 最大重试次数
        base_delay: 基础延迟时间（秒），使用指数退避
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except ArkAPIConnectionError as e:
                    last_exception = e
                    if attempt < max_retries - 1:
                        delay = base_delay * (2 ** attempt)  # 指数退避
                        logger.warning(
                            f"连接错误，第 {attempt + 1}/{max_retries} 次重试 "
                            f"(等待 {delay:.1f}秒): {str(e)}"
                        )
                        time.sleep(delay)
                    else:
                        logger.error(f"连接错误，已达到最大重试次数: {str(e)}")
                        raise
                except Exception as e:
                    # 非连接错误直接抛出
                    raise
            if last_exception:
                raise last_exception
        return wrapper
    return decorator

# 从环境变量读取配置
ARK_API_KEY = os.getenv("ARK_API_KEY", "c96dbd1f-aeab-461c-90d6-8096b0baeecd")
ARK_API_TIMEOUT = float(os.getenv("ARK_API_TIMEOUT", "60.0"))  # 默认60秒超时
ARK_BASE_URL = os.getenv("ARK_BASE_URL", "https://ark.cn-beijing.volces.com/api/v3")

# 验证API密钥
if not ARK_API_KEY or ARK_API_KEY == "your_ark_api_key":
    logger.warning("ARK_API_KEY 未设置或使用默认值，请检查环境变量配置")

# 初始化Ark客户端，从环境变量中读取配置
try:
    client = Ark(
        base_url=ARK_BASE_URL,
        api_key=ARK_API_KEY,
        timeout=ARK_API_TIMEOUT,
    )
    logger.info(f"Ark客户端初始化成功，base_url: {ARK_BASE_URL}, timeout: {ARK_API_TIMEOUT}s")
except Exception as e:
    logger.error(f"Ark客户端初始化失败: {e}")
    raise

def safe_parse_llm_json(raw_str):
    """
    安全解析大模型输出的JSON字符串，兼容常见格式错误
    新增修复：markdown符号、特殊空格、控制字符、断字空格
    """
    if not raw_str:
        return {}
    
    # 步骤1：提取JSON主体（过滤大模型额外输出的文字）
    json_match = re.search(r"\{[\s\S]*\}", raw_str)
    if not json_match:
        return {}
    json_str = json_match.group()
    
    # 步骤2：修复常见错误（新增核心修复逻辑）
    fixed_str = (
        json_str
        # 修复1：删除markdown加粗符（最核心的报错原因）
        .replace("**", "")
        # 修复2：替换真实换行为转义符（保留原逻辑）
        .replace("\n", "\\n")
        # 修复3：单引号转双引号（保留原逻辑）
        .replace("'", '"')
        # 修复4：替换所有特殊空格（全角/不间断/制表符）为普通半角空格
        .replace("\u3000", " ").replace("\u00A0", " ").replace("\t", " ")
        # 修复5：合并连续空格（解决"短 视频""动 作"这类断字问题）
        .replace("  ", " ")
        # 修复6：清理不可见控制字符（\r/\b等）
        .replace("\r", "")
        # 修复7：去除首尾多余空格（保留原逻辑）
        .strip()
    )
    
    # 步骤3：容错解析（新增调试信息+终极兜底）
    try:
        return json.loads(fixed_str)
    except json.JSONDecodeError as e:
        print(f"JSON解析失败（已尽力修复）：{e}")
        # 终极兜底：即使解析失败，也用正则提取idea/chat字段
        idea_match = re.search(r'"idea":\s*"([\s\S]*?)"(?=,"chat")', fixed_str)
        chat_match = re.search(r'"chat":\s*"([\s\S]*?)"(?=}$)', fixed_str)
        print(raw_str)
        return {
            "idea": idea_match.group(1).strip() if idea_match else "",
            "chat": chat_match.group(1).strip() if chat_match else ""
        }

class Assistant:
    def __init__(self,user_name,project_name):
        self.user_name = user_name
        self.project_name = project_name
    
    def take_modify_material(self,session_data:dict) -> tuple[str,str]:
        now_material = session_data['now_task']
        if now_material == 'outline':
            return '当前要修改的内容是视频大纲',str(session_data['material']['outline'])
        if now_material == 'screen':
            screen_id = session_data['modify_num'][session_data['have_modify']]-1
            screen = session_data['material']['screen'][screen_id]
            return f'当前要修改的内容是镜号{screen_id+1}的分镜脚本',str(screen)
        if now_material == 'story_board_prompting':
            return '当前要修改的内容是分镜首帧提示词',str(session_data['material']['story_board'][-1]['prompt'])
        if now_material == 'story_board':
            return '当前要修改的内容是分镜首帧提示词',str(session_data['material']['story_board'][-1]['prompt'])
        if now_material == 'script':
            return '当前要修改的内容是分镜运动脚本',str(session_data['material']['script'][-1])
        return None
    
    @retry_on_connection_error(max_retries=3, base_delay=1.0)
    def _create_response(self, **kwargs):
        """内部方法：创建API响应，带重试机制"""
        return client.responses.create(**kwargs)
    
    def init_assistant(self,user_message,material,history,session_data,modify_material:tuple[str,str] = None):
        if modify_material == None:
            pass
        else:
            user_message = f'{user_message}\n{modify_material[0]}：{modify_material[1]}'
        try:
            completion = self._create_response(
                # 指定您创建的方舟推理接入点 ID，此处已帮您修改为您的推理接入点 ID
                model="doubao-seed-1-8-251228",
                input=[
                    {
                        'role':'system',
                        'content':assistant_prompt.invoke({'task':task_to_prompt[session_data['now_task']]}).to_string()
                    },
                    {
                        'role':'system',
                        'content':material_prompt.invoke({'material':json.dumps(material, ensure_ascii=False)}).to_string()
                    },
                    {
                        'role':'user',
                        'content':user_message
                    }
                ],
                caching={"type": "enabled"}, 
                text={"format":{"type": "json_object"}},
                tools = web_search_tool,
                thinking={"type": "disabled"},
                expire_at=int(time.time()) + CONTEXT_CACHE_TIME
            )
            last_id = completion.id
            result, last_id = self.next_call(completion, session_data,last_id)
            return safe_parse_llm_json(result), last_id
        except ArkAPIConnectionError as e:
            logger.error(f"API连接错误 (init_assistant): {e}")
            raise Exception(f"无法连接到AI服务，请检查网络连接或稍后重试。错误详情: {str(e)}")
        except Exception as e:
            logger.error(f"API调用错误 (init_assistant): {e}")
            raise
    
    def call(self, message: str,session_data:dict) -> tuple:
        now_task = session_data["now_task"]
        material = session_data["material"]
        history = self.load_and_format_chat_history()
        modify_material = self.take_modify_material(session_data)
        input_prompt = [
                {
                    'role':'system',
                    'content':assistant_prompt.invoke({'task':task_to_prompt[now_task]}).to_string()
                },
                {
                    'role':'system',
                    'content':material_prompt.invoke({'material':json.dumps(material, ensure_ascii=False)}).to_string()
                },
                {
                    'role':'user',
                    'content':message
                }
            ]
        if modify_material != None:
            input_prompt.append({
                'role':'system',
                'content':'现在我们需要修改的内容：'+modify_material[0]+modify_material[1]
            })
        try:
            # 检查last_id是否存在且不为None
            if not session_data['last_id']['assistant']:
                # 如果last_id不存在，调用init_assistant方法
                return self.init_assistant(message, material, history, session_data,modify_material)
            
            completion = self._create_response(
                # 指定您创建的方舟推理接入点 ID，此处已帮您修改为您的推理接入点 ID
                model="doubao-seed-1-8-251228",
                previous_response_id = session_data['last_id']['assistant'],
                input=input_prompt,
                caching={"type": "enabled"}, 
                thinking={"type": "disabled"},
                text={"format":{"type": "json_object"}},
                expire_at=int(time.time()) + CONTEXT_CACHE_TIME
            )
            last_id = completion.id
            result, last_id = self.next_call(completion, session_data,last_id)
            return safe_parse_llm_json(result), last_id
        except ArkAPIConnectionError as e:
            logger.error(f"API连接错误 (call): {e}")
            # 连接错误，尝试重新初始化
            logger.info("连接错误，尝试重新初始化会话")
            return self.init_assistant(message, material, history, session_data, modify_material)
        except Exception as e:
            # 捕获API错误，特别是last_id失效时的400错误
            error_msg = str(e)
            # 检查HTTP状态码400或404，以及错误信息中的"not found"关键字
            if "400" in error_msg or "404" in error_msg or "not found" in error_msg.lower():
                # 如果是last_id失效错误，调用init_assistant方法重新初始化
                logger.info("last_id失效，重新初始化会话")
                return self.init_assistant(message, material, history, session_data, modify_material)
            else:
                # 其他错误，重新抛出
                logger.error(f"API调用错误 (call): {e}")
                raise e
    
    def next_call(self,previous_message:str, session_data:dict,last_id:str):
        cnt = 0
        while True:
            function_call = next(
                (item for item in previous_message.output if item.type == "function_call"),None
            )
            if function_call is None:
                return previous_message.output[-1].content[0].text,last_id
            else:
                call_id = function_call.call_id
                call_arguments = function_call.arguments
                logger.info(f"Received function call with arguments: {call_arguments}")
                try:
                    arg = json.loads(call_arguments)
                    # 支持 query 或 prompt 参数
                    query = arg.get("query") or arg.get("prompt")
                    if not query:
                        raise ValueError(f"Function call missing required 'query' or 'prompt' parameter. Received: {call_arguments}")
                except json.JSONDecodeError as e:
                    raise ValueError(f"Invalid JSON in function call arguments: {call_arguments}. Error: {str(e)}")
                except KeyError:
                    raise ValueError(f"Function call missing 'query' or 'prompt' parameter. Received: {call_arguments}")
                result = web_search(query,cnt)
                cnt += 1
                try:
                    completion = self._create_response(
                        model="doubao-seed-1-8-251228",
                        previous_response_id = last_id,
                        input=[
                            {
                                'type':'function_call_output',
                                'call_id':call_id,
                                'output':json.dumps(result, ensure_ascii=False)
                            }
                        ],
                        caching={"type": "enabled"}, 
                        text={"format":{"type": "json_object"}},
                        thinking={"type": "disabled"},
                        expire_at=int(time.time()) + CONTEXT_CACHE_TIME
                    )
                    last_id = completion.id
                    previous_message = completion
                except ArkAPIConnectionError as e:
                    logger.error(f"API连接错误 (next_call): {e}")
                    raise Exception(f"无法连接到AI服务，请检查网络连接或稍后重试。错误详情: {str(e)}")
        return (previous_message.output[-1].content[0].text,last_id)

    def load_and_format_chat_history(self):
        """从本地加载对话历史并格式化为字符串
        
        Returns:
            str: 格式化的对话历史字符串，如果没有对话历史则返回"当前没有对话历史"
        """
        from file_manage import UserFile
        import os
        
        # 创建UserFile实例
        user_file = UserFile(self.user_name)
        
        # 检查项目是否存在
        if self.project_name not in user_file.user_project:
            return "当前没有对话历史"
        
        # 加载对话历史
        chat_history = user_file.load_chat_history(self.project_name)
        
        # 如果没有对话历史，返回提示
        if not chat_history:
            return "当前没有对话历史"
        
        # 只保留最近的10条对话
        recent_chat_history = chat_history[-10:]
        
        # 格式化对话历史
        formatted_history = []
        # 计算起始序号，保持对话序号的连续性
        start_index = len(chat_history) - len(recent_chat_history) + 1
        for i, history_item in enumerate(recent_chat_history, start_index):
            user_content = history_item.get('user', '')
            assistant_content = history_item.get('assistant', '')
            formatted_history.append(f"对话 {i}：\n用户：{user_content}\n助手：{assistant_content}\n")
        
        return '\n'.join(formatted_history)

class AssistantExecuter(AgentExecutor):
    def __init__(self):
        self.agent = Assistant()
    
    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue,
    ) -> None:
        actual_message = context.message.parts[0].root.text  # 实际的 Message 对象
        
        
        # 在事件循环中运行Decision_Agent
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda msg=actual_message: self.agent.call(msg, {}),
        )
        
        # 从JSON格式转换回文本格式
        result_text = json.dumps(result, ensure_ascii=False)
        print(f"Decision Agent Result: {result_text},Type:{type(result_text)}")
        # 将结果封装到artifacts中返回
        await event_queue.enqueue_event(
            completed_task(
                context.task_id,
                context.context_id,
                [new_artifact(parts=[Part(root=TextPart(text=result_text))],name = 'test')],
                [context.message],
            )
        )
    
    async def cancel(
        self, request: RequestContext, event_queue: EventQueue
    ) -> Task | None:
        raise ServerError(error=UnsupportedOperationError())
    
if __name__ == "__main__":
    test_model()