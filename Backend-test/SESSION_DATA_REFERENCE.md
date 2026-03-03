# session_data 参考文档

本文件用于记录 `run_acps.py` 中不同工作流的 `session_data` 结构，方便开发者查阅和理解。

## 1. Text2VideoWorkflow (文本到视频工作流)

### 核心结构

```python
session_data = {
    "material": {
        "idea": None,           # 创意想法
        "outline": [],          # 大纲内容
        "screen": [],           # 剧本内容
        "video_address": [],    # 生成的视频地址列表
    },
    "chat_with_assistant": True,     # 是否继续与助手对话
    "modify_request": {
        "outline": None,        # 大纲修改请求
        "screen": None,         # 剧本修改请求
    },
    "modify_num": [],                 # 需要修改的内容编号列表
    "have_modify": 0,                 # 已修改的次数
    "video_generating": 0,            # 正在生成的视频索引
    "editing_screen": None,           # 当前正在编辑的剧本
    "message_count": 0,               # 消息计数
    "now_task": "imagination",        # 当前任务类型
    "now_state": "None",             # 当前状态
    "last_id": {
        "assistant": None,           # 助手的最后一条消息ID
        "outline_writer": None,      # 大纲编写器的最后一条消息ID
        "screen_writer": None        # 剧本编写器的最后一条消息ID
    },
}
```

### 任务类型 (now_task) 说明

- `imagination`: 创意构思阶段，与助手构建影片相关的细节
- `outline`: 大纲构建阶段，生成影片的大纲
- `screen`: 剧本构建阶段，生成影片的剧本
- `animator`: 视频生成阶段，根据剧本生成视频

### 状态类型 (now_state) 说明

- `None`: 初始状态，等待用户输入
- `create`: 创建状态，正在生成内容
- `modify_confirm`: 修改确认状态，询问用户是否需要修改
- `modify`: 修改状态，用户正在与助手对话修改内容

## 2. Image2VideoWorkflow (图片到视频工作流)

### 核心结构

```python
session_data = {
    "user_input": None,           # 用户输入
    "material": {
        "idea": None,           # 创意想法
        "outline": [],          # 大纲内容
        "figure": {
            "{figure_name}":{
                "prompt": None,     # 人物提示词
                "image_address": None, # 人物图片地址
            }
        },
        "story_board": [{
            "figure_describe": None,      # 人物描述
            "figure_image_address": None, # 人物图片地址
            "prompt": None,     # 故事板提示词
            "image_address": None, # 故事板图片地址
        }],      # 故事板列表
        "script":[{
            "positive":str, # 正样本提示词
            "negative":str, # 负样本提示词
        }]#图片到视频提示词
        "video_address": [],    # 生成的视频地址列表
    },
    "chat_with_assistant": True,     # 是否继续与助手对话
    "modify_request": {
        "outline": None,        # 大纲修改请求
        "figure": None,         # 人物修改请求
        "story_board": None,    # 故事板修改请求
        "script": None,         # 剧本修改请求
    },
    "story_board_generating": 0,       # 正在生成的故事板索引
    "have_modify": 0,                  # 已修改的次数
    "video_generating": 0,             # 正在生成的视频索引
    "message_count": 0,                # 消息计数
    "now_task": str,         # 当前任务类型
    "now_state": "None",              # 当前状态
    "last_id": {
        "assistant": str,             # 助手的最后一条消息ID，用于上下文缓存
        "outline_writer": str,        # 大纲编写智能体的最后一条消息ID，用于上下文缓存
        "story_board": str          # 故事板编写智能体的最后一条消息ID，用于上下文缓存
        "script": str              # 剧本编写智能体的最后一条消息ID，用于上下文缓存
    },
}
```

### 任务类型 (now_task) 说明

- `imagination`: 创意构思阶段，与助手构建影片相关的细节
- `outline`: 大纲构建阶段，生成影片的大纲
- `figure`: 人物设计阶段，设计影片中的人物
- `story_board`: 故事板生成阶段，生成分镜首帧
- `script`: 剧本生成阶段，生成分镜首帧图片到视频的提示词
- `animator`: 视频生成阶段，根据提示词生成视频

### 状态类型 (now_state) 说明

- `None`: 初始状态，等待用户输入
- `create`: 创建状态，正在生成内容
- `modify_confirm`: 修改确认状态，询问用户是否需要修改
- `modify`: 修改状态，用户正在与助手对话修改内容

本文档会随着工作流的更新而定期维护，如有变更请及时更新。