#!/bin/bash

# Enterprise Decision Support AI - Setup Script
# This script sets up the development environment

set -e

echo "========================================="
echo " Enterprise Decision Support AI Setup   "
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."
echo ""

# Check Python
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    print_success "Python ${PYTHON_VERSION} found"
else
    print_error "Python 3.11+ is required but not found"
    exit 1
fi

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js ${NODE_VERSION} found"
else
    print_error "Node.js 18+ is required but not found"
    exit 1
fi

# Check Docker
if command_exists docker; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
    print_success "Docker ${DOCKER_VERSION} found"
else
    print_info "Docker not found (optional for development)"
fi

# Check PostgreSQL
if command_exists psql; then
    POSTGRES_VERSION=$(psql --version | cut -d' ' -f3)
    print_success "PostgreSQL ${POSTGRES_VERSION} found"
else
    print_info "PostgreSQL not found (will use Docker if available)"
fi

echo ""
echo "========================================="
echo " Setting up Backend                      "
echo "========================================="
echo ""

# Navigate to backend directory
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    print_info "Creating Python virtual environment..."
    python3 -m venv venv
    print_success "Virtual environment created"
else
    print_info "Virtual environment already exists"
fi

# Activate virtual environment
source venv/bin/activate || source venv/Scripts/activate

# Upgrade pip
print_info "Upgrading pip..."
pip install --upgrade pip > /dev/null 2>&1
print_success "Pip upgraded"

# Install dependencies
print_info "Installing Python dependencies (this may take a while)..."
pip install -r requirements.txt > /dev/null 2>&1
print_success "Python dependencies installed"

# Setup environment file
if [ ! -f ".env" ]; then
    print_info "Creating .env file from template..."
    cp .env.example .env
    print_success ".env file created - Please update with your configuration"
else
    print_info ".env file already exists"
fi

cd ..

echo ""
echo "========================================="
echo " Setting up Frontend                     "
echo "========================================="
echo ""

# Navigate to frontend directory
cd frontend

# Install dependencies
print_info "Installing Node.js dependencies (this may take a while)..."
npm install > /dev/null 2>&1
print_success "Node.js dependencies installed"

# Setup environment file
if [ ! -f ".env" ]; then
    print_info "Creating .env file from template..."
    cp .env.example .env
    print_success ".env file created"
else
    print_info ".env file already exists"
fi

cd ..

echo ""
echo "========================================="
echo " Setup Complete!                         "
echo "========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Update configuration files:"
echo "   - backend/.env (database, API keys)"
echo "   - frontend/.env (API URL)"
echo ""
echo "2. Start the development environment:"
echo ""
echo "   Option A: Using Docker (recommended)"
echo "   $ docker-compose up -d"
echo ""
echo "   Option B: Manual start"
echo "   Terminal 1 (Backend):"
echo "   $ cd backend"
echo "   $ source venv/bin/activate  # or venv\\Scripts\\activate on Windows"
echo "   $ uvicorn app.main:app --reload"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   $ cd frontend"
echo "   $ npm start"
echo ""
echo "3. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/api/v1/docs"
echo ""
echo "For more information, see README.md"
echo ""
