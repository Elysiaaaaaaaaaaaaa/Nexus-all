# MySQL数据库设置指南

## 问题诊断

如果您遇到以下错误：
```
创建数据库失败: (pymysql.err.OperationalError) (1045, "Access denied for user 'root'@'localhost' (using password: YES)")
```

这表示MySQL连接失败，可能的原因和解决方案如下：

## 🔧 解决方案

### 方案1：检查MySQL服务状态

1. **检查MySQL是否正在运行**
   - Windows: 按 `Win + R`，输入 `services.msc`
   - 找到 "MySQL" 或 "MySQL80" 服务
   - 如果未运行，右键启动服务

2. **命令行检查**
   ```cmd
   net start mysql
   ```

### 方案2：验证root密码

如果您不确定MySQL root密码：

1. **使用MySQL命令行工具**
   ```cmd
   mysql -u root -p
   ```
   输入您认为的密码

2. **如果密码错误，重置密码**
   - 方法1：使用 `mysql_reset.py` 脚本（需要管理员权限）
   - 方法2：手动重置（见下方）

### 方案3：手动重置MySQL root密码

#### Windows系统：

1. **停止MySQL服务**
   ```cmd
   net stop mysql
   ```

2. **以安全模式启动MySQL**
   ```cmd
   "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --skip-grant-tables --skip-networking
   ```
   （路径可能需要根据您的MySQL安装位置调整）

3. **在新命令行窗口中连接并重置密码**
   ```cmd
   mysql -u root
   ```

   在MySQL提示符下执行：
   ```sql
   FLUSH PRIVILEGES;
   ALTER USER 'root'@'localhost' IDENTIFIED BY '20050518Zzy';
   FLUSH PRIVILEGES;
   EXIT;
   ```

4. **停止安全模式，重启服务**
   ```cmd
   # 按 Ctrl+C 停止mysqld进程
   net start mysql
   ```

### 方案4：创建新MySQL用户

如果不想修改root密码，可以创建新用户：

1. **以root身份连接MySQL**
   ```cmd
   mysql -u root -p
   ```

2. **创建新用户**
   ```sql
   CREATE USER 'nexus_user'@'localhost' IDENTIFIED BY '20050518Zzy';
   GRANT ALL PRIVILEGES ON *.* TO 'nexus_user'@'localhost' WITH GRANT OPTION;
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. **修改 `.env` 文件**
   ```
   DB_USER=nexus_user
   DB_PASSWORD=@20050518Zzy
   ```

### 方案5：使用SQLite（临时替代方案）

如果MySQL设置有困难，可以临时使用SQLite：

1. **修改 `database.py`**
   ```python
   # 在 get_database_url() 函数中添加：
   if os.getenv("USE_SQLITE", "false").lower() == "true":
       return "sqlite:///./nexus.db"
   ```

2. **修改 `.env` 文件**
   ```
   USE_SQLITE=true
   ```

3. **移除MySQL依赖**
   ```bash
   pip uninstall pymysql
   ```

## 🧪 测试连接

设置完成后，运行连接测试：

```bash
python check_mysql.py
```

如果显示"数据库连接测试成功"，就可以运行：

```bash
python setup_database.py
```

## 📞 获取帮助

如果以上方法都无法解决问题：

1. 检查MySQL版本和安装方式
2. 查看MySQL错误日志（通常在 `C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err`）
3. 考虑重新安装MySQL
4. 或者使用方案5的SQLite临时替代方案

## 🎯 下一步

连接成功后，按以下顺序运行：

1. `python setup_database.py` - 初始化数据库和表
2. `python app.py` - 启动后端服务
3. `cd Fronted-main && npm run dev` - 启动前端服务

然后访问 `http://localhost:5173` 开始使用系统！