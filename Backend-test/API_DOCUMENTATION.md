# 后端API服务接口文档

## 1. 服务概述

后端API服务是一个基于FastAPI框架开发的Web服务，用于前端与后端代理系统的交互。

### 1.1 基本信息

- **服务名称**: 后端API服务
- **版本**: 1.0.0
- **技术栈**: Python 3.10+, FastAPI, Uvicorn
- **默认端口**: 8003

## 2. API端点列表

| 方法 | 路径 | 功能描述 |
|------|------|----------|
| GET | `/` | 根路径健康检查 |
| GET | `/api/v1/health` | API版本化健康检查 |
| POST | `/api/v1/auth/register` | 用户注册 |
| POST | `/api/v1/auth/login` | 用户登录 |
| POST | `/api/v1/work` | 主要工作处理接口 |
| POST | `/api/v1/projects/list` | 获取用户项目列表 |
| POST | `/api/v1/projects/history` | 获取指定项目的对话历史 |
| POST | `/api/v1/projects/new` | 新建项目 |
| POST | `/api/v1/upload_image` | 上传图片（multipart，需 JWT；必填 `project_name` + `file`） |
| POST | `/api/v1/interaction/panel` | 获取交互面板数据 |
| POST | `/api/user/avatar` | 上传用户头像 |
| GET | `/api/v1/test-video-placeholder` | 获取测试视频占位符 |

## 3. 详细API说明

### 3.1 用户注册接口

**功能**: 用户注册并获取访问令牌

**请求**:
- **方法**: POST
- **路径**: `/api/v1/auth/register`
- **请求体**:
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "access_token": "string",
  "token_type": "bearer",
  "user": {
    "id": "integer",
    "username": "string",
    "email": "string"
  }
}
```

### 3.2 用户登录接口

**功能**: 用户登录并获取访问令牌

**请求**:
- **方法**: POST
- **路径**: `/api/v1/auth/login`
- **请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "access_token": "string",
  "token_type": "bearer",
  "user": {
    "id": "integer",
    "username": "string",
    "email": "string"
  }
}
```

### 3.3 工作处理接口

**功能**: 处理用户输入并执行相应的工作流任务

**请求**:
- **方法**: POST
- **路径**: `/api/v1/work`
- **请求体**:
```json
{
  "project_name": "string",
  "user_input": "string",
  "mode": "string",
  "video_duration": "integer",
  "modify_num": [],
  "workflow_type": "string"
}
```

**响应**:
```json
{
  "success": true,
  "message": "string",
  "end_session": false,
  "project_name": "string",
  "session_id": "string",
  "session_data": {
    "material": {
      "idea": [],
      "outline": [],
      "screen": [],
      "video_address": []
    },
    "chat_with_assistant": true,
    "modify_request": {
      "outline": null,
      "screen": null
    },
    "modify_nums": [],
    "have_modify": "int",
    "video_generating": 0,
    "message_count": 0,
    "now_task": "string",
    "now_state": "string"
  }
}
```

### 3.4 获取用户项目列表

**功能**: 获取当前用户的所有项目列表

**请求**:
- **方法**: POST
- **路径**: `/api/v1/projects/list`
- **请求体**: 无（从JWT获取用户ID）

**响应**:
```json
{
  "success": true,
  "projects": [
    {
      "project_name": "string",
      "workflow_type": "string",
      "now_task": "string"
    }
  ]
}
```

### 3.5 获取指定项目的对话历史

**功能**: 获取指定项目的完整对话历史和会话数据

**请求**:
- **方法**: POST
- **路径**: `/api/v1/projects/history`
- **请求体**:
```json
{
  "project_name": "string"
}
```

**响应**:
```json
{
  "success": true,
  "chat_history": [
    {
      "user": "string",
      "assistant": "string",
      "material": {
        "idea": null,
        "outline": [],
        "screen": [],
        "video_address": []
      }
    }
  ],
  "session_data": {
    "material": {
      "idea": [],
      "outline": [],
      "screen": [],
      "video_address": []
    },
    "chat_with_assistant": true,
    "modify_request": {
      "outline": null,
      "screen": null
    },
    "modify_nums": [],
    "have_modify": "int",
    "video_generating": 0,
    "message_count": 0,
    "now_task": "string",
    "now_state": "string"
  }
}
```

### 3.6 新建项目

**功能**: 创建新的项目并生成会话ID

**请求**:
- **方法**: POST
- **路径**: `/api/v1/projects/new`
- **请求体**:
```json
{
  "project_name": "string",
  "workflow_type": "string"
}
```

**响应**:
```json
{
  "success": true,
  "project_name": "string",
  "session_id": "string",
  "workflow_type": "string"
}
```

### 3.7 上传图片接口

**功能**: 上传图片到指定项目路径（保存为 `user_files/{user_id}/projects/{project_name}/photos/photos.png`，`user_id` 来自登录态）

**请求**:
- **方法**: POST
- **路径**: `/api/v1/upload_image`
- **鉴权**: **必填** — 请求头 `Authorization: Bearer <access_token>`（与其它需登录接口一致）；未登录返回 401。
- **请求体**: `multipart/form-data`（字段名须与下表一致，否则 FastAPI 会报「缺少字段」）
- **表单字段**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `project_name` | string | **是** | 项目名称 |
| `file` | file | **是** | 图片文件（字段名必须为 `file`） |
| `figure_name` | string | 否 | 预留字段，与前端约定一致；当前后端仍统一保存为 `photos.png`，可不传 |

- **文件限制**（与后端 `allowed_types` 一致）: `image/jpeg`、`image/jpg`、`image/png`、`image/gif`、`image/webp`；单文件最大 **10MB**。

**响应**:
```json
{
  "success": true,
  "message": "图片上传成功",
  "data": {
    "filePath": "string",
    "size": number
  }
}
```

### 3.8 交互面板数据接口

**功能**: 获取交互面板数据

**请求**:
- **方法**: POST
- **路径**: `/api/v1/interaction/panel`
- **请求体**:
```json
{
  "user_id": "string",
  "project_name": "string",
  "session_id": "string",
  "workflow": "string"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "execution": {
      "logs": [],
      "simulation_quote": "",
      "metrics": {}
    },
    "task_assets": {
      "now_task": {
        "name": "",
        "stage": "",
        "progress": 0
      },
      "materials": []
    }
  }
}
```

### 3.9 上传用户头像接口

**功能**: 上传用户头像

**请求**:
- **方法**: POST
- **路径**: `/api/user/avatar`
- **请求体**: `multipart/form-data` 格式
- **参数**:
  - `avatar`: 头像文件
  - `user_id`: 用户ID（可选）

**响应**:
```json
{
  "success": true,
  "data": {
    "avatarUrl": "string",
    "url": "string",
    "filename": "string"
  }
}
```

### 3.10 测试视频占位符接口

**功能**: 获取测试视频占位符

**请求**:
- **方法**: GET
- **路径**: `/api/v1/test-video-placeholder`

**响应**:
- 返回静态视频文件 `placeholder.mp4`

## 4. 错误处理

所有错误都会返回包含错误描述的JSON响应：

```json
{
  "success": false,
  "error": {
    "code": 500,
    "message": "错误描述"
  }
}
```

## 5. 版本历史

- **1.0.0** (初始版本)
  - 实现了所有API端点
  - 支持多用户、多项目会话管理
  - 支持测试模式
