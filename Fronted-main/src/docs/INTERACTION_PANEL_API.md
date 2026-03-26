# 右侧面板预置接口文档

> 用途：为前端 `Interaction` 页面右侧「实时执行 / 任务与素材」提供统一数据源。  
> 状态：前端已预置调用函数 `getInteractionPanelData()`，后端待实现。

## 1. 接口信息

- 方法：`POST`
- 路径：`/api/v1/interaction/panel`
- 鉴权：与现有业务接口一致（建议沿用 Bearer Token）
- Content-Type：`application/json`

## 2. 请求参数

```json
{
  "user_id": "string",
  "project_name": "string",
  "session_id": "string",
  "workflow": "string"
}
```

字段说明：

- `user_id`：用户唯一标识（建议必填）
- `project_name`：项目名称（必填）
- `session_id`：当前会话 ID（可选）
- `workflow`：前端工作流标识（可选，如 `text_to_video_fast` / `storyboard_precise`）

## 3. 成功响应（建议）

```json
{
  "success": true,
  "data": {
    "execution": {
      "logs": [
        {
          "time": "2026-03-23T12:00:00Z",
          "level": "info",
          "message": "正在初始化沙盒环境..."
        },
        {
          "time": "2026-03-23T12:00:02Z",
          "level": "success",
          "message": "成功：场景 \"新东京\" 已渲染。"
        }
      ],
      "simulation_quote": "雨滴在霓虹灯闪烁中闪闪发光，24fps。湿路面上的反射实时更新。",
      "metrics": {
        "vram": "4.2 GB",
        "frameTime": "12.4ms",
        "fps": "24fps",
        "latency": "1.2ms"
      }
    },
    "task_assets": {
      "now_task": {
        "name": "分镜生成",
        "stage": "outline",
        "progress": 42
      },
      "materials": [
        "第一镜：雨夜街道远景",
        "第二镜：角色特写，霓虹反射"
      ]
    }
  }
}
```

## 4. 错误响应（建议）

```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "project_name 是必填参数"
  }
}
```

## 5. 前端映射说明

前端文件：`src/pages/Interaction.jsx`

- `execution.logs` -> 实时执行列表
- `execution.simulation_quote` -> 活动模拟文案
- `execution.metrics.vram/frameTime/fps/latency` -> 系统指标
- `task_assets.now_task` -> 任务 / 阶段 / 进度
- `task_assets.materials` -> 任务素材列表

前端 API 封装：`src/services/api.js`

- 函数名：`getInteractionPanelData(params)`
- 当前请求路径：`/api/v1/interaction/panel`

