import os
import time
import json

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

if __name__ == "__main__":
    test_i2v()
