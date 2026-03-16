'''
story board创作智能体，会接收到三个任务：
创作背景图片生成提示词，类型为t2i提示词
创作主体形象图片生成提示词，类型为t2i提示词
根据前两个任务的结果，创作分镜首帧图片生成提示词，类型为i2i提示词
接收到的任务类型可以在session_data的now_task字段里获取
'''

from volcenginesdkarkruntime import Ark
import time
from langchain_core.prompts import PromptTemplate
import json
import re
from base import CONTEXT_CACHE_TIME
# screen_example = '''
# {"positive": "主体场景：温馨二次元咖啡厅前台，暖黄色吊灯悬在头顶，前台摆放着马卡龙色菜单牌、插着洋甘菊的陶瓷小花瓶，背景货架上摆满包装精致的罐装咖啡豆和可爱杯具，玻璃柜里陈列着各式裱花蛋糕。色彩：暖粉黄柔色调，整体色调柔和温暖。光线：暖黄色吊灯散发的柔和光线为主，营造温馨氛围。氛围：温馨、治愈，充满柔和的生活感。关键元素：[优先级1]站在柜台后双手捧菜单递向镜头的森娅露露卡、[优先级2]前台区域的马卡龙色菜单牌与陶瓷小花瓶、[优先级3]背景的咖啡豆货架与蛋糕玻璃柜、[优先级4]头顶的暖黄色吊灯、[优先级5]浅粉黄的温馨空间。人物特征：森娅露露卡是金发女性，头发带有紫色和粉色渐变，头戴黑色猫耳装饰，身着黑色和紫色相间带金色边饰、粉色蕾丝细节的华丽服饰，服饰带有紫色宝石吊坠，紫金配色女仆围裙系带在身后打成蝴蝶结，流萤色长发用浅紫发带束起，眼睛弯成月牙，嘴角带着温柔笑意，脸颊有浅粉色红晕。空间关系：森娅露露卡位于画面中心区域，占据画面30%，正对着镜头递出菜单；前台占据画面下半部分40%，背景货架与玻璃柜占据画面上半部分后方区域；暖黄色吊灯位于画面顶部中央，占据画面5%；画面边缘带有轻微柔光效果，第一人称视角呈现。","negative": "避免无关人物、多余肢体、避免冷色调、刺眼的强光、人物表情生硬、画面边缘无柔光、出现与温馨咖啡厅无关的元素、人物服饰细节错误"}
# '''
screen_example = '''{"positive":"主体场景：篮球场边休息区，科比坐在长椅上，面前折叠桌上放着一瓶包装清晰的康师傅冰红茶，瓶身外侧凝结细密水珠，背景阳光透过树叶洒下斑驳光影。画面风格：写实风格，暖色调过渡为冷色调（产品区域偏蓝），突出产品冰凉感。人物：科比穿着湿透的洛杉矶湖人队24号球衣（黄色无袖，胸前印有紫色“LAKERS”字样和白色数字“24”），左臂有明显纹身（皇冠图案和文字），伸手拿起冰红茶，手指触碰到瓶身时微微缩了一下，随即快速拧开瓶盖，仰头准备饮用。关键元素：[优先级1]伸手拿冰红茶的科比、[优先级2]瓶身凝结水珠的康师傅冰红茶、[优先级3]篮球场边休息区长椅与折叠桌、[优先级4]背景透过树叶的斑驳光影、[优先级5]地面残留的篮球场痕迹。空间关系：科比位于画面中景偏左，占据画面约25%，姿态微微前倾；折叠桌位于画面中景中央，冰红茶瓶占据桌面约10%，与科比手部距离近；长椅占据画面左侧约15%，支撑科比坐姿；斑驳光影分布在画面背景及地面，形成明暗交错效果；篮球场痕迹位于画面下方边缘，与休息区衔接自然。光线：背景透过树叶的斑驳阳光为主，冰红茶瓶身反射冷色调光线为辅，阳光在人物和物体上形成柔和的斑驳阴影。氛围：炎热后的清凉期待，带有运动后放松的张力。","negative":"避免画面模糊、人物肢体比例失调、球衣颜色错误（非黄色24号湖人球衣）、纹身细节缺失、冰红茶包装错误或无包装、瓶身无水珠或水珠不细密、冷色调区域不突出、背景无树叶斑驳光影、人物表情无冰凉触感的微缩反应、多余元素（如无关人物、其他饮料）、长椅或折叠桌缺失、地面无篮球场痕迹衔接。"}'''

screen_prompt = f'''
你是一个专业的文生图提示词工程师，你需要根据用户传入的分镜设计和人物描述，创作出该分镜第一帧的图片生成提示词。
提示词需要包含场景描述、画面风格、人物描述（包括人物正在做什么和人物的特征）和画面优先级。
！注意！你正在创作的是分镜首帧的生成提示词，只需要创作一个场景的图片生成提示词，不需要创作镜头运动、人物对白等要素。避免出现”远景...中景...特写镜头“之类区分不同画面的描述。但是要关注画面的视角。
你同时还要确保当前提示词生成的图片和上一个提示词生成的图片是连续的，即当前提示词生成的图片是上一个提示词生成的图片的后续场景。
提示词模板：
{screen_example}
【回复格式要求】
1. 你的回复必须是纯JSON格式，不允许包含任何其他文本或格式！
    请严格按照以下要求输出JSON格式字符串，**必须遵守以下规则**：
    1. 仅输出JSON，无任何额外文字、注释、说明；
    2. JSON字符串中所有换行必须用转义符\\n表示，禁止出现真实换行；
    3. 所有字段名和字符串值必须用双引号包裹，禁止使用单引号；
    4. 禁止添加任何JSON注释（// 或 /* */）。
2. JSON必须包含以下字段：
   - positive：正向提示词，包含分镜描述的正面部分
   - negative：负面提示词，包含不希望出现的元素，例如画面模糊、人物割裂、多余肢体等。
'''

screen_modify_prompt = PromptTemplate.from_template(f'''
你是一个专业的文生图提示词工程师，你需要根据用户的需求，修改修改以下背景图片生成提示词：{{now_prompt}}
【回复格式要求】
1. 你的回复必须是纯JSON格式，不允许包含任何其他文本或格式！
    请严格按照以下要求输出JSON格式字符串，**必须遵守以下规则**：
    1. 仅输出JSON，无任何额外文字、注释、说明；
    2. JSON字符串中所有换行必须用转义符\\n表示，禁止出现真实换行；
    3. 所有字段名和字符串值必须用双引号包裹，禁止使用单引号；
    4. 禁止添加任何JSON注释（// 或 /* */）。
2. JSON必须包含以下字段：
   - positive：正向提示词，包含分镜描述的正面部分
   - negative：负面提示词，包含不希望出现在画面中的要素，如人物割裂、多余肢体等。
{screen_example}
''')

story_board_example = '''
{"positive":"(杰作, 8k, 超高清:1.1), (保留原图背景细节:1.2), 原图背景为[填入背景描述，例如：秋日森林，落叶满地，阳光从树叶缝隙穿透，地面有斑驳光影]，添加一个来自参考图的角色，角色特征：[填入角色细节，如：短发男生，穿着黑色卫衣+牛仔裤，白色运动鞋，面部轮廓清晰]，角色特定姿势：[填入精准姿势，如：侧身靠在树干上，左手插兜，右手拿着一片枫叶举到眼前，头部微微歪向右侧，眼神看向枫叶]，角色大小与森林环境比例协调，角色影子与背景阳光方向一致，投射在落叶上，角色与背景融合自然，无悬浮感，画风统一，细节丰富，色彩和谐",
"negative":"不要低质量，避免模糊，不要角色变形，不要肢体残缺，不要多余手指，不要角色悬浮，不要光影混乱，不要背景细节丢失，不要角色比例失调，避免角色边缘有白边，避免色彩溢出，避免水印，避免文字，避免背景被篡改，避免画风割裂"}
'''

story_board_modify_prompt = PromptTemplate.from_template(f'''
你是一个专业的文生图提示词工程师，你需要根据用户的需求，修改以下分镜首帧图片生成提示词：{{now_prompt}}
【回复格式要求】
1. 你的回复必须是纯JSON格式，不允许包含任何其他文本或格式！
    请严格按照以下要求输出JSON格式字符串，**必须遵守以下规则**：
    1. 仅输出JSON，无任何额外文字、注释、说明；
    2. JSON字符串中所有换行必须用转义符\\n表示，禁止出现真实换行；
    3. 所有字段名和字符串值必须用双引号包裹，禁止使用单引号；
    4. 禁止添加任何JSON注释（// 或 /* */）。
2. JSON必须包含以下字段：
   - positive：正向提示词，包含分镜描述的正面部分
   - negative：负面提示词，包含不希望出现在画面中的要素，如人物割裂、多余肢体等。
''')

story_board_prompt = f'''
你是一个专业的文生图提示词工程师，你需要根据用户的需求，创作出符合要求的分镜首帧图片生成提示词。
提示词的格式为json格式，你必须按照提示词模板的格式创作，json有两个字段，分别是positive和negative，分别对应分镜描述的正面部分和负面部分：
positive：分镜描述的正面部分，包含主体场景、色彩特征、光线特征、氛围特征、关键元素、空间关系
negative：分镜描述的负面部分，包含不希望出现在画面中的元素
根据用户的需求，创作出符合要求的分镜首帧图片生成提示词。
提示词模板：
{story_board_example}
【回复格式要求】
1. 你的回复必须是纯JSON格式，不允许包含任何其他文本或格式！
    请严格按照以下要求输出JSON格式字符串，**必须遵守以下规则**：
    1. 仅输出JSON，无任何额外文字、注释、说明；
    2. JSON字符串中所有换行必须用转义符\\n表示，禁止出现真实换行；
    3. 所有字段名和字符串值必须用双引号包裹，禁止使用单引号；
    4. 禁止添加任何JSON注释（// 或 /* */）。
2. JSON必须包含以下字段：
   - positive：正向提示词，包含分镜描述的正面部分
   - negative：负面提示词，包含不希望出现在画面中的要素，如人物割裂、多余肢体等。
'''

story_board_modify_prompt = PromptTemplate.from_template(f'''
你是一个专业的文生图提示词工程师，请根据用户的修改建议，修改你刚刚生成的分镜首帧图片生成提示词。
你需要在{{now_prompt}}的基础上，根据用户的修改建议，修改分镜首帧图片生成提示词。
【回复格式要求】
1. 你的回复必须是纯JSON格式，不允许包含任何其他文本或格式！
    请严格按照以下要求输出JSON格式字符串，**必须遵守以下规则**：
    1. 仅输出JSON，无任何额外文字、注释、说明；
    2. JSON字符串中所有换行必须用转义符\\n表示，禁止出现真实换行；
    3. 所有字段名和字符串值必须用双引号包裹，禁止使用单引号；
    4. 禁止添加任何JSON注释（// 或 /* */）。
2. JSON必须包含以下字段：
   - positive：正向提示词，包含分镜描述的正面部分
   - negative：负面提示词，包含不希望出现在画面中的要素，如人物割裂、多余肢体等。
''')


# 初始化Ark客户端
# 初始化Ark客户端
client = Ark(
    base_url="https://ark.cn-beijing.volces.com/api/v3",
    api_key='c96dbd1f-aeab-461c-90d6-8096b0baeecd',
)

def safe_parse_llm_json(raw_str):
    """
    安全解析大模型输出的JSON字符串，兼容常见格式错误
    修复：markdown符号、特殊空格、控制字符、断字空格、裸换行、单引号等
    """
    if not raw_str:
        return {}
    
    # 步骤1：提取JSON主体（过滤大模型额外输出的文字）
    json_match = re.search(r"\{[\s\S]*\}", raw_str)
    if not json_match:
        return {}
    json_str = json_match.group()
    
    # 步骤2：修复常见错误（核心：针对本次的特殊空格/裸换行/控制字符）
    fixed_str = (
        json_str
        .replace("**", "")  # 删除markdown加粗符
        .replace("\n", "\\n")  # 替换真实换行为转义符
        .replace("'", '"')     # 单引号转双引号
        .replace("\u3000", " ").replace("\u00A0", " ").replace("\t", " ")  # 特殊空格转普通空格
        .replace("  ", " ")  # 合并连续空格（解决断字/多余空格）
        .replace("\r", "")  # 清理回车符
        .strip()
    )
    
    # 步骤3：容错解析+终极兜底
    try:
        return json.loads(fixed_str)
    except json.JSONDecodeError as e:
        print(f"JSON解析失败（已尽力修复）：{e}")
        print(raw_str)
        # 正则提取核心字段，保证不返回空
        positive_match = re.search(r'"positive":\s*"([\s\S]*?)"(?=,"negative")', fixed_str)
        negative_match = re.search(r'"negative":\s*"([\s\S]*?)"(?=}$)', fixed_str)
        return {
            "positive": positive_match.group(1).strip() if positive_match else "",
            "negative": negative_match.group(1).strip() if negative_match else ""
        }


class StoryTeller:
    def __init__(self):
        pass

    def init_assistant(self,inputs:list):
        completion = client.responses.create(
            model="doubao-seed-1-8-251228",
            input=inputs,
            text={"format":{"type": "json_object"}},
            caching={"type": "enabled"}, 
            thinking={"type": "disabled"},
            expire_at=int(time.time()) + CONTEXT_CACHE_TIME,
        )
        last_id = completion.id
        result = completion.output[-1].content[0].text
        return result, last_id

    def call(self,sys_prompt,message,last_id):
        inputs = [
                {
                    'role':'system',
                    'content':sys_prompt
                },
                {
                    'role':'user',
                    'content':message
                }
            ]
        try:
            if not last_id:
                result, last_id = self.init_assistant(inputs)
                return result, last_id
            completion = client.responses.create(
                model="doubao-seed-1-8-251228",
                previous_response_id = last_id,
                input=inputs,
                caching={"type": "enabled"}, 
                thinking={"type": "disabled"},
                expire_at=int(time.time()) + CONTEXT_CACHE_TIME,
            )
            last_id = completion.id
            result = completion.output[-1].content[0].text

            return result, last_id
        except Exception as e:
            # 捕获API错误，特别是last_id失效时的400错误
            error_msg = str(e)
            # 检查HTTP状态码400或404，以及错误信息中的"not found"关键字
            if "400" in error_msg or "404" in error_msg or "not found" in error_msg.lower():
                # 如果是last_id失效错误，调用init_assistant方法重新初始化
                result, last_id = self.init_assistant(inputs)
                return result, last_id
            else:
                # 其他错误，重新抛出
                raise e
    
    def story_board_prompting(self,session_data:dict) -> str:
        """
        生成分镜首帧图片的提示词
        :param session_data: 包含主体描述和背景描述的字典
        """
        if session_data['modify_request']['story_board']:
            sys_prompt = story_board_modify_prompt.invoke({
                'now_prompt': session_data['material']['story_board'][-1].get('prompt')
            }).to_string()
            message = session_data['modify_request']['story_board']
            session_data['modify_request']['story_board'] = None
        else:
            sys_prompt = screen_prompt
            figure_describe = session_data['material']['story_board'][-1]['figure_describe']
            message = session_data['material']['outline'][session_data['video_generating']]+'角色描述：'+figure_describe
        result,last_id = self.call(sys_prompt,message,session_data['last_id']['story_board'])
        session_data['material']['story_board'][-1]['prompt'] = safe_parse_llm_json(result)
        session_data['last_id']['story_board'] = last_id
        return session_data
        
    # def story_board_prompting(self,session_data:dict) -> str:
    #     """
    #     生成分镜首帧图片的提示词
    #     :param session_data: 包含主体描述和背景描述的字典
    #     :return: 分镜首帧图片的提示词
    #     """
    #     if session_data['modify_request']['story_board']:
    #         sys_prompt = story_board_modify_prompt.invoke({'now_prompt':session_data['material']['story_board']['prompt'][-1]}).to_string()
    #         message = session_data['modify_request']['story_board']
    #     else:
    #         sys_prompt = story_board_prompt
    #         background = session_data['material']['background']['prompt'][session_data['story_board_generating']]['positive']
    #         figure = session_data['material']['figure']['prompt'][session_data['story_board_generating']]
    #         message = session_data['material']['outline'][session_data['story_board_generating']]+'\n背景:'+background+'\n主体:'+figure
    #     result = self.call(sys_prompt,message)
    #     return safe_parse_llm_json(result)
        
        
        
