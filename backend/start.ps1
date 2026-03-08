# Start Backend Server (No __pycache__ creation)
# This script prevents Python from creating bytecode cache files

Write-Host "`n🚀 Starting Backend Server (No __pycache__)`n" -ForegroundColor Cyan

# Set environment variable to prevent __pycache__ creation
$env:PYTHONDONTWRITEBYTECODE = "1"

# Start uvicorn server using venv Python
Write-Host "Starting server on http://0.0.0.0:8000" -ForegroundColor Green
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop`n" -ForegroundColor Yellow

D:\Project\PBL\backend\venv\Scripts\python.exe -B -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
