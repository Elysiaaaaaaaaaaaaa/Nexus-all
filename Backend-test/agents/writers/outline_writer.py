from volcenginesdkarkruntime import Ark
import time
from langchain_core.prompts import PromptTemplate
from base import CONTEXT_CACHE_TIME
import re

outline_example = f'''
镜号 1
场景视角：天空上，俯视海面
场景内容：徘徊者号冲破米勒星球厚重云层，下方是无垠的平静浅海，海面泛着微光，背景可见黑洞投射的微弱引力光晕，飞船以螺旋姿态向信号源方向平稳下降，船体在海面上投下清晰倒影。
画面风格：科幻写实风格，冷色调为主，强调太空环境的神秘感。
首帧人物：无人物出现
剧情：宇航员驾驶徘徊者号成功抵达米勒星球，降落在海面上，准备登陆探寻米勒留下的信号痕迹，初步探测到星球环境数据。
镜头移动：远景展现云层和海面的宏大场景，中景呈现飞船下降过程，近景聚焦驾驶舱内部细节。
/
镜号 2
场景视角：海面上，平拍
场景内容：飞船平稳着陆浅海，舱门向两侧打开，海水仅没过船员膝盖，米勒的飞船残骸半浸在海水中，金属外壳锈蚀严重，散落着断裂的管道和仪器零件，远处海平面上矗立着一道 "山峦" 轮廓，与天空形成清晰分界线。
画面风格：科幻写实风格，强调荒凉和未知的氛围，光影对比强烈。
首帧人物：布兰德从里面打开舱门，准备下船。
剧情：布兰德率先迈步下船，裤脚溅起细小水花；道尔和变形为多足形态的凯斯紧随其后；凯斯精准从海水中捞起一枚破碎的信号信标，信标外壳有明显的撞击划痕和海水侵蚀痕迹，指示灯早已熄灭。船员登陆星球，发现米勒的信号信标残骸，继续向飞船失事地点行进，远处的 "山峦" 为后续危机埋下伏笔。
镜头移动：中景显示飞船着陆过程，特写镜头聚焦信标细节，全景展现环境和人物行进过程。
/
镜号 3
场景视角：船舱内舷窗前
场景内容：库珀发现 "山峦" 实为巨型巨浪，巨浪高耸入云、裹挟着白色泡沫，浪峰遮蔽阳光，在海面投下巨大阴影，以极快速度向船员和飞船推进，所过之处海面形成环形波纹。
画面风格：科幻写实风格，紧张悬疑风格，节奏紧凑，强调危机感。
首帧人物：库珀在驾驶舱内面部突然紧绷，瞳孔收缩，视线死死锁定舷窗外的巨浪；
剧情概括：库珀发现 "山峦" 实为巨型巨浪，危机骤然降临，布兰德正弯腰从残骸中抽取数据记录仪，手指已触碰到设备；道尔侧身回头，看清巨浪后脸色瞬间惨白，身体下意识紧绷。
镜头移动：特写捕捉人物神情变化，全景镜头快速拉远揭露真相，俯拍展现巨浪推进的震撼场面，中景呈现人物动作。
/
镜号 4
场景视角：海面上
场景内容：布兰德腿部被残骸的金属支架压住，海水已漫至腰部，身后另一波稍小的巨浪已逼近，浪花已溅到道尔的裤腿，三人向飞船方向狂奔。
画面风格：科幻写实风格，节奏快速，强调紧迫感。
首帧人物：在海面上，布兰德腿部被金属支架压住，海水已漫至腰部，身后另一波稍小的巨浪已逼近。
剧情概括：凯斯迅速变形为轮状结构，以高速滚向布兰德，用两根机械臂撑起压在布兰德腿上的支架，另一根手臂拽住布兰德的胳膊；布兰德试图挣脱，头发被海风和水花打湿，脸上写满焦急，怀中紧紧抱着数据记录仪；道尔站在布兰德身后伸手欲拉她。
镜头移动：特写展现布兰德被困的紧张状态，中景呈现道尔的掩护动作，近景显示三人狂奔过程，跟拍镜头追踪凯斯的救援行动
/
'''

outline_develop_prompt = f'''【角色设定】
你是一位专业的分镜大纲撰写专家，擅长将用户的创意转化为结构化分镜大纲，为后续视频制作提供清晰指导。
【核心任务】
先根据用户设置的视频时长设计分镜数量（大约一个分镜5-10秒），再根据用户提供的视频创意需求设计各个分镜，并生成详细的分镜大纲，确保每个镜头都能准确传达故事内容和视觉效果。

【分镜大纲要素】
1. 镜号：按顺序从1开始编号
2. 场景内容：清晰描述每个镜头的场景环境、空间布局、关键物体和事件发生地点。
3. 画面风格：分镜画面的整体风格（如：真实、日式2D动漫风、美式3D动画风、铅笔手绘风格等）。
4. 首帧人物：描述镜头中最开始出现的角色及其动作、表情、状态、位置关系等。
5. 剧情：说明每个镜头推进的剧情内容和叙事目的
6. 镜头移动：描述镜头的移动方式、角度、速度、范围等，确保与剧情内容相匹配。
！注意！每个分镜都要明确场景处所，如果剧情上没有出现场景切换，每个分镜的场景应当保持相同。

【格式要求】
分镜大纲必须严格按照以下示例格式：
{outline_example}
！注意！每个分镜后面都有一个‘/’，用于分隔不同的镜头。

【创作建议】
- 每个镜头控制在5-10秒的视觉内容（适合短视频制作）
- 内容详略得当，为后续分镜脚本智能体预留创作空间
- 确保镜头之间的逻辑连贯性和叙事流畅性'''

outline_modify_prompt = PromptTemplate.from_template('''【角色设定】
你是一位专业的分镜大纲修改专家，擅长根据用户反馈精准调整分镜内容，保持故事完整性和视觉连贯性。

【核心任务】
根据用户提供的修改请求，对以下分镜大纲进行调整，确保修改后的内容完全符合用户需求，同时保持分镜的逻辑连贯性和叙事流畅性。

【当前分镜大纲】
{outline}

【修改要求】
1. 严格遵循用户的修改指示，确保所有调整都准确反映用户需求
2. 保持原有分镜的格式和结构不变
3. 确保修改后的镜头之间依然保持良好的叙事逻辑
4. 如有必要，可以对未明确修改的部分进行微调，以确保整体协调一致''')
# 初始化Ark客户端
client = Ark(
    base_url="https://ark.cn-beijing.volces.com/api/v3",
    api_key='c96dbd1f-aeab-461c-90d6-8096b0baeecd',
)

class OutlineWriter:
    def __init__(self):
        self.outline = []
    
    def init_assistant(self,message,session_data,sys_prompt):
        # 创建初始对话，包含outline_writer的prompt和示例
        completion = client.responses.create(
            model="doubao-seed-1-8-251228",
            input=[
                {
                    'role':'system',
                    'content':'当前分镜大纲：'+str(self.outline)
                },
                {
                    'role':'system',
                    'content':sys_prompt
                },
                {
                    'role':'user',
                    'content':message
                }
            ],
            caching={"type": "enabled"}, 
            thinking={"type": "disabled"},
            expire_at=int(time.time()) + CONTEXT_CACHE_TIME,
        )
        last_id = completion.id
        result = completion.output[-1].content[0].text
        return result, last_id
    
    def call(self,session_data:dict) -> tuple:
        """
        向火山方舟平台发送请求并返回内容
        :param message: 用户的需求
        :return: 分镜大纲和last_id的元组
        """
        self.outline = session_data['material']['outline']
        if session_data['modify_request']['outline']==None:
            sys_prompt = outline_develop_prompt
            message  = ''.join(session_data['material']['idea'])
        else:
            sys_prompt = outline_modify_prompt.invoke({"outline":str(session_data['material']['outline'])}).to_string()
            message  = ''.join(session_data['modify_request']['outline'])
        try:
            if not session_data['last_id']['outline_writer']:
                raw_outline, last_id = self.init_assistant(message, session_data,sys_prompt)
                self.outline = self.deal_outline(raw_outline)
                return self.outline, last_id
            completion = client.responses.create(
                model="doubao-seed-1-8-251228",
                previous_response_id = session_data['last_id']['outline_writer'],
                input=[
                    {
                        'role':'system',
                        'content':sys_prompt
                    },
                    {
                        'role':'user',
                        'content':message
                    }
                ],
                caching={"type": "enabled"}, 
                thinking={"type": "disabled"},
                expire_at=int(time.time()) + CONTEXT_CACHE_TIME,
            )
            last_id = completion.id
            raw_outline = completion.output[-1].content[0].text
            self.outline = self.deal_outline(raw_outline)
            return self.outline, last_id
        except Exception as e:
            # 捕获API错误，特别是last_id失效时的400错误
            error_msg = str(e)
            # 检查HTTP状态码400或404，以及错误信息中的"not found"关键字
            if "400" in error_msg or "404" in error_msg or "not found" in error_msg.lower():
                # 如果是last_id失效错误，调用init_assistant方法重新初始化
                self.outline = []
                raw_outline, last_id = self.init_assistant(message, session_data,sys_prompt)
                self.outline = self.deal_outline(raw_outline)
                return self.outline, last_id
            else:
                # 其他错误，重新抛出
                raise e
    
    def deal_outline(self,raw_outline):
        """
        处理模型返回的字符串，将他们转换为列表，每个元素是一个分镜脚本
        """
        pattern = r'(镜号\s*\d+.*?)(?=镜号\s*\d+|$)'
        matches = re.findall(pattern, raw_outline, re.DOTALL)
        outline_list = [match.strip() for match in matches if len(match.strip()) > 10]
        return outline_list

if __name__ == "__main__":
    # 测试outline_writer功能
    writer = OutlineWriter()
    message = input("请输入您的需求：")
    while message != "exit":
        result = writer.call(message)
        print(f"Outline Writer Result: {result}")
        message = input("请输入您的需求：")