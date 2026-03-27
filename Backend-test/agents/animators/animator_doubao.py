import os
import time
import json
import sys

# 添加 Backend-test 目录到 Python 路径，以便能够导入 base 模块
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

# 通过 pip install 'volcengine-python-sdk[ark]' 安装方舟SDK
from volcenginesdkarkruntime import Ark
import requests
from base import image_to_base64

# 请确保您已将 API Key 存储在环境变量 ARK_API_KEY 中
# 初始化Ark客户端，从环境变量中读取您的API Key
client = Ark(
    # 此为默认路径，您可根据业务所在地域进行配置
    base_url="https://ark.cn-beijing.volces.com/api/v3",
    # 从环境变量中获取您的 API Key。此为默认方式，您可根据需要进行修改
    api_key="c96dbd1f-aeab-461c-90d6-8096b0baeecd",
)

class T2VAnimator:
    def __init__(self, name, download_link):
        self.name = name
        self.download_link = f'{download_link}/{self.name}/video'
    
    def call(self, session_data):
        screen_id = session_data['video_generating']
        prompt = session_data['material']['screen'][screen_id]
        video_url = self.get_video_url(prompt)
        return self.download(video_url,idx = screen_id)

    def download(self,video_url,idx):
        os.makedirs(self.download_link, exist_ok=True)
        try:
            resp = requests.get(video_url, stream=True, timeout=30)
            resp.raise_for_status()
            save_path = f"{self.download_link}/{self.name}_{idx}.mp4"
            with open(save_path, "wb") as f:
                for chunk in resp.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            print(f"已保存：{save_path}")
            return save_path
        except Exception as e:
            print(f"下载失败 {video_url}：{e}")
    
    def get_video_url(self,prompt):
        create_result = client.content_generation.tasks.create(
            model="doubao-seedance-1-0-pro-250528", # Replace with Model ID 
            content=[
                {
                    # Combination of text prompt and parameters
                    "type": "text",
                    "text": prompt,
                    "draft": True
                }
            ],
            duration=5,
            watermark=False,
        )
        task_id = create_result.id
        while 1:
            get_result = client.content_generation.tasks.get(task_id=task_id)
            status = get_result.status
            if status == "succeeded":
                return get_result.content.video_url
            elif status == "failed":
                print(f"----- task failed -----")
                print(f"Error: {get_result.error}")
                break
            video_link = f"{self.download_link}/{self.name}_{cnt}.mp4"
            if os.path.exists(video_link):
                print("视频已存在，跳过创建请求")
                cnt+=1
                continue
            create_result = client.content_generation.tasks.create(
                model="doubao-seedance-1-0-pro-fast-251015",  # 模型 Model ID 已为您填入
                content=[
                    {
                        # 文本提示词与参数组合
                        "type": "text",
                        "text": f"{outline}  --resolution 720p  --duration 6 --camerafixed false --watermark true"
                    }
                ]
            )
            print("----- polling task status -----")
            task_id = create_result.id
            while True:
                get_result = client.content_generation.tasks.get(task_id=task_id)
                status = get_result.status
                if status == "succeeded":
                    print("----- task succeeded -----")
                    print(get_result)
                    self.video_url.append(get_result.content.video_url)
                    break
                elif status == "failed":
                    print("----- task failed -----")
                    print(f"Error: {get_result.error}")
                    break
                else:
                    print(f"Current status: {status}, Retrying after 3 seconds...")
                    time.sleep(3)
            cnt+=1

class I2VAnimator:
    def __init__(self, name, download_link):
        self.name = name
        self.download_link = f'{download_link}/{self.name}/video'

    def call(self, session_data):
        screen_id = session_data['video_generating']
        prompt = session_data['material']['script'][screen_id]['positive']+session_data['material']['script'][screen_id]['negative']
        storyboard_url = image_to_base64(session_data['material']['story_board'][screen_id]['image_address'])
        video_url = self.send_request(prompt,storyboard_url)
        if video_url:
            return self.download(video_url, idx=screen_id)
        return None

    def send_request(self, prompt,storyboard_url):
        create_result = client.content_generation.tasks.create(
        model="doubao-seedance-1-5-pro-251215", # Replace with Model ID
        content=[
            {
                # Combination of text prompt and parameters
                "type": "text",
                "text": prompt
            },
            {
                # The URL of the first frame image
                "type": "image_url",
                "image_url": {
                    "url": storyboard_url
                }
            }
        ],
        draft=True,
        duration=5,
        generate_audio=True,
        watermark=False,
    )
        task_id = create_result.id
        while 1:
            get_result = client.content_generation.tasks.get(task_id=task_id)
            status = get_result.status
            if status == "succeeded":
                print(f"成功生成视频，长度：{get_result.duration}秒")
                return get_result.content.video_url
            elif status == "failed":
                print(f"----- task failed -----")
                print(f"Error: {get_result.error}")
                break
            else:
                print(f"Current status: {status}, Retrying after 5 seconds...")
                time.sleep(5)

    def download(self,video_url,idx):
        os.makedirs(self.download_link, exist_ok=True)
        try:
            resp = requests.get(video_url, stream=True, timeout=30)
            resp.raise_for_status()
            save_path = f"{self.download_link}/{self.name}_{idx}.mp4"
            with open(save_path, "wb") as f:
                for chunk in resp.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            print(f"已保存：{save_path}")
            return save_path
        except Exception as e:
            print(f"下载失败 {video_url}：{e}")

def test_t2v():
    animator = T2VAnimator("feibi", ".Backend-test/test/test_t2v")
    prompt = "镜号 1\n场景：巴黎蒙马特街区的鹅卵石街道旁，午后暖光（暖金色调）透过法国梧桐叶形成斑驳光影，落在爬满深绿色常春藤的米灰色石墙上；花架（深棕色木质）上向日葵（明黄色）金芒闪烁、薰衣草（淡紫色）紫雾朦胧、红玫瑰（艳红色）娇艳欲滴，店招\"Fleurs de Lumière\"（光之花）以暖棕色木质字体呈现，在阳光中泛着柔和光泽，几片玫瑰花瓣随微风轻舞。\n【风格】印象派油画风格，色彩明快柔和（暖金+明黄+淡紫+艳红+深绿+米灰），笔触短促松散（如莫奈笔触），光影层次丰富（斑驳光影在墙面花瓣上形成颤动效果，阴影为淡蓝色冷调），突出午后慵懒氛围。\n【角色】花店店主（女性，25-30岁）：微卷棕发（镀暖金边框），穿黑白相间欧式长款女仆装（白色蕾丝领结系于领口，裙摆为黑色），跪坐在深棕色木质台阶上；手指纤细（淡粉色指甲油），轻捏米白色丝带专注包裹向日葵花束，嘴角挂浅淡笑意（眼尾微弯）。\n【镜头】1. 初始镜头：全景拉远，从梧桐叶光影特写（暖金+深绿笔触）快速拉远至街区全景（鹅卵石街道延伸至远处的蒙马特小丘轮廓），突出花店在街区中的位置；2. 聚焦镜头：中景定格花店整体（花架+石墙+店招），随后镜头缓慢推近至台阶，聚焦店主包裹花束的动作；3. 细节镜头：特写花瓣飘落瞬间（明黄向日葵花瓣+艳红玫瑰花瓣，笔触呈现颤动光影），同时保留店主微卷发的暖金光影作为背景。\n【对白】无（仅背景氛围音）\n【音效】远处模糊的法语交谈声（\"Bonjour madame\"）、轻脆鸟鸣、微风拂过树叶的沙沙声、丝带摩擦的细微声响"
    session_data = {
        "video_generating": 0,
        "material": {
            "screen": [prompt]
        }
    }
    result = animator.call(session_data)
    print(result)

def test_i2v():
    animator = I2VAnimator("feibi", ".Backend-test/test/test_i2v")
    storyboard_link = r"D:\我太想进步了\python\我的程序\2025智能体课程\我的项目\user_files\czx\projects\菲比拉电线\storyboard\0.png"
    prompt = '菲比拿起电线朝建筑物内的电箱走去'
    session_data = {
        "video_generating": 0,
        "material": {
            "script": [{"positive":prompt,"negative":""}],
            "story_board": [{
                "image_address": storyboard_link
            }]
        }
    }
    result = animator.call(session_data)
    print(result)

if __name__ == "__main__":
    test_i2v()
