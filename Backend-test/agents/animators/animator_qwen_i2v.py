###图生视频智能体
import os
import requests
from http import HTTPStatus
from urllib.parse import urlparse, unquote
from pathlib import PurePosixPath
from dashscope import VideoSynthesis
from base import image_to_base64
# 设置 API Key（请确保已设置环境变量 DASHSCOPE_API_KEY）
modules = {
    'wan2.5': 'wan2.5-i2v-preview',
    'wan2.6': 'wan2.6-i2v-flash',
}
api_key = "sk-8c9152365e554289834e30d12885ec03"

class Animator:
    def __init__(self, name, download_link):
        self.name = name
        self.download_link = f'{download_link}/{self.name}/video'
    
    def call(self, session_data):
        screen_id = session_data['video_generating']
        prompt = session_data['material']['script'][screen_id]
        storyboard_url = image_to_base64(session_data['material']['story_board'][screen_id]['image_address'])
        video_url = self.send_request(prompt,storyboard_url)
        if video_url:
            return self.download(video_url, idx=screen_id)
        return None
    
    def send_request(self, prompt,storyboard_url):
        completion = VideoSynthesis.call(
            model=modules['wan2.6'],
            prompt=prompt['positive'],
            img_url=storyboard_url,
            resolution="720P",
            duration=5,
            prompt_extend=True,
            watermark=False,
            negative_prompt=prompt['negative'],
            seed=None  # 可选，如需复现结果可指定整数
        )
        print(completion)
        if completion.status_code == HTTPStatus.OK:
            video_url = completion.output.video_url
            print(video_url)
            return video_url
        else:
            print('Failed, status_code: %s, code: %s, message: %s' % (completion.status_code, completion.code, completion.message))

    def download(self, url, idx):
        os.makedirs(self.download_link, exist_ok=True)
        try:
            resp = requests.get(url, stream=True, timeout=30)
            resp.raise_for_status()
            file_name = PurePosixPath(unquote(urlparse(url).path)).parts[-1]
            save_path = f"{self.download_link}/{idx}.mp4"
            with open(save_path, "wb") as f:
                for chunk in resp.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            print(f"已保存：{save_path}")
            return save_path
        except Exception as e:
            print(f"下载失败 {url}：{e}")
        return None