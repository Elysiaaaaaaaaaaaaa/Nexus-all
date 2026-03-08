"""
数据库版本的UserFile类
替代原有的file_manage.UserFile类，使用数据库存储所有数据
"""

import os
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from database import SessionLocal, User, Project, ChatHistory, Session as DBSession


class DatabaseUserFile:
    """数据库版本的用户文件管理类，替代原有的UserFile类"""

    def __init__(self, user_id: str):
        """
        初始化数据库用户文件管理器

        Args:
            user_id: 用户ID（字符串形式，需要转换为int）
        """
        try:
            self.user_id = int(user_id)
        except ValueError:
            raise ValueError(f"无效的用户ID格式: {user_id}。用户ID必须是数字。")
        self._user_name = None  # 延迟加载用户名

        # 为向后兼容，提供project_path属性
        self.project_path = f"./user_files/{self.user_id}/projects/"

    def _get_db(self) -> Session:
        """获取数据库会话"""
        return SessionLocal()

    def load_chat_history(self, project_name: str) -> List[Dict[str, Any]]:
        """
        加载项目的对话历史

        Args:
            project_name: 项目名称

        Returns:
            对话历史列表，每个元素包含user、assistant、material字段
        """
        with self._get_db() as db:
            # 查找项目
            project = db.query(Project).filter(
                and_(Project.user_id == self.user_id, Project.project_name == project_name)
            ).first()

            if not project:
                return []

            # 获取对话历史，按创建时间排序
            chat_entries = db.query(ChatHistory).filter(
                ChatHistory.project_id == project.id
            ).order_by(ChatHistory.created_at).all()

            # 转换为原有格式
            chat_history = []
            for entry in chat_entries:
                chat_history.append({
                    'user': entry.user_input,
                    'assistant': entry.assistant_reply,
                    'material': entry.material
                })

            return chat_history

    def save_chat_history(self, project_name: str, state: Dict[str, Any]) -> None:
        """
        保存对话历史

        Args:
            project_name: 项目名称
            state: 包含user_input、reply、session_data的状态对象
        """
        with self._get_db() as db:
            # 查找项目
            project = db.query(Project).filter(
                and_(Project.user_id == self.user_id, Project.project_name == project_name)
            ).first()

            if not project:
                # 如果项目不存在，创建项目
                project = self._create_project(db, project_name, state.get('session_data', {}).get('session_id', ''))

            # 创建对话历史记录
            reply_text = ""
            if hasattr(state['reply'], 'text') and state['reply'].text:
                # 如果reply.text是列表，转换为字符串
                if isinstance(state['reply'].text, (list, tuple)):
                    reply_text = '\n'.join(str(item) for item in state['reply'].text) if state['reply'].text else ""
                else:
                    reply_text = str(state['reply'].text)
            elif isinstance(state['reply'], (list, tuple)) and len(state['reply']) > 0:
                # 如果reply是列表，取第一个元素并转换为字符串
                reply_text = str(state['reply'][0]) if len(state['reply']) > 0 else str(state['reply'])
            else:
                reply_text = str(state['reply']) if state['reply'] else ""

            chat_entry = ChatHistory(
                project_id=project.id,
                user_input=state['user_input'],
                assistant_reply=reply_text,
                material=state.get('session_data', {}).get('material')
            )

            db.add(chat_entry)
            db.commit()

    def init_project(self, project_name: str, session_id: str, workflow_type: str = 'text2video') -> str:
        """
        初始化新项目

        Args:
            project_name: 项目名称
            session_id: 会话ID
            workflow_type: 工作流类型

        Returns:
            实际创建的项目名称（可能添加了后缀以避免重复）
        """
        with self._get_db() as db:
            # 检查项目名是否已存在
            i = 1
            new_project_name = project_name
            while db.query(Project).filter(
                and_(Project.user_id == self.user_id, Project.project_name == new_project_name)
            ).first():
                new_project_name = f"{project_name}_{i}"
                i += 1

            # 创建项目
            project = self._create_project(db, new_project_name, session_id, workflow_type)
            return new_project_name

    def _create_project(self, db: Session, project_name: str, session_id: str, workflow_type: str = 'text2video') -> Project:
        """内部方法：创建项目记录"""
        project = Project(
            user_id=self.user_id,
            project_name=project_name,
            session_id=session_id,
            workflow_type=workflow_type,
            material=None
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        return project

    def load_content(self, project_name: str) -> Dict[str, Any]:
        """
        加载项目内容

        Args:
            project_name: 项目名称

        Returns:
            项目内容字典
        """
        with self._get_db() as db:
            project = db.query(Project).filter(
                and_(Project.user_id == self.user_id, Project.project_name == project_name)
            ).first()

            if not project:
                raise FileNotFoundError(f"项目 {project_name} 不存在")

            # 返回项目内容，确保workflow_type字段存在
            content = {
                'material': project.material,
                'session_id': project.session_id,
                'workflow_type': project.workflow_type or 'text2video'
            }

            return content

    def save_content(self, project_name: str, material: Any, session_id: str, workflow: str) -> None:
        """
        保存项目内容

        Args:
            project_name: 项目名称
            material: 素材数据
            session_id: 会话ID
            workflow: 工作流类型
        """
        with self._get_db() as db:
            project = db.query(Project).filter(
                and_(Project.user_id == self.user_id, Project.project_name == project_name)
            ).first()

            if not project:
                # 如果项目不存在，创建新项目
                project = self._create_project(db, project_name, session_id, workflow)
                project.material = material
            else:
                # 更新现有项目
                project.material = material
                project.session_id = session_id
                project.workflow_type = workflow

            db.commit()

    def save_session(self, session_id: str, session_data: Dict[str, Any]) -> None:
        """
        保存会话数据

        Args:
            session_id: 会话ID
            session_data: 会话数据
        """
        with self._get_db() as db:
            # 查找现有会话
            session_record = db.query(DBSession).filter(
                and_(DBSession.user_id == self.user_id, DBSession.session_id == session_id)
            ).first()

            if session_record:
                # 更新现有会话
                session_record.session_data = session_data
            else:
                # 创建新会话
                session_record = DBSession(
                    user_id=self.user_id,
                    session_id=session_id,
                    session_data=session_data
                )
                db.add(session_record)

            db.commit()

    def load_session(self) -> Dict[str, Any]:
        """
        加载用户的所有会话数据

        Returns:
            会话ID到会话数据的映射字典
        """
        with self._get_db() as db:
            sessions = db.query(DBSession).filter(DBSession.user_id == self.user_id).all()

            session_data = {}
            for session in sessions:
                session_data[session.session_id] = session.session_data

            return session_data

    @property
    def user_project(self) -> List[str]:
        """
        获取用户的所有项目名称列表

        Returns:
            项目名称列表
        """
        with self._get_db() as db:
            projects = db.query(Project).filter(Project.user_id == self.user_id).all()
            return [project.project_name for project in projects]

    def get_figure_photo(self, project_name: str, figure_name: str) -> Optional[str]:
        """
        获取人物照片路径
        注意：这个方法目前保持原有逻辑，因为照片文件仍然需要存储在文件系统中

        Args:
            project_name: 项目名称
            figure_name: 人物名称

        Returns:
            照片文件路径，如果不存在则返回None
        """
        # 这里暂时保持原有逻辑，后续可以考虑将照片也存储在数据库中
        if figure_name == 'default':
            return None

        # 构建用户文件路径（保持向后兼容）
        user_dir = f"./user_files/{self.user_id}"
        project_dir = os.path.join(user_dir, "projects", project_name, 'photos')

        supported_exts = ['.jpg', '.png', '.webp']
        for ext in supported_exts:
            photo_path = os.path.join(project_dir, f'photos{ext}')
            if os.path.exists(photo_path):
                return photo_path

        return None

    @property
    def user(self) -> str:
        """
        获取用户名，用于向后兼容

        Returns:
            用户名字符串
        """
        if self._user_name is None:
            with self._get_db() as db:
                user_record = db.query(User).filter(User.id == self.user_id).first()
                self._user_name = user_record.username if user_record else str(self.user_id)
        return self._user_name


# 为了向后兼容，提供一个别名
UserFile = DatabaseUserFile