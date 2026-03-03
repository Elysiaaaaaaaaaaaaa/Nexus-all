#!/usr/bin/env python3
"""
Simple database viewer web interface
"""

from fastapi import FastAPI, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from database import SessionLocal, User, Project, ChatHistory
import uvicorn
import bcrypt

# 常见密码字典，用于尝试解码哈希密码
COMMON_PASSWORDS = [
    '123', '123456', 'password', 'admin', '12345678', '123456789',
    '12345', '1234567890', 'qwerty', 'abc123', 'password123',
    'admin123', 'root', 'test', 'user', 'guest', '111111', '123123',
    '123456789', 'welcome', 'letmein', 'monkey', 'dragon', 'passw0rd',
    '2023211903', '2023211904', '2023211905', '2023211906'
]

def try_decode_password(hashed_password):
    """尝试解码哈希密码，返回可能的明文密码"""
    for password in COMMON_PASSWORDS:
        if bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8')):
            return password
    return "无法解码（可能是复杂密码）"

app = FastAPI(title="Database Viewer")

# Templates
templates = Jinja2Templates(directory="templates")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_users_with_decrypted_passwords(db: Session):
    """获取用户列表，包含解密后的密码"""
    users = db.query(User).all()
    users_with_passwords = []
    for user in users:
        users_with_passwords.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'password_hash': user.password_hash,
            'plain_password': try_decode_password(user.password_hash),
            'created_at': user.created_at
        })
    return users_with_passwords

@app.get("/", response_class=HTMLResponse)
async def database_viewer(request: Request, db: Session = Depends(get_db)):
    """Main database viewer page"""

    # Get data from all tables
    users = get_users_with_decrypted_passwords(db)
    projects = db.query(Project).all()
    chat_history = db.query(ChatHistory).limit(50).all()

    return templates.TemplateResponse("database_viewer.html", {
        "request": request,
        "users": users,
        "projects": projects,
        "chat_history": chat_history
    })

@app.get("/users", response_class=HTMLResponse)
async def users_page(request: Request, db: Session = Depends(get_db)):
    """Users management page"""
    users = get_users_with_decrypted_passwords(db)
    return templates.TemplateResponse("users.html", {
        "request": request,
        "users": users
    })

@app.get("/projects", response_class=HTMLResponse)
async def projects_page(request: Request, db: Session = Depends(get_db)):
    """Projects management page"""
    projects = db.query(Project).all()
    return templates.TemplateResponse("projects.html", {
        "request": request,
        "projects": projects
    })

if __name__ == "__main__":
    import os
    # Create templates directory if it doesn't exist
    os.makedirs("templates", exist_ok=True)

    # Create basic HTML templates
    with open("templates/database_viewer.html", "w", encoding="utf-8") as f:
        f.write("""
<!DOCTYPE html>
<html>
<head>
    <title>Database Viewer</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f2f2f2; }
        .section { margin: 40px 0; }
        .nav { background: #f8f9fa; padding: 10px; margin: -20px -20px 20px -20px; }
        .nav a { margin: 0 15px; text-decoration: none; color: #007bff; }
    </style>
</head>
<body>
    <div class="nav">
        <a href="/">Overview</a>
        <a href="/users">Users</a>
        <a href="/projects">Projects</a>
    </div>

    <h1>Database Overview</h1>

    <div class="section">
        <h2>Users ({{ users|length }} total)</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Password Hash</th>
                    <th>Plain Password</th>
                    <th>Created At</th>
                </tr>
            </thead>
            <tbody>
                {% for user in users %}
                <tr>
                    <td>{{ user.id }}</td>
                    <td>{{ user.username }}</td>
                    <td>{{ user.email }}</td>
                    <td style="font-family: monospace; font-size: 12px;">{{ user.password_hash }}</td>
                    <td style="color: #2563eb; font-weight: bold;">{{ user.plain_password }}</td>
                    <td>{{ user.created_at }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Projects ({{ projects|length }} total)</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>User ID</th>
                    <th>Project Name</th>
                    <th>Workflow Type</th>
                    <th>Created At</th>
                </tr>
            </thead>
            <tbody>
                {% for project in projects %}
                <tr>
                    <td>{{ project.id }}</td>
                    <td>{{ project.user_id }}</td>
                    <td>{{ project.project_name }}</td>
                    <td>{{ project.workflow_type }}</td>
                    <td>{{ project.created_at }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Recent Chat History ({{ chat_history|length }} entries)</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Project ID</th>
                    <th>User Input</th>
                    <th>Assistant Reply</th>
                    <th>Created At</th>
                </tr>
            </thead>
            <tbody>
                {% for chat in chat_history %}
                <tr>
                    <td>{{ chat.id }}</td>
                    <td>{{ chat.project_id }}</td>
                    <td>{{ chat.user_input[:50] }}{% if chat.user_input|length > 50 %}...{% endif %}</td>
                    <td>{{ chat.assistant_reply[:50] }}{% if chat.assistant_reply|length > 50 %}...{% endif %}</td>
                    <td>{{ chat.created_at }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>
</body>
</html>
        """)

    with open("templates/users.html", "w", encoding="utf-8") as f:
        f.write("""
<!DOCTYPE html>
<html>
<head>
    <title>Users - Database Viewer</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f2f2f2; }
        .nav { background: #f8f9fa; padding: 10px; margin: -20px -20px 20px -20px; }
        .nav a { margin: 0 15px; text-decoration: none; color: #007bff; }
    </style>
</head>
<body>
    <div class="nav">
        <a href="/">Overview</a>
        <a href="/users">Users</a>
        <a href="/projects">Projects</a>
    </div>

    <h1>Users Management</h1>

    <table class="table">
        <thead>
            <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Password Hash</th>
                <th>Plain Password</th>
                <th>Created At</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            {% for user in users %}
            <tr>
                <td>{{ user.id }}</td>
                <td>{{ user.username }}</td>
                <td>{{ user.email }}</td>
                <td style="font-family: monospace; font-size: 12px;">{{ user.password_hash }}</td>
                <td style="color: #2563eb; font-weight: bold;">{{ user.plain_password }}</td>
                <td>{{ user.created_at }}</td>
                <td>
                    <button onclick="deleteUser({{ user.id }})">Delete</button>
                </td>
            </tr>
            {% endfor %}
        </tbody>
    </table>

    <script>
        function deleteUser(userId) {
            if (confirm('Are you sure you want to delete this user?')) {
                fetch(`/api/users/${userId}`, { method: 'DELETE' })
                    .then(() => location.reload());
            }
        }
    </script>
</body>
</html>
        """)

    with open("templates/projects.html", "w", encoding="utf-8") as f:
        f.write("""
<!DOCTYPE html>
<html>
<head>
    <title>Projects - Database Viewer</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f2f2f2; }
        .nav { background: #f8f9fa; padding: 10px; margin: -20px -20px 20px -20px; }
        .nav a { margin: 0 15px; text-decoration: none; color: #007bff; }
    </style>
</head>
<body>
    <div class="nav">
        <a href="/">Overview</a>
        <a href="/users">Users</a>
        <a href="/projects">Projects</a>
    </div>

    <h1>Projects Management</h1>

    <table class="table">
        <thead>
            <tr>
                <th>ID</th>
                <th>User ID</th>
                <th>Project Name</th>
                <th>Workflow Type</th>
                <th>Session ID</th>
                <th>Created At</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            {% for project in projects %}
            <tr>
                <td>{{ project.id }}</td>
                <td>{{ project.user_id }}</td>
                <td>{{ project.project_name }}</td>
                <td>{{ project.workflow_type }}</td>
                <td>{{ project.session_id }}</td>
                <td>{{ project.created_at }}</td>
                <td>
                    <button onclick="deleteProject({{ project.id }})">Delete</button>
                </td>
            </tr>
            {% endfor %}
        </tbody>
    </table>

    <script>
        function deleteProject(projectId) {
            if (confirm('Are you sure you want to delete this project?')) {
                fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
                    .then(() => location.reload());
            }
        }
    </script>
</body>
</html>
        """)

    print("Starting Database Viewer on http://localhost:8006")
    print("Press Ctrl+C to stop")
    uvicorn.run(app, host="0.0.0.0", port=8006)