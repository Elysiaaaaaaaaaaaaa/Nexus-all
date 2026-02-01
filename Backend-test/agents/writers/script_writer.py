'''
脚本创作智能体，负责创作图生视频部分的提示词
'''
import os
from openai import OpenAI
from langchain.prompts import PromptTemplate
from base import upload_image,image_to_base64
import re
import json


positive_script_example = '''
视频主体是一个充满动感的涂鸦艺术角色。一个由喷漆所画成的少年，正从一面混凝土墙上活过来。他的动态是一边用极快的语速演唱一首英文rap，一边摆着一个经典的、充满活力的说唱歌手姿势。场景风格是一幅都市奇幻艺术的场景，场景设定在夜晚一个充满都市感的铁路桥下。灯光来自一盏孤零零的街灯，营造出电影般的氛围，充满高能量和惊人的细节。视频的音频部分完全由他的rap构成，没有其他对话或杂音。
'''



script_generating_prompt = f'''
你是一个图生视频提示词工程师，你需要根据用户传入的分镜首帧图片和分镜大纲，创作出符合要求的图生视频提示词。要求该分镜的结尾能和下一个分镜的开头平滑过渡。
！注意！你必须严格按照以下规则输出内容。你只能输出图生视频提示词，不能输出任何其他无关的内容，不能附带类似“根据您提供的...以下是...提示词”
提示词模板：{positive_script_example}
'''

json_schema = {
    "name": "prompt",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "positive": {"type": "string", "description": "正向提示词"},
            "negative": {"type": "string", "description": "负向提示词"}
        },
        "required": ["positive", "negative"],
        "additionalProperties": False
    }
}

def safe_parse_llm_json(raw_str):
    """
    安全解析大模型输出的JSON字符串【无无意义提前返回，最大化保留内容】
    兼容所有常见错误：开头隐藏字符、空格/换行、markdown、单引号、格式残缺等
    核心原则：除非输入为空，否则绝不轻易返回空，优先尝试修复→解析→正则提取
    适配字段：positive/negative / idea/chat（自动识别，双向兼容）
    """
    # 仅这一种情况返回空：输入为空/非字符串（无任何内容可提取）
    if not raw_str or not isinstance(raw_str, str):
        return {"positive": "", "negative": ""}
    
    # 步骤1：提取JSON主体（即使匹配不到，也用原始字符串继续处理，不提前返回）
    json_match = re.search(r"\{[\s\S]*\}", raw_str)
    json_str = json_match.group() if json_match else raw_str  # 匹配不到就用原始字符串
    
    # 步骤2：强制清理首尾字符，确保尽可能接近标准JSON（即使首尾不是{}，也继续处理）
    json_str = json_str.lstrip().rstrip()  # 删首尾所有空白/隐藏字符
    
    # 步骤3：修复所有常见格式错误（保留所有核心修复逻辑，不遗漏）
    fixed_str = (
        json_str
        .replace("**", "")  # 删markdown加粗符
        .replace("\n", "\\n")  # 裸换行为转义符
        .replace("'", '"')     # 单引号转双引号
        .replace("\u3000", " ").replace("\u00A0", " ").replace("\t", " ")  # 特殊空格转普通
        .replace("\r", "")  # 清理回车符
        .strip()
    )
    # 深度清理连续空格，解决断字/标点后多余空格
    fixed_str = re.sub(r'\s+', ' ', fixed_str)
    
    # 步骤4：容错解析+【无兜底的智能提取】（解析失败也不返回空，必提字段内容）
    try:
        result = json.loads(fixed_str)
        # 补全所有字段，避免后续代码报键不存在错误
        result.setdefault("positive", "")
        result.setdefault("negative", "")
        return result
    except json.JSONDecodeError as e:
        print(f"JSON语法仍有错误，尝试正则提取字段：{e}")
        print(fixed_str)
        # 核心优化：无论前面哪步出错，都执行正则提取，绝不返回空
        res = {"positive": "", "negative": ""}

        # ------------------- 核心重构：强鲁棒正则提取规则 -------------------
        # 适配大模型JSON：冒号前后任意空格、值内任意换行/字符、字段间任意分隔
        # 正则规则："字段名" + 任意空格 + : + 任意空格 + " + 任意内容 + "（直到下一个"字段名"或结尾）
        field_pattern = r'"({})"\s*:\s*"([\s\S]*?)"(?=\s*",?\s*"|$|\s*}})'
        # 提取positive/negative（主场景）
        p_pattern = field_pattern.format("positive")
        n_pattern = field_pattern.format("negative")

        # 执行提取，兼容匹配不到的情况
        p_match = re.search(p_pattern, fixed_str, re.DOTALL)  # re.DOTALL让.匹配换行，双重保险
        n_match = re.search(n_pattern, fixed_str, re.DOTALL)

        # 提取并清理内容（去首尾空格，最大化保留有效信息）
        if p_match: res["positive"] = p_match.group(2).strip()
        if n_match: res["negative"] = n_match.group(2).strip()

        # 额外兜底：如果fixed_str提取不到，直接从原始raw_str提取（防止修复时破坏内容）
        if all(v == "" for v in res.values()):
            print("修复后字符串提取失败，直接从原始输出提取...")
            p_match_raw = re.search(p_pattern, raw_str, re.DOTALL)
            n_match_raw = re.search(n_pattern, raw_str, re.DOTALL)
            if p_match_raw: res["positive"] = p_match_raw.group(2).strip()
            if n_match_raw: res["negative"] = n_match_raw.group(2).strip()

client = OpenAI(
    # 若没有配置环境变量，请用百炼API Key将下行替换为：api_key="sk-xxx"
    api_key="sk-8c9152365e554289834e30d12885ec03",
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

class ScriptWriter:
    def __init__(self):
        self.scripts = list()
    
    def call(self, session_data):
        screen_id = session_data['story_board_generating']
        prompt = session_data['material']['outline'][screen_id]
        storyboard_url = image_to_base64(session_data['material']['story_board'][screen_id]['image_address'])
        script = {"positive": self.send_request(prompt,storyboard_url),"negative":"人物变形、肢体残缺、多余手指、过于夸张的表情和动作"}
        return script
    
    def send_request(self, prompt,storyboard_url):
        completion = client.chat.completions.create(
            model="qwen-vl-plus",  # 此处以qwen-vl-plus为例，可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url",
                         "image_url": {
                             "url": storyboard_url
                         }
                         },
                        {"type": "text", "text": prompt},
                    ]
                },
                {
                    "role": "system",
                    "content": [
                        {"type": "text", "text": script_generating_prompt}
                    ]
                }
            ],
        )
        return completion.choices[0].message.content 
if __name__ == '__main__':
    script_writer = ScriptWriter()
    
