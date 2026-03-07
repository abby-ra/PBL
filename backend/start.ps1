# Start Backend Server (No __pycache__ creation)
# This script prevents Python from creating bytecode cache files

Write-Host "`n🚀 Starting Backend Server (No __pycache__)`n" -ForegroundColor Cyan

# Set environment variable to prevent __pycache__ creation
$env:PYTHONDONTWRITEBYTECODE = "1"

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

# Start uvicorn server
Write-Host "Starting server on http://0.0.0.0:8000" -ForegroundColor Green
Write-Host "API Docs: http://localhost:8000/api/v1/docs" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop`n" -ForegroundColor Yellow

python -B -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
