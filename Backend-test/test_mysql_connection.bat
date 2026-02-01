@echo off
echo Testing MySQL connection...

REM Test MySQL connection
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p@20050518Zzy -e "SELECT VERSION(); SHOW DATABASES;"

if %ERRORLEVEL% EQU 0 (
    echo MySQL connection successful!
    echo You can now run: python setup_database.py
) else (
    echo MySQL connection failed!
    echo You may need to reset the MySQL root password.
    echo Run: python mysql_reset.py (requires administrator privileges)
)

pause