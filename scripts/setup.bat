@echo off
REM Enterprise Decision Support AI - Windows Setup Script

echo =========================================
echo  Enterprise Decision Support AI Setup
echo =========================================
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python 3.11+ is required but not found
    exit /b 1
)
echo [OK] Python found

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js 18+ is required but not found
    exit /b 1
)
echo [OK] Node.js found

REM Check Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Docker not found (optional)
) else (
    echo [OK] Docker found
)

echo.
echo =========================================
echo  Setting up Backend
echo =========================================
echo.

cd backend

REM Create virtual environment
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    echo [OK] Virtual environment created
) else (
    echo [INFO] Virtual environment already exists
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip >nul 2>&1
echo [OK] Pip upgraded

REM Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt >nul 2>&1
echo [OK] Python dependencies installed

REM Setup environment file
if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
    echo [OK] .env file created
) else (
    echo [INFO] .env file already exists
)

cd ..

echo.
echo =========================================
echo  Setting up Frontend
echo =========================================
echo.

cd frontend

REM Install dependencies
echo Installing Node.js dependencies...
call npm install >nul 2>&1
echo [OK] Node.js dependencies installed

REM Setup environment file
if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
    echo [OK] .env file created
) else (
    echo [INFO] .env file already exists
)

cd ..

echo.
echo =========================================
echo  Setup Complete!
echo =========================================
echo.
echo Next steps:
echo.
echo 1. Update configuration files:
echo    - backend\.env
echo    - frontend\.env
echo.
echo 2. Start with Docker:
echo    docker-compose up -d
echo.
echo    OR start manually:
echo    Terminal 1 (Backend):
echo      cd backend
echo      venv\Scripts\activate
echo      uvicorn app.main:app --reload
echo.
echo    Terminal 2 (Frontend):
echo      cd frontend
echo      npm start
echo.
echo 3. Access at http://localhost:3000
echo.
pause
