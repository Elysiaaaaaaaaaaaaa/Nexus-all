'''
Qwen图片生成智能体，负责根据提示词生成图片
需要有t2i的生成模式和i2i的生成模式
以下代码由ai生成，未经人工审核
'''

from http import HTTPStatus
from urllib.parse import urlparse, unquote
from pathlib import PurePosixPath
import requests
from dashscope import ImageSynthesis
import os
import dashscope

dashscope.api_key = "sk-8c9152365e554289834e30d12885ec03"
dashscope.base_http_api_url = 'https://dashscope.aliyuncs.com/api/v1'

class Painter:
    def __init__(self, name, download_link):
        self.image_urls = list()
        self.name = name
        self.download_link = f'{download_link}/{self.name}/background'

    def call(self, session_data):
        screen_id = session_data['story_board_generating']
        prompt = session_data['material']['background']['prompt'][screen_id]
        self.image_urls.append(self.get_image_url(prompt))
        return self.download(self.image_urls[-1], idx=session_data['story_board_generating'])

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

    def get_image_url(self, prompt):
        print('please wait...')
        from dashscope import ImageSynthesis
        response = ImageSynthesis.call(
            model="wan2.5-t2i-preview",
            prompt = prompt['positive'],
            negative_prompt=prompt['negative'], 
            size="1696*960",
            n=1
        )
        print(response)
        if response.status_code == HTTPStatus.OK:
            image_url = response.output.results[0].url
            print(image_url)
            return image_url
        else:
            print('Failed, status_code: %s, code: %s, message: %s' %
                (response.status_code, response.code, response.message))


# 测试代码示例
if __name__ == '__main__':
    pass