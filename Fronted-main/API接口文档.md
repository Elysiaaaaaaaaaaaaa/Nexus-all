# Nexus Frontend API 接口文档

> 本文档基于所有 JSX 页面功能分析生成，按照 ApiFox 设计规范提取关键数据字段

## 📋 目录

- [1. 认证模块](#1-认证模块)
- [2. 用户管理模块](#2-用户管理模块)
- [3. 智能体管理模块](#3-智能体管理模块)
- [4. 项目管理模块](#4-项目管理模块)
- [5. 内容生成模块](#5-内容生成模块)
- [6. 历史记录模块](#6-历史记录模块)
- [7. 数据分析模块](#7-数据分析模块)
- [8. 系统设置模块](#8-系统设置模块)
- [9. 文件上传模块](#9-文件上传模块)
- [10. 实时交互模块](#10-实时交互模块)

---

## 1. 认证模块

### 1.1 用户登录

**接口描述：** 用户登录系统

**请求信息：**
- **请求方法：** `POST`
- **请求路径：** `/api/auth/login`
- **Content-Type：** `application/json`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| username | string | 是 | 用户名 | "zhanghengji" |
| password | string | 是 | 密码（加密传输） | "******" |

**请求示例：**
```json
{
  "username": "zhanghengji",
  "password": "encrypted_password"
}
```

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "登录成功" |
| data | object | 响应数据 | - |
| data.token | string | JWT访问令牌 | "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." |
| data.refreshToken | string | 刷新令牌 | "refresh_token_string" |
| data.user | object | 用户信息 | - |
| data.user.id | number | 用户ID | 1 |
| data.user.username | string | 用户名 | "zhanghengji" |
| data.user.email | string | 邮箱 | "zhanghengji@example.com" |
| data.user.avatar | string | 头像URL | "https://example.com/avatar.jpg" |
| data.user.workspace | string | 工作区名称 | "专业工作区" |
| data.expiresIn | number | 令牌过期时间（秒） | 3600 |

**响应示例：**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_string",
    "user": {
      "id": 1,
      "username": "zhanghengji",
      "email": "zhanghengji@example.com",
      "avatar": "https://example.com/avatar.jpg",
      "workspace": "专业工作区"
    },
    "expiresIn": 3600
  }
}
```

**错误响应：**
```json
{
  "code": 401,
  "message": "用户名或密码错误",
  "data": null
}
```

---

### 1.2 用户注册

**接口描述：** 新用户注册

**请求信息：**
- **请求方法：** `POST`
- **请求路径：** `/api/auth/register`
- **Content-Type：** `application/json`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| username | string | 是 | 用户名（3-20字符） | "zhanghengji" |
| email | string | 是 | 邮箱地址 | "zhanghengji@example.com" |
| password | string | 是 | 密码（8-20字符，包含字母和数字） | "password123" |
| confirmPassword | string | 是 | 确认密码 | "password123" |

**请求示例：**
```json
{
  "username": "zhanghengji",
  "email": "zhanghengji@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "注册成功" |
| data | object | 响应数据 | - |
| data.userId | number | 新用户ID | 1 |

**响应示例：**
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "userId": 1
  }
}
```

---

### 1.3 刷新令牌

**接口描述：** 使用刷新令牌获取新的访问令牌

**请求信息：**
- **请求方法：** `POST`
- **请求路径：** `/api/auth/refresh`
- **Content-Type：** `application/json`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| refreshToken | string | 是 | 刷新令牌 | "refresh_token_string" |

**响应参数：** 同登录接口

---

## 2. 用户管理模块

### 2.1 获取用户信息

**接口描述：** 获取当前登录用户的详细信息

**请求信息：**
- **请求方法：** `GET`
- **请求路径：** `/api/user/profile`
- **请求头：** `Authorization: Bearer {token}`

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "获取成功" |
| data | object | 用户信息 | - |
| data.id | number | 用户ID | 1 |
| data.username | string | 用户名 | "张恒基" |
| data.email | string | 邮箱 | "zhanghengji@example.com" |
| data.avatar | string | 头像URL | "https://example.com/avatar.jpg" |
| data.workspace | string | 工作区名称 | "专业工作区" |
| data.createdAt | string | 创建时间 | "2024-01-01T00:00:00Z" |
| data.updatedAt | string | 更新时间 | "2024-01-15T10:30:00Z" |

---

### 2.2 更新用户信息

**接口描述：** 更新用户个人信息

**请求信息：**
- **请求方法：** `PUT`
- **请求路径：** `/api/user/profile`
- **Content-Type：** `application/json`
- **请求头：** `Authorization: Bearer {token}`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| username | string | 否 | 用户名 | "张恒基" |
| email | string | 否 | 邮箱 | "zhanghengji@example.com" |
| workspace | string | 否 | 工作区名称 | "专业工作区" |
| avatar | file | 否 | 头像文件 | - |

**响应参数：** 同获取用户信息接口

---

### 2.3 上传用户头像

**接口描述：** 上传用户头像图片

**请求信息：**
- **请求方法：** `POST`
- **请求路径：** `/api/user/avatar`
- **Content-Type：** `multipart/form-data`
- **请求头：** `Authorization: Bearer {token}`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| avatar | file | 是 | 头像图片文件（支持jpg、png，最大5MB） | - |

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "上传成功" |
| data | object | 响应数据 | - |
| data.avatarUrl | string | 头像URL | "https://example.com/avatars/user_1.jpg" |

---

## 3. 智能体管理模块

### 3.1 获取智能体列表

**接口描述：** 获取所有智能体列表，支持搜索和筛选

**请求信息：**
- **请求方法：** `GET`
- **请求路径：** `/api/agents`
- **请求头：** `Authorization: Bearer {token}`

**查询参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| search | string | 否 | 搜索关键词（名称或角色） | "编排器" |
| status | string | 否 | 状态筛选（在线/忙碌/空闲） | "在线" |
| page | number | 否 | 页码（默认1） | 1 |
| pageSize | number | 否 | 每页数量（默认20） | 20 |

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "获取成功" |
| data | object | 响应数据 | |
| data.list | array | 智能体列表 | - |
| data.list[].id | number | 智能体ID | 1 |
| data.list[].name | string | 智能体名称 | "编排器 V2" |
| data.list[].role | string | 角色描述 | "工作流逻辑" |
| data.list[].status | string | 状态（在线/忙碌/空闲） | "在线" |
| data.list[].power | number | 核心负载百分比 | 98 |
| data.list[].icon | string | 图标标识 | "cpu" |
| data.list[].color | string | 主题颜色 | "rgb(37, 99, 235)" |
| data.list[].bg | string | 背景颜色 | "rgb(239, 246, 255)" |
| data.list[].description | string | 详细描述 | "负责协调和管理复杂的工作流程..." |
| data.total | number | 总数量 | 8 |
| data.page | number | 当前页码 | 1 |
| data.pageSize | number | 每页数量 | 20 |

**响应示例：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "编排器 V2",
        "role": "工作流逻辑",
        "status": "在线",
        "power": 98,
        "icon": "cpu",
        "color": "rgb(37, 99, 235)",
        "bg": "rgb(239, 246, 255)",
        "description": "负责协调和管理复杂的工作流程，确保各个任务按顺序正确执行。"
      }
    ],
    "total": 8,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 3.2 获取智能体详情

**接口描述：** 获取指定智能体的详细信息

**请求信息：**
- **请求方法：** `GET`
- **请求路径：** `/api/agents/{id}`
- **请求头：** `Authorization: Bearer {token}`

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| id | number | 是 | 智能体ID | 1 |

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "获取成功" |
| data | object | 智能体详细信息 | - |
| data.id | number | 智能体ID | 1 |
| data.name | string | 智能体名称 | "编排器 V2" |
| data.role | string | 角色描述 | "工作流逻辑" |
| data.status | string | 状态 | "在线" |
| data.power | number | 核心负载 | 98 |
| data.description | string | 详细描述 | "负责协调和管理复杂的工作流程..." |
| data.config | object | 配置信息 | - |
| data.config.temperature | number | 温度参数 | 0.7 |
| data.config.maxTokens | number | 最大token数 | 4096 |
| data.metrics | object | 性能指标 | - |
| data.metrics.totalTasks | number | 总任务数 | 1234 |
| data.metrics.successRate | number | 成功率 | 98.5 |
| data.metrics.avgResponseTime | number | 平均响应时间（ms） | 1200 |

---

### 3.3 创建智能体

**接口描述：** 创建新的智能体

**请求信息：**
- **请求方法：** `POST`
- **请求路径：** `/api/agents`
- **Content-Type：** `application/json`
- **请求头：** `Authorization: Bearer {token}`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| name | string | 是 | 智能体名称 | "新智能体" |
| role | string | 是 | 角色描述 | "任务处理" |
| description | string | 否 | 详细描述 | "智能体描述" |
| config | object | 否 | 配置信息 | - |
| config.temperature | number | 否 | 温度参数 | 0.7 |
| config.model | string | 否 | 使用的模型 | "GPT-4o" |

**响应参数：** 同获取智能体详情接口

---

### 3.4 更新智能体

**接口描述：** 更新智能体信息

**请求信息：**
- **请求方法：** `PUT`
- **请求路径：** `/api/agents/{id}`
- **Content-Type：** `application/json`
- **请求头：** `Authorization: Bearer {token}`

**请求参数：** 同创建智能体接口（所有字段可选）

---

### 3.5 删除智能体

**接口描述：** 删除指定智能体

**请求信息：**
- **请求方法：** `DELETE`
- **请求路径：** `/api/agents/{id}`
- **请求头：** `Authorization: Bearer {token}`

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "删除成功" |
| data | null | - | null |

---

### 3.6 启动智能体任务

**接口描述：** 启动智能体执行任务

**请求信息：**
- **请求方法：** `POST`
- **请求路径：** `/api/agents/{id}/start`
- **Content-Type：** `application/json`
- **请求头：** `Authorization: Bearer {token}`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| taskType | string | 是 | 任务类型 | "video_generation" |
| params | object | 否 | 任务参数 | - |

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "任务已启动" |
| data | object | 响应数据 | - |
| data.taskId | number | 任务ID | 123 |
| data.status | string | 任务状态 | "running" |

---

## 4. 项目管理模块

### 4.1 获取项目列表

**接口描述：** 获取项目列表，支持搜索和筛选

**请求信息：**
- **请求方法：** `GET`
- **请求路径：** `/api/projects`
- **请求头：** `Authorization: Bearer {token}`

**查询参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| search | string | 否 | 搜索关键词 | "东京" |
| status | string | 否 | 状态筛选（进行中/已完成/规划中/已暂停） | "进行中" |
| page | number | 否 | 页码 | 1 |
| pageSize | number | 否 | 每页数量 | 20 |

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "获取成功" |
| data | object | 响应数据 | - |
| data.list | array | 项目列表 | - |
| data.list[].id | number | 项目ID | 1 |
| data.list[].name | string | 项目名称 | "霓虹东京开场视频" |
| data.list[].description | string | 项目描述 | "赛博朋克风格的3D动画开场" |
| data.list[].status | string | 状态 | "进行中" |
| data.list[].progress | number | 进度百分比 | 65 |
| data.list[].members | number | 成员数量 | 3 |
| data.list[].updated | string | 更新时间 | "2小时前" |
| data.list[].color | string | 主题颜色 | "rgb(37, 99, 235)" |
| data.list[].bgColor | string | 背景颜色 | "rgb(239, 246, 255)" |
| data.total | number | 总数量 | 6 |
| data.page | number | 当前页码 | 1 |
| data.pageSize | number | 每页数量 | 20 |

---

### 4.2 获取项目详情

**接口描述：** 获取指定项目的详细信息

**请求信息：**
- **请求方法：** `GET`
- **请求路径：** `/api/projects/{id}`
- **请求头：** `Authorization: Bearer {token}`

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "获取成功" |
| data | object | 项目详情 | - |
| data.id | number | 项目ID | 1 |
| data.name | string | 项目名称 | "霓虹东京开场视频" |
| data.description | string | 项目描述 | "赛博朋克风格的3D动画开场" |
| data.status | string | 状态 | "进行中" |
| data.progress | number | 进度 | 65 |
| data.members | array | 成员列表 | - |
| data.members[].id | number | 成员ID | 1 |
| data.members[].username | string | 成员用户名 | "张恒基" |
| data.members[].avatar | string | 成员头像 | "https://example.com/avatar.jpg" |
| data.createdAt | string | 创建时间 | "2024-01-10T10:00:00Z" |
| data.updatedAt | string | 更新时间 | "2024-01-15T14:30:00Z" |
| data.tasks | array | 任务列表 | - |
| data.tasks[].id | number | 任务ID | 1 |
| data.tasks[].title | string | 任务标题 | "场景渲染" |
| data.tasks[].status | string | 任务状态 | "进行中" |

---

### 4.3 创建项目

**接口描述：** 创建新项目

**请求信息：**
- **请求方法：** `POST`
- **请求路径：** `/api/projects`
- **Content-Type：** `application/json`
- **请求头：** `Authorization: Bearer {token}`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| name | string | 是 | 项目名称 | "新项目" |
| description | string | 否 | 项目描述 | "项目描述" |
| status | string | 否 | 初始状态（默认"规划中"） | "规划中" |

**响应参数：** 同获取项目详情接口

---

### 4.4 更新项目

**接口描述：** 更新项目信息

**请求信息：**
- **请求方法：** `PUT`
- **请求路径：** `/api/projects/{id}`
- **Content-Type：** `application/json`
- **请求头：** `Authorization: Bearer {token}`

**请求参数：** 同创建项目接口（所有字段可选）

---

### 4.5 删除项目

**接口描述：** 删除指定项目

**请求信息：**
- **请求方法：** `DELETE`
- **请求路径：** `/api/projects/{id}`
- **请求头：** `Authorization: Bearer {token}`

---

## 5. 内容生成模块

### 5.1 视频生成

**接口描述：** 根据脚本生成视频

**请求信息：**
- **请求方法：** `POST`
- **请求路径：** `/api/generation/video`
- **Content-Type：** `multipart/form-data`
- **请求头：** `Authorization: Bearer {token}`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| script | string | 是 | 视频脚本内容 | "场景1：城市夜景..." |
| scriptFile | file | 否 | 脚本文件（.txt, .md, .doc, .docx） | - |
| resolution | string | 否 | 分辨率（默认"1920x1080"） | "1920x1080" |
| frameRate | number | 否 | 帧率（默认24） | 24 |
| style | string | 否 | 风格（写实/卡通/赛博朋克/简约） | "赛博朋克" |

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "任务已创建" |
| data | object | 响应数据 | - |
| data.taskId | number | 任务ID | 123 |
| data.status | string | 任务状态 | "processing" |
| data.estimatedTime | number | 预计完成时间（秒） | 300 |

---

### 5.2 获取视频生成进度

**接口描述：** 获取视频生成任务的进度

**请求信息：**
- **请求方法：** `GET`
- **请求路径：** `/api/generation/video/{taskId}/progress`
- **请求头：** `Authorization: Bearer {token}`

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "获取成功" |
| data | object | 响应数据 | - |
| data.taskId | number | 任务ID | 123 |
| data.progress | number | 进度百分比 | 65 |
| data.status | string | 任务状态 | "processing" |
| data.currentStep | string | 当前步骤 | "渲染场景" |
| data.steps | array | 步骤列表 | - |
| data.steps[].name | string | 步骤名称 | "解析脚本" |
| data.steps[].status | string | 步骤状态 | "completed" |
| data.videoUrl | string | 视频URL（完成时） | "https://example.com/video.mp4" |

---

### 5.3 图像生成

**接口描述：** 根据提示词生成图像

**请求信息：**
- **请求方法：** `POST`
- **请求路径：** `/api/generation/image`
- **Content-Type：** `application/json`
- **请求头：** `Authorization: Bearer {token}`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| prompt | string | 是 | 图像描述提示词 | "一只可爱的猫咪坐在窗台上..." |
| referenceImage | file | 否 | 参考图片 | - |
| style | string | 否 | 风格（写实/卡通/水彩/油画/数字艺术） | "水彩" |
| size | string | 否 | 尺寸（默认"1024x1024"） | "1024x1024" |
| count | number | 否 | 生成数量（默认1，最大9） | 4 |

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "生成成功" |
| data | object | 响应数据 | - |
| data.taskId | number | 任务ID | 124 |
| data.images | array | 生成的图像列表 | - |
| data.images[].id | number | 图像ID | 1 |
| data.images[].url | string | 图像URL | "https://example.com/image1.jpg" |
| data.images[].prompt | string | 使用的提示词 | "一只可爱的猫咪..." |

---

### 5.4 音频生成

**接口描述：** 根据描述生成音频/音乐

**请求信息：**
- **请求方法：** `POST`
- **请求路径：** `/api/generation/audio`
- **Content-Type：** `application/json`
- **请求头：** `Authorization: Bearer {token}`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| prompt | string | 是 | 音乐创作需求描述 | "创作一首轻松愉快的背景音乐..." |
| referenceAudio | file | 否 | 参考音频文件 | - |
| style | string | 否 | 音乐风格（爵士/电子/古典/流行/摇滚） | "爵士" |
| duration | number | 否 | 时长（秒，默认120） | 120 |
| instruments | array | 否 | 乐器列表 | ["钢琴", "萨克斯风"] |

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "生成成功" |
| data | object | 响应数据 | - |
| data.taskId | number | 任务ID | 125 |
| data.audioUrl | string | 音频URL | "https://example.com/audio.mp3" |
| data.duration | number | 音频时长（秒） | 120 |

---

### 5.5 UI设计生成

**接口描述：** 根据需求生成UI设计

**请求信息：**
- **请求方法：** `POST`
- **请求路径：** `/api/generation/ui-design`
- **Content-Type：** `application/json`
- **请求头：** `Authorization: Bearer {token}`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| prompt | string | 是 | 设计需求描述 | "设计一个电商网站的首页..." |
| style | string | 否 | 设计风格（现代简约/商务专业/活泼创意/优雅高端） | "现代简约" |
| components | array | 否 | 需要的组件列表 | ["导航栏", "轮播图", "商品展示"] |

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "生成成功" |
| data | object | 响应数据 | - |
| data.taskId | number | 任务ID | 126 |
| data.designUrl | string | 设计预览图URL | "https://example.com/design.png" |
| data.codeUrl | string | 代码文件URL | "https://example.com/code.zip" |

---

## 6. 历史记录模块

### 6.1 获取历史记录列表

**接口描述：** 获取用户的历史记录列表

**请求信息：**
- **请求方法：** `GET`
- **请求路径：** `/api/history`
- **请求头：** `Authorization: Bearer {token}`

**查询参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| search | string | 否 | 搜索关键词（标题、提示词） | "赛博朋克" |
| status | string | 否 | 状态筛选（全部/生成中/已完成/草稿） | "全部" |
| type | string | 否 | 类型筛选（视频/代码/分析/翻译/图像/文档/音频） | - |
| page | number | 否 | 页码 | 1 |
| pageSize | number | 否 | 每页数量 | 20 |

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "获取成功" |
| data | object | 响应数据 | - |
| data.list | array | 历史记录列表 | - |
| data.list[].id | number | 记录ID | 1 |
| data.list[].title | string | 标题 | "赛博朋克城市开场" |
| data.list[].type | string | 类型 | "video" |
| data.list[].status | string | 状态 | "生成中" |
| data.list[].time | string | 时间描述 | "2分钟前" |
| data.list[].info | string | 附加信息 | "3个智能体" |
| data.list[].icon | string | 图标标识 | "film_strip" |
| data.list[].color | string | 主题颜色 | "rgb(219, 234, 255)" |
| data.list[].textColor | string | 文字颜色 | "rgb(37, 99, 235)" |
| data.total | number | 总数量 | 100 |
| data.page | number | 当前页码 | 1 |
| data.pageSize | number | 每页数量 | 20 |

---

### 6.2 获取历史记录详情

**接口描述：** 获取指定历史记录的详细信息

**请求信息：**
- **请求方法：** `GET`
- **请求路径：** `/api/history/{id}`
- **请求头：** `Authorization: Bearer {token}`

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "获取成功" |
| data | object | 历史记录详情 | - |
| data.id | number | 记录ID | 1 |
| data.title | string | 标题 | "赛博朋克城市开场" |
| data.description | string | 任务描述 | "创建一个赛博朋克风格的3D城市开场动画..." |
| data.status | string | 状态 | "生成中" |
| data.progress | number | 完成进度 | 65 |
| data.agents | array | 参与的智能体 | ["动画专家", "编排器 V2"] |
| data.createdAt | string | 创建时间 | "2024-01-15T14:30:00Z" |
| data.updatedAt | string | 更新时间 | "2024-01-15T14:32:00Z" |
| data.resultUrl | string | 结果文件URL | "https://example.com/result.mp4" |
| data.timeline | array | 时间线事件 | - |
| data.timeline[].event | string | 事件名称 | "创建任务" |
| data.timeline[].time | string | 事件时间 | "2024-01-15T14:30:00Z" |

---

### 6.3 删除历史记录

**接口描述：** 删除指定的历史记录

**请求信息：**
- **请求方法：** `DELETE`
- **请求路径：** `/api/history/{id}`
- **请求头：** `Authorization: Bearer {token}`

---

### 6.4 下载历史记录结果

**接口描述：** 获取历史记录结果文件的下载链接

**请求信息：**
- **请求方法：** `GET`
- **请求路径：** `/api/history/{id}/download`
- **请求头：** `Authorization: Bearer {token}`

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "获取成功" |
| data | object | 响应数据 | - |
| data.downloadUrl | string | 下载链接 | "https://example.com/download/xxx" |
| data.expiresIn | number | 链接过期时间（秒） | 3600 |

---

## 7. 数据分析模块

### 7.1 获取统计数据

**接口描述：** 获取系统统计数据

**请求信息：**
- **请求方法：** `GET`
- **请求路径：** `/api/analytics/stats`
- **请求头：** `Authorization: Bearer {token}`

**查询参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| timeRange | string | 否 | 时间范围（今天/7天/30天/90天） | "7天" |

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "获取成功" |
| data | object | 统计数据 | - |
| data.totalTasks | number | 总任务数 | 1234 |
| data.totalTasksChange | number | 总任务数变化百分比 | 12.5 |
| data.completionRate | number | 完成率 | 89.2 |
| data.completionRateChange | number | 完成率变化百分比 | 3.2 |
| data.activeUsers | number | 活跃用户数 | 456 |
| data.activeUsersChange | number | 活跃用户数变化百分比 | -2.1 |
| data.avgResponseTime | number | 平均响应时间（秒） | 1.2 |
| data.avgResponseTimeChange | number | 平均响应时间变化百分比 | -15.3 |

---

### 7.2 获取任务完成趋势

**接口描述：** 获取任务完成趋势数据

**请求信息：**
- **请求方法：** `GET`
- **请求路径：** `/api/analytics/task-trend`
- **请求头：** `Authorization: Bearer {token}`

**查询参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| timeRange | string | 否 | 时间范围 | "7天" |

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "获取成功" |
| data | object | 趋势数据 | - |
| data.dates | array | 日期列表 | ["2024-01-09", "2024-01-10", ...] |
| data.completed | array | 每日完成数 | [65, 80, 45, ...] |
| data.total | array | 每日总数 | [100, 120, 90, ...] |

---

### 7.3 获取智能体使用分布

**接口描述：** 获取智能体使用分布数据

**请求信息：**
- **请求方法：** `GET`
- **请求路径：** `/api/analytics/agent-distribution`
- **请求头：** `Authorization: Bearer {token}`

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "获取成功" |
| data | array | 分布数据 | - |
| data[].agentId | number | 智能体ID | 1 |
| data[].agentName | string | 智能体名称 | "编排器 V2" |
| data[].usageCount | number | 使用次数 | 1234 |
| data[].percentage | number | 占比百分比 | 35 |

---

### 7.4 获取热门智能体

**接口描述：** 获取热门智能体排行

**请求信息：**
- **请求方法：** `GET`
- **请求路径：** `/api/analytics/popular-agents`
- **请求头：** `Authorization: Bearer {token}`

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "获取成功" |
| data | array | 智能体列表 | - |
| data[].agentId | number | 智能体ID | 1 |
| data[].agentName | string | 智能体名称 | "编排器 V2" |
| data[].usageCount | number | 使用次数 | 1234 |
| data[].successRate | number | 成功率 | 98.5 |

---

### 7.5 获取任务类型分布

**接口描述：** 获取任务类型分布数据

**请求信息：**
- **请求方法：** `GET`
- **请求路径：** `/api/analytics/task-type-distribution`
- **请求头：** `Authorization: Bearer {token}`

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "获取成功" |
| data | array | 类型分布 | - |
| data[].type | string | 任务类型 | "视频生成" |
| data[].count | number | 数量 | 456 |
| data[].percentage | number | 占比 | 37 |

---

### 7.6 获取性能指标

**接口描述：** 获取系统性能指标

**请求信息：**
- **请求方法：** `GET`
- **请求路径：** `/api/analytics/performance`
- **请求头：** `Authorization: Bearer {token}`

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "获取成功" |
| data | object | 性能指标 | - |
| data.cpuUsage | number | CPU使用率 | 68 |
| data.memoryUsage | number | 内存使用率 | 45 |
| data.networkBandwidth | number | 网络带宽使用率 | 82 |
| data.storageUsage | number | 存储使用率 | 34 |

---

### 7.7 获取最近活动

**接口描述：** 获取系统最近活动记录

**请求信息：**
- **请求方法：** `GET`
- **请求路径：** `/api/analytics/recent-activities`
- **请求头：** `Authorization: Bearer {token}`

**查询参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| limit | number | 否 | 返回数量（默认10） | 10 |

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "获取成功" |
| data | array | 活动列表 | - |
| data[].id | number | 活动ID | 1 |
| data[].action | string | 操作类型 | "完成项目" |
| data[].project | string | 项目名称 | "霓虹东京开场视频" |
| data[].time | string | 时间描述 | "2分钟前" |
| data[].type | string | 活动类型 | "success" |

---

## 8. 系统设置模块

### 8.1 获取系统设置

**接口描述：** 获取用户的系统设置

**请求信息：**
- **请求方法：** `GET`
- **请求路径：** `/api/settings`
- **请求头：** `Authorization: Bearer {token}`

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "获取成功" |
| data | object | 设置数据 | - |
| data.model | object | 模型设置 | - |
| data.model.primaryModel | string | 主要模型 | "GPT-4o" |
| data.model.reasoningEffort | string | 推理强度 | "Balanced" |
| data.model.temperature | number | 温度参数 | 0.7 |
| data.model.apiKey | string | API密钥（脱敏） | "sk-xxxx..." |
| data.persona | object | 智能体角色设置 | - |
| data.persona.systemInstruction | string | 系统指令 | "您是Nexus..." |
| data.interface | object | 界面设置 | - |
| data.interface.language | string | 语言 | "zh-CN" |
| data.interface.theme | string | 主题 | "light" |
| data.notification | object | 通知设置 | - |
| data.notification.emailEnabled | boolean | 邮件通知 | true |
| data.security | object | 安全设置 | - |
| data.security.twoFactorEnabled | boolean | 双因素认证 | false |

---

### 8.2 更新系统设置

**接口描述：** 更新用户的系统设置

**请求信息：**
- **请求方法：** `PUT`
- **请求路径：** `/api/settings`
- **Content-Type：** `application/json`
- **请求头：** `Authorization: Bearer {token}`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| model | object | 否 | 模型设置 | - |
| model.primaryModel | string | 否 | 主要模型 | "GPT-4o" |
| model.reasoningEffort | string | 否 | 推理强度 | "Balanced" |
| model.temperature | number | 否 | 温度参数 | 0.7 |
| model.apiKey | string | 否 | API密钥 | "sk-xxxx..." |
| persona | object | 否 | 智能体角色设置 | - |
| persona.systemInstruction | string | 否 | 系统指令 | "您是Nexus..." |
| interface | object | 否 | 界面设置 | - |
| interface.language | string | 否 | 语言 | "zh-CN" |
| interface.theme | string | 否 | 主题 | "light" |
| notification | object | 否 | 通知设置 | - |
| notification.emailEnabled | boolean | 否 | 邮件通知 | true |
| security | object | 否 | 安全设置 | - |
| security.twoFactorEnabled | boolean | 否 | 双因素认证 | false |

**响应参数：** 同获取系统设置接口

---

### 8.3 清除所有聊天历史

**接口描述：** 清除用户的所有聊天历史记录（危险操作）

**请求信息：**
- **请求方法：** `DELETE`
- **请求路径：** `/api/settings/clear-history`
- **请求头：** `Authorization: Bearer {token}`

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "清除成功" |
| data | null | - | null |

---

## 9. 文件上传模块

### 9.1 上传文件

**接口描述：** 上传文件到服务器

**请求信息：**
- **请求方法：** `POST`
- **请求路径：** `/api/upload`
- **Content-Type：** `multipart/form-data`
- **请求头：** `Authorization: Bearer {token}`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| file | file | 是 | 文件（支持多种格式） | - |
| type | string | 否 | 文件类型（image/audio/video/document） | "image" |

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "上传成功" |
| data | object | 响应数据 | - |
| data.fileId | number | 文件ID | 1 |
| data.fileUrl | string | 文件URL | "https://example.com/files/xxx.jpg" |
| data.fileName | string | 文件名 | "image.jpg" |
| data.fileSize | number | 文件大小（字节） | 1024000 |
| data.fileType | string | 文件类型 | "image/jpeg" |

---

### 9.2 语音转文字

**接口描述：** 将音频文件转换为文字

**请求信息：**
- **请求方法：** `POST`
- **请求路径：** `/api/upload/speech-to-text`
- **Content-Type：** `multipart/form-data`
- **请求头：** `Authorization: Bearer {token}`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| audio | file | 是 | 音频文件（支持wav、mp3、webm等） | - |
| language | string | 否 | 语言代码（默认"zh-CN"） | "zh-CN" |

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "转换成功" |
| data | object | 响应数据 | - |
| data.text | string | 转换后的文字 | "这是转换后的文字内容" |
| data.confidence | number | 置信度（0-1） | 0.95 |

---

## 10. 实时交互模块

### 10.1 发送消息

**接口描述：** 发送消息到AI系统（支持文本和语音）

**请求信息：**
- **请求方法：** `POST`
- **请求路径：** `/api/interaction/message`
- **Content-Type：** `application/json` 或 `multipart/form-data`
- **请求头：** `Authorization: Bearer {token}`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| content | string | 否 | 文本消息内容 | "生成一个高端的电影级雨天街道预览" |
| audio | file | 否 | 音频文件（语音消息） | - |
| projectId | number | 否 | 关联的项目ID | 1 |
| context | array | 否 | 上下文消息列表 | - |

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "消息已接收" |
| data | object | 响应数据 | - |
| data.messageId | number | 消息ID | 1 |
| data.response | string | AI响应内容 | "收到您的消息，正在处理..." |
| data.status | string | 处理状态 | "processing" |
| data.taskId | number | 关联的任务ID | 123 |

---

### 10.2 获取消息历史

**接口描述：** 获取对话消息历史

**请求信息：**
- **请求方法：** `GET`
- **请求路径：** `/api/interaction/messages`
- **请求头：** `Authorization: Bearer {token}`

**查询参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| projectId | number | 否 | 项目ID | 1 |
| page | number | 否 | 页码 | 1 |
| pageSize | number | 否 | 每页数量 | 50 |

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "获取成功" |
| data | object | 响应数据 | - |
| data.list | array | 消息列表 | - |
| data.list[].id | number | 消息ID | 1 |
| data.list[].type | string | 消息类型（user/ai） | "user" |
| data.list[].content | string | 消息内容 | "生成一个高端的电影级雨天街道预览" |
| data.list[].timestamp | string | 时间戳 | "2024-01-15T14:30:00Z" |
| data.total | number | 总数量 | 100 |

---

### 10.3 获取任务执行状态

**接口描述：** 获取任务的实时执行状态和日志

**请求信息：**
- **请求方法：** `GET`
- **请求路径：** `/api/interaction/task/{taskId}/status`
- **请求头：** `Authorization: Bearer {token}`

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "获取成功" |
| data | object | 响应数据 | - |
| data.taskId | number | 任务ID | 123 |
| data.status | string | 任务状态 | "running" |
| data.progress | number | 进度百分比 | 65 |
| data.logs | array | 执行日志 | - |
| data.logs[].time | string | 日志时间 | "2024-01-15T14:30:00Z" |
| data.logs[].level | string | 日志级别 | "info" |
| data.logs[].message | string | 日志消息 | "正在初始化沙盒环境..." |
| data.metrics | object | 系统指标 | - |
| data.metrics.memoryUsage | string | 显存使用 | "4.2 GB" |
| data.metrics.frameTime | string | 帧时间 | "12.4ms" |

---

### 10.4 WebSocket连接

**接口描述：** 建立WebSocket连接以接收实时更新

**连接信息：**
- **协议：** `ws://` 或 `wss://`
- **路径：** `/ws/interaction`
- **认证：** 通过URL参数传递token：`?token={token}`

**消息格式：**

**客户端发送：**
```json
{
  "type": "subscribe",
  "taskId": 123
}
```

**服务端推送：**
```json
{
  "type": "task_update",
  "taskId": 123,
  "status": "running",
  "progress": 65,
  "log": {
    "time": "2024-01-15T14:30:00Z",
    "level": "info",
    "message": "正在初始化沙盒环境..."
  }
}
```

---

## 11. 通知模块

### 11.1 订阅邮件通知

**接口描述：** 订阅邮件通知服务

**请求信息：**
- **请求方法：** `POST`
- **请求路径：** `/api/notifications/subscribe`
- **Content-Type：** `application/json`
- **请求头：** `Authorization: Bearer {token}`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| email | string | 是 | 邮箱地址 | "zhanghengji@example.com" |

**响应参数：**

| 参数名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | number | 状态码 | 200 |
| message | string | 响应消息 | "订阅成功" |
| data | null | - | null |

---

## 通用响应格式

所有接口遵循统一的响应格式：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

**状态码说明：**

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（需要登录） |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 认证说明

大部分接口需要在请求头中携带认证信息：

```
Authorization: Bearer {token}
```

其中 `{token}` 为登录接口返回的 `data.token` 值。

---

## 分页说明

支持分页的接口使用以下参数：

- `page`: 页码（从1开始）
- `pageSize`: 每页数量（默认20，最大100）

响应中包含：
- `total`: 总记录数
- `page`: 当前页码
- `pageSize`: 每页数量

---

## 文件上传限制

| 文件类型 | 最大大小 | 支持格式 |
|---------|---------|---------|
| 图片 | 10MB | jpg, jpeg, png, gif, webp |
| 音频 | 50MB | mp3, wav, ogg, webm |
| 视频 | 500MB | mp4, avi, mov, webm |
| 文档 | 20MB | pdf, doc, docx, txt, md |

---

## 错误码说明

| 错误码 | 说明 | 解决方案 |
|--------|------|---------|
| 1001 | 用户名或密码错误 | 检查登录凭据 |
| 1002 | 用户不存在 | 确认用户ID是否正确 |
| 1003 | 邮箱已被注册 | 使用其他邮箱 |
| 2001 | 智能体不存在 | 检查智能体ID |
| 2002 | 智能体状态异常 | 稍后重试 |
| 3001 | 项目不存在 | 检查项目ID |
| 4001 | 文件格式不支持 | 使用支持的格式 |
| 4002 | 文件大小超限 | 压缩文件后重试 |
| 5001 | 任务处理失败 | 查看错误日志 |
| 5002 | 资源不足 | 稍后重试 |

---

## 版本信息

- **API版本：** v1.0
- **文档更新时间：** 2024-01-15
- **基础URL：** `https://api.nexus.example.com`

---

## 注意事项

1. 所有时间字段使用 ISO 8601 格式（UTC时区）
2. 所有金额字段单位为分（整数）
3. 文件URL有效期24小时，需要及时下载
4. 接口请求频率限制：100次/分钟
5. 建议使用HTTPS协议确保数据安全

---

**文档生成时间：** 2024-01-15  
**基于页面：** Dashboard, Login, Agents, Projects, Interaction, VideoGeneration, ImageGeneration, UIDesign, AudioProcessing, History, Profile, Settings, Analytics, AgentDetail, ProjectDetail, HistoryDetail
