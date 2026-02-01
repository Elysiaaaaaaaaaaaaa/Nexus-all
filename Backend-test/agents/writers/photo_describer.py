import os
from openai import OpenAI
from langchain.prompts import PromptTemplate
from base import upload_image,image_to_base64
import base64
from io import BytesIO
from PIL import Image

client = OpenAI(
    api_key="sk-8c9152365e554289834e30d12885ec03",
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

describer_prompt = '''
请对图片中人物的特征和服饰进行简短的描述，不超过100字。
！注意！仅描述主要人物的特征和服饰，不描述背景和环境。
'''

class Describer:
    def __init__(self):
        pass
    
    def send_request(self,image_url):
        completion = client.chat.completions.create(
            model="qwen-vl-plus",  # 此处以qwen-vl-plus为例，可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url",
                            "image_url": {
                                "url": image_url
                            }
                         },
                        {"type": "text", "text": "请对图片中人物的特征和服饰进行简短的描述，不超过100字。"},
                    ]
                },
            ],
        )
        return completion.choices[0].message.content 
    
    def call(self, session_data: dict) -> str:
        """
        接收session_data，提取figure字段中的address，上传图片生成URL，然后调用模型描述人物
        
        :param session_data: 包含figure字段的数据字典
        :return: 人物图像的描述
        """
        figure_name = session_data['user_input']
        image_path = session_data['material']['figure'][figure_name]['image_address']
        print(image_path)
        image_url = image_to_base64(image_path)
        description = self.send_request(image_url)
        return description

if __name__ == "__main__":
    pass
