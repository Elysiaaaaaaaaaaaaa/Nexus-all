from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
import asyncio
from pydantic import BaseModel, ValidationError
from typing import Dict, Any, List, Optional
import shutil
from pathlib import Path
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from run_acps import Text2VideoWorkflow, Image2VideoWorkflow, AssistantReply
from db_user import DatabaseUserFile
from base import get_agent_logger
from database import SessionLocal, init_database
from auth import create_user, authenticate_user, create_access_token, get_current_user

# 加载环境变量
load_dotenv()

# 全局logger初始化 - 在应用启动时立即创建logger接口
logger = get_agent_logger("app.backend", "BACKEND_LOG_LEVEL", "INFO")
logger.info("Backend application logger initialized")

# 创建FastAPI应用
app = FastAPI(
    title="后端服务",
    description="用于前端对接的后端API服务",
    version="1.0.0"
)

# 添加CORS中间件，允许前端跨域请求
# 从环境变量读取允许的来源，默认允许本地开发环境
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
# 如果环境变量为空或未设置，开发环境允许所有来源（仅用于开发）
if not allowed_origins or os.getenv("ENV") == "development":
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 添加静态文件服务，用于提供视频文件访问
# 使用绝对路径，基于app.py所在目录
base_dir = Path(__file__).parent.absolute()
user_files_dir = base_dir / "user_files"
if user_files_dir.exists():
    app.mount("/videos", StaticFiles(directory=str(user_files_dir), html=False), name="videos")
else:
    logger.warning(f"user_files目录不存在: {user_files_dir}，视频文件服务未启用")

# 添加static目录的静态文件服务，用于提供占位符视频
static_dir = base_dir / "static"
if not static_dir.exists():
    static_dir.mkdir(parents=True, exist_ok=True)

# 确保占位符视频文件存在，如果不存在则创建
placeholder_path = static_dir / "placeholder.mp4"
if not placeholder_path.exists():
    print(f"Placeholder video not found at: {placeholder_path}")
    print("Attempting to copy from frontend test video...")
    
if not placeholder_path.exists():
    # 尝试从前端目录复制测试视频（多种可能的路径）
    workspace_root = base_dir.parent  # 工作区根目录
    
    frontend_video_paths = [
        # 相对路径尝试
        base_dir.parent / "Nexus-main" / "Nexus-main" / "src" / "assets" / "test1.mp4",
        base_dir.parent.parent / "Nexus-main" / "Nexus-main" / "src" / "assets" / "test1.mp4",
        # 从工作区根目录尝试
        workspace_root / "Nexus-main" / "Nexus-main" / "src" / "assets" / "test1.mp4",
        # Fronted-main目录尝试
        workspace_root / "Fronted-main" / "static" / "placeholder.mp4",
    ]
    
    copied = False
    for frontend_path in frontend_video_paths:
        abs_path = frontend_path.resolve()
        logger.info(f"  Trying: {abs_path}")
        if abs_path.exists():
            try:
                shutil.copy2(str(abs_path), str(placeholder_path))
                file_size = placeholder_path.stat().st_size
                logger.info(f"[OK] Successfully copied placeholder video from: {abs_path}")
                logger.info(f"  File size: {file_size} bytes ({file_size / 1024 / 1024:.2f} MB)")
                copied = True
                break
            except Exception as e:
                logger.error(f"  [ERROR] Could not copy from {abs_path}: {e}")
    
    # 如果复制失败，创建一个最小的有效MP4文件（但警告用户）
    if not copied:
        logger.warning("Could not find frontend test video. Creating minimal placeholder...")
        logger.warning("  Note: Minimal video may not play in browsers. Please manually copy a video file.")
        minimal_mp4 = bytes([
            0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,  # ftyp box
            0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
            0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
            0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31,
            0x00, 0x00, 0x00, 0x08, 0x6D, 0x64, 0x61, 0x74,  # mdat box (empty)
            0x00, 0x00, 0x00, 0x00
        ])
        try:
            with open(placeholder_path, "wb") as f:
                f.write(minimal_mp4)
            logger.info(f"  Created minimal placeholder video: {placeholder_path}")
            logger.warning("  [WARNING] This minimal video may not play in all browsers.")
        except Exception as e:
            logger.error(f"  [ERROR] Could not create placeholder video: {e}")
else:
    # 文件已存在，检查文件大小
    file_size = placeholder_path.stat().st_size
    if file_size < 1000:  # 小于1KB可能是无效文件
        logger.warning(f"Placeholder video exists but is very small ({file_size} bytes).")
        logger.warning("  Consider replacing it with a real video file.")
    else:
        logger.info(f"[OK] Placeholder video found: {placeholder_path} ({file_size / 1024 / 1024:.2f} MB)")

if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir), html=False), name="static")


# 定义统一的错误响应格式函数
def get_error_response(detail: str, status_code: int, example: dict = None) -> Dict[str, Any]:
    response = {
        "success": False,
        "error": {
            "code": status_code,
            "message": detail
        }
    }
    if example:
        response["example"] = example
    return response

# 请求模型
class WorkRequest(BaseModel):
    project_name: str
    user_input: str
    mode: str = "production"
    video_duration: int = None  # 视频时长（秒），可选，默认使用后端配置
    modify_num: Optional[List[int]] = None  # 需要修改的内容序号

class UserIdRequest(BaseModel):
    user_id: str

class ProjectHistoryRequest(BaseModel):
    project_name: str

class NewProjectRequest(BaseModel):
    project_name: str
    workflow_type: str

# 认证相关请求模型
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    username: str  # 可以是用户名或邮箱
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

# 健康检查路由
@app.get("/")
def read_root():
    return {
        "message": "后端服务运行正常",
        "version": "1.0.0"
    }

## 示例API路由
# 用户认证API端点
@app.post("/api/v1/auth/register", response_model=TokenResponse)
async def register_user(request: RegisterRequest):
    """
    用户注册
    """
    try:
        db = SessionLocal()
        try:
            # 创建用户
            user = create_user(db, request.username, request.email, request.password)

            # 创建访问令牌
            access_token = create_access_token(data={"sub": str(user.id)})

            return TokenResponse(
                access_token=access_token,
                user={
                    "id": user.id,
                    "username": user.username,
                    "email": user.email
                }
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error in user registration: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="注册失败，请稍后重试")

@app.post("/api/v1/auth/login", response_model=TokenResponse)
async def login_user(request: LoginRequest):
    """
    用户登录
    """
    try:
        db = SessionLocal()
        try:
            # 认证用户
            user = authenticate_user(db, request.username, request.password)

            if not user:
                raise HTTPException(status_code=401, detail="用户名或密码错误")

            # 创建访问令牌
            access_token = create_access_token(data={"sub": str(user.id)})

            return TokenResponse(
                access_token=access_token,
                user={
                    "id": user.id,
                    "username": user.username,
                    "email": user.email
                }
            )
        finally:
            db.close()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in user login: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="登录失败，请稍后重试")

@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": "backend-api"
    }

@app.get("/api/v1/test-video-placeholder")
async def test_video_placeholder():
    """
    返回占位符视频文件
    用于测试模式下显示视频已生成
    如果static目录下的文件不存在，返回重定向到静态文件服务
    """
    from fastapi.responses import FileResponse, RedirectResponse
    
    # 优先使用static目录下的占位符视频
    placeholder_path = base_dir / "static" / "placeholder.mp4"
    
    if placeholder_path.exists():
        return FileResponse(
            str(placeholder_path),
            media_type="video/mp4",
            headers={
                "Cache-Control": "public, max-age=3600"
            }
        )
    else:
        # 如果占位符文件不存在，重定向到静态文件服务
        return RedirectResponse(
            url="/static/placeholder.mp4",
            status_code=307  # 临时重定向
        )


# 全局异常处理 - 通用异常处理器
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """处理所有未捕获的异常"""
    logger.error(f"Unhandled exception in {request.url.path}: {exc}", exc_info=True)
    error_detail = str(exc) if os.getenv("ENV") == "development" else "服务器内部错误，请稍后重试"
    return get_error_response(detail=error_detail, status_code=500)

# 全局异常处理 - 验证错误处理器
@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    # 分析错误信息
    error_details = []
    for error in exc.errors():
        error_details.append({
            "field": ".".join(error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    # 确定当前请求的路径，返回相应的示例
    path = request.url.path
    example = None
    
    if path.endswith("/api/v1/work"):
        example = {
            "project_name": "测试项目",
            "user_input": "测试请求",
            "mode": "test",
            "modify_num": [1, 2]
        }
    elif path.endswith("/api/v1/projects/list"):
        example = {}
    elif path.endswith("/api/v1/projects/history"):
        example = {
            "project_name": "测试项目"
        }
    elif path.endswith("/api/v1/projects/new"):
        example = {
            "project_name": "新测试项目",
            "workflow_type": "text2video"
        }
    
    # 返回统一的错误响应
    return get_error_response(
        detail=f"请求参数验证失败: {', '.join([error['message'] for error in error_details])}",
        status_code=422,
        example=example
    )

# workflow API端点
@app.post("/api/v1/work")
async def work(request: WorkRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        project_name = request.project_name
        user_id = str(current_user["user_id"])  # 从JWT中获取用户ID
        user_input = request.user_input
        mode = request.mode
        userfile = DatabaseUserFile(user_id)
        print(f"User ID: {user_id}, Project: {project_name}")

        workflow_type = "text2video"
        try:
            project_content = userfile.load_content(project_name)
            workflow_type = project_content.get("workflow_type", "text2video")
        except FileNotFoundError:
            workflow_type = "text2video"

        logger.info(
            "event=work_start user_id=%s project=%s mode=%s workflow_type=%s",
            user_id,
            project_name,
            mode,
            workflow_type,
        )

        if workflow_type == "image2video":
            orchestrator = Image2VideoWorkflow(clients=None, userfile=userfile, project_name=project_name, mode=mode)
        else:
            orchestrator = Text2VideoWorkflow(clients=None, userfile=userfile, project_name=project_name, mode=mode)
        
        # 如果请求中包含video_duration，设置到session_data中
        if request.video_duration is not None and workflow_type == "text2video":
            session_data = orchestrator._get_session_state(orchestrator.main_session_id)
            session_data['video_duration'] = request.video_duration
            orchestrator._sessions[orchestrator.main_session_id] = session_data
        
        # 调用handle_user_input方法处理用户输入
        if workflow_type == "image2video":
            result_state = await orchestrator.handle_user_input(orchestrator.main_session_id, user_input)
        else:
            modify_num = request.modify_num or []
            result_state = await orchestrator.handle_user_input(
                orchestrator.main_session_id,
                user_input,
                modify_num=modify_num,
            )
        
        # 从结果状态中提取回复
        reply = result_state.get('reply')
        if not isinstance(reply, AssistantReply):
            fallback_text = result_state.get("response", "抱歉，我暂时无法处理该请求。")
            reply = AssistantReply(str(fallback_text))
        
        # 返回结果
        return {
            "success": True,
            "message": reply.text,
            "end_session": reply.end_session,
            "project_name": orchestrator.project_name,
            "session_id": orchestrator.main_session_id,
            "session_data": result_state['session_data']
        }
    except Exception as e:
        logger.error(f"Error in /api/v1/work: {e}", exc_info=True)
        
        # 检查是否是连接错误
        error_str = str(e)
        error_type = type(e).__name__
        
        # 识别不同类型的错误并提供友好的错误消息
        if "Connection error" in error_str or "连接错误" in error_str or "ArkAPIConnectionError" in error_type:
            error_detail = (
                "AI服务连接失败，可能是网络问题或服务暂时不可用。"
                "建议：1. 检查网络连接 2. 稍后重试 3. 联系管理员检查AI服务配置"
            )
        elif "timeout" in error_str.lower() or "超时" in error_str:
            error_detail = (
                "AI服务响应超时，请稍后重试。"
                "如果问题持续存在，请联系管理员。"
            )
        elif "401" in error_str or "403" in error_str or "认证" in error_str or "授权" in error_str:
            error_detail = (
                "AI服务认证失败，请检查API密钥配置。"
                "建议：联系管理员检查AI服务配置"
            )
        elif os.getenv("ENV") == "development":
            # 开发环境显示详细错误信息
            error_detail = f"{error_type}: {error_str}"
        else:
            # 生产环境显示通用错误信息
            error_detail = "服务器内部错误，请稍后重试"
        
        return get_error_response(detail=error_detail, status_code=500)

# 获取用户项目列表
@app.post("/api/v1/projects/list")
async def get_projects(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        user_id = str(current_user["user_id"])
        userfile = DatabaseUserFile(user_id)
        
        # 获取所有会话数据
        sessions = userfile.load_session()
        
        # 构建项目列表
        projects = []
        for project_name in userfile.user_project:
            project_content = userfile.load_content(project_name)
            session_id = project_content.get('session_id')
            workflow_type = project_content.get('workflow_type', 'text2video')
            
            # 获取当前任务
            now_task = "imagination"
            if session_id and session_id in sessions:
                now_task = sessions[session_id].get('now_task', 'imagination')
            
            projects.append({
                "project_name": project_name,
                "workflow_type": workflow_type,
                "now_task": now_task
            })
        
        return {
            "success": True,
            "projects": projects
        }
    except Exception as e:
        logger.error(f"Error in /api/v1/work: {e}", exc_info=True)
        # 生产环境不暴露详细错误信息
        error_detail = str(e) if os.getenv("ENV") == "development" else "服务器内部错误，请稍后重试"
        return get_error_response(detail=error_detail, status_code=500)

# 获取指定项目的对话历史
@app.post("/api/v1/projects/history")
async def get_project_history(request: ProjectHistoryRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        user_id = str(current_user["user_id"])
        project_name = request.project_name
        userfile = DatabaseUserFile(user_id)
        
        # 检查项目是否存在
        if project_name not in userfile.user_project:
            return get_error_response(detail=f"项目 {project_name} 不存在", status_code=404)
        
        # 获取对话历史
        chat_history = userfile.load_chat_history(project_name)
        
        # 获取项目的session_id
        project_content = userfile.load_content(project_name)
        session_id = project_content.get('session_id')
        
        # 从session_history中获取最新的session_data
        session_data = None
        if session_id:
            all_sessions = userfile.load_session()
            session_data = all_sessions.get(session_id, {})
        
        return {
            "success": True,
            "chat_history": chat_history,
            "session_data": session_data
        }
    except Exception as e:
        logger.error(f"Error in /api/v1/work: {e}", exc_info=True)
        # 生产环境不暴露详细错误信息
        error_detail = str(e) if os.getenv("ENV") == "development" else "服务器内部错误，请稍后重试"
        return get_error_response(detail=error_detail, status_code=500)

# 用户头像上传
@app.post("/api/user/avatar")
async def upload_avatar(
    avatar: UploadFile = File(...),
    user_id: str = Form(None)
):
    """
    上传用户头像
    支持图片格式：jpg, jpeg, png, gif, webp
    """
    try:
        # 验证文件类型
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
        if avatar.content_type not in allowed_types:
            return get_error_response(
                detail=f"不支持的文件类型: {avatar.content_type}，仅支持: {', '.join(allowed_types)}",
                status_code=400
            )
        
        # 验证文件大小（限制为5MB）
        MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
        file_content = await avatar.read()
        if len(file_content) > MAX_FILE_SIZE:
            return get_error_response(
                detail=f"文件大小超过限制（最大5MB），当前文件大小: {len(file_content) / 1024 / 1024:.2f}MB",
                status_code=400
            )
        
        # 创建用户头像目录
        avatars_dir = base_dir / "user_avatars"
        avatars_dir.mkdir(exist_ok=True)
        
        # 生成文件名（使用用户ID或时间戳）
        if user_id:
            # 从请求参数或请求头获取user_id
            file_extension = avatar.filename.split('.')[-1] if '.' in avatar.filename else 'jpg'
            filename = f"{user_id}.{file_extension}"
        else:
            # 使用原始文件名或生成唯一文件名
            if avatar.filename:
                filename = avatar.filename
            else:
                import uuid
                file_extension = avatar.content_type.split('/')[-1]
                filename = f"{uuid.uuid4()}.{file_extension}"
        
        # 保存文件
        file_path = avatars_dir / filename
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        logger.info(f"Avatar uploaded: {file_path} (size: {len(file_content)} bytes)")
        
        # 返回文件URL
        avatar_url = f"/api/user/avatars/{filename}"
        
        return {
            "success": True,
            "data": {
                "avatarUrl": avatar_url,
                "url": avatar_url,
                "filename": filename
            }
        }
    except Exception as e:
        logger.error(f"Error in /api/user/avatar: {e}", exc_info=True)
        error_detail = str(e) if os.getenv("ENV") == "development" else "头像上传失败，请稍后重试"
        return get_error_response(detail=error_detail, status_code=500)

# 提供头像文件访问
avatars_dir = base_dir / "user_avatars"
if avatars_dir.exists():
    app.mount("/api/user/avatars", StaticFiles(directory=str(avatars_dir), html=False), name="avatars")

# 新建项目
@app.post("/api/v1/projects/new")
async def create_project(request: NewProjectRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        user_id = str(current_user["user_id"])  # 从JWT中获取用户ID
        project_name = request.project_name
        workflow_type = request.workflow_type
        
        # 验证工作流类型
        allowed_workflow_types = ['text2video', 'image2video']
        if workflow_type not in allowed_workflow_types:
            return get_error_response(
                detail=f"无效的工作流类型: {workflow_type}，只允许: {', '.join(allowed_workflow_types)}",
                status_code=400,
                example={
                    "user_id": user_id,
                    "project_name": project_name,
                    "workflow_type": "text2video"
                }
            )
        
        userfile = DatabaseUserFile(user_id)
        
        # 生成新的会话ID
        import uuid
        session_id = f"session-{uuid.uuid4()}"
        
        # 创建项目
        new_project_name = userfile.init_project(project_name, session_id, workflow_type)
        
        return {
            "success": True,
            "project_name": new_project_name,
            "session_id": session_id,
            "workflow_type": workflow_type
        }
    except Exception as e:
        logger.error(f"Error in /api/v1/work: {e}", exc_info=True)
        # 生产环境不暴露详细错误信息
        error_detail = str(e) if os.getenv("ENV") == "development" else "服务器内部错误，请稍后重试"
        return get_error_response(detail=error_detail, status_code=500)

# 启动时初始化数据库
logger.info("Initializing database...")
if not init_database():
    logger.error("Failed to initialize database. Please check database configuration.")
    exit(1)

if __name__ == "__main__":
    # 启动uvicorn服务器
    # 从环境变量读取配置，默认值用于开发环境
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", "8003"))
    reload = os.getenv("ENV", "development") == "development"
    
    logger.info(f"Starting backend server on {host}:{port} (reload={reload})")
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=reload
    )
