import os 
from volcenginesdkarkruntime import Ark
import json
from base import upload_image,image_to_base64
from http import HTTPStatus
from urllib.parse import urlparse, unquote
from pathlib import PurePosixPath
import requests
import os

module_list = {
    'seedream4.0':'doubao-seedream-4-0-250828',
    'seedream5.0-lite':'doubao-seedream-5-0-260128'
}

client = Ark( 
    # 此为默认路径，您可根据业务所在地域进行配置 
    base_url="https://ark.cn-beijing.volces.com/api/v3", 
    # 从环境变量中获取您的 API Key。此为默认方式，您可根据需要进行修改 
    api_key="c96dbd1f-aeab-461c-90d6-8096b0baeecd", 
) 

class I2IPainter:
    """
    画师智能体，负责根据用户词创作i2i的图片
    """
    def __init__(self, name, download_link):
        self.name = name
        self.download_link = f'{download_link}/{self.name}/storyboard'
    
    def call(self, session_data):
        screen_id = session_data['video_generating']
        prompt = session_data['material']['story_board'][screen_id]['prompt']
        figure_url = image_to_base64(session_data['material']['story_board'][screen_id]['figure_image_address'])
        image_url = self.get_image_url(prompt,figure_url)
        return self.download(image_url, idx=screen_id)
    
    def reprint(self,session_data):
        screen_id = session_data['video_generating']
        prompt = session_data['modify_request']['story_board']
        image_address = session_data['material']['story_board'][session_data['video_generating']]['image_address']
        image_base64 = image_to_base64(image_address)
        imagesResponse = client.images.generate(
            model="doubao-seedream-4-0-250828",
            prompt=prompt,
            image=image_base64,
            size="2560x1440",
            sequential_image_generation="disabled",
            response_format="url",
            watermark=False
        )
        image_url = imagesResponse.data[0].url
        self.download(image_url, idx=screen_id)
        session_data['modify_request']['story_board'] = None
        return session_data
    
    
    def get_image_url(self,prompt,figure_url):
        print(prompt)
        response = client.images.generate( 
            # Replace with Model ID
            model=module_list['seedream4.0'],
            prompt='为我生成图片，要求人物长相、服饰与参考图完全一致'+prompt['positive']+prompt['negative'],
            image=[figure_url],
            size="2560x1440",
            sequential_image_generation="disabled",
            response_format="url",
            watermark=False
        ) 
        print(response)
        return response.data[0].url
    
    def download(self, url, idx):
        os.makedirs(self.download_link, exist_ok=True)
        try:
            resp = requests.get(url, stream=True, timeout=30)
            resp.raise_for_status()
            file_name = PurePosixPath(unquote(urlparse(url).path)).parts[-1]
            save_path = f"{self.download_link}/{idx}.png"
            with open(save_path, "wb") as f:
                for chunk in resp.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            print(f"已保存：{save_path}")
            return save_path
        except Exception as e:
            print(f"下载失败 {url}：{e}")



def paint(prompt):
    imagesResponse = client.images.generate(
        model="doubao-seedream-4-0-250828", 
        prompt=prompt,
        size="2K",
        response_format="url",
        watermark=False,
        sequential_image_generation = "disabled"
    ) 
    return imagesResponse.data[0].url

if __name__ == "__main__":
    painter = I2IPainter("i2i", "./user_files/czx/storyboard")