# 📋 PBL Project Complete Workflow Documentation

## 🎯 Project Overview
**Enterprise Decision Support AI System** - Full-stack application with React frontend and FastAPI backend connected to MySQL database.

---

## 📂 Project Structure & File Locations

```
D:\Project\PBL\
│
├── frontend/                          # React Application (Port 3000)
│   ├── node_modules/                  # 📦 Frontend Dependencies (npm packages)
│   ├── public/                        # Static assets
│   │   └── index.html                 # 🎯 Entry HTML file
│   ├── src/                           # Source code
│   │   ├── index.js                   # 🚀 FRONTEND START POINT
│   │   ├── App.jsx                    # Main React component with routing
│   │   ├── index.css                  # Global styles
│   │   ├── components/                # Reusable components
│   │   │   └── common/
│   │   │       ├── Layout.jsx         # Page layout wrapper
│   │   │       └── PrivateRoute.jsx   # Authentication guard
│   │   ├── pages/                     # Page components
│   │   │   ├── Login.jsx              # Login page
│   │   │   ├── Dashboard.jsx          # Main dashboard
│   │   │   ├── Analytics.jsx          # Analytics page
│   │   │   ├── Predictions.jsx        # Predictions page
│   │   │   ├── Decisions.jsx          # Decisions page
│   │   │   ├── Chat.jsx               # Chat interface
│   │   │   └── Settings.jsx           # Settings page
│   │   ├── services/                  # External service integrations
│   │   │   ├── api.js                 # 🔌 Axios API client
│   │   │   └── websocket.js           # WebSocket connection
│   │   └── store/                     # Redux state management
│   │       ├── store.js               # Redux store config
│   │       └── slices/                # State slices
│   │           ├── authSlice.js       # Authentication state
│   │           ├── chatSlice.js       # Chat state
│   │           ├── dashboardSlice.js  # Dashboard state
│   │           └── predictionsSlice.js # Predictions state
│   ├── package.json                   # 📦 Frontend dependencies list
│   ├── package-lock.json              # Locked dependency versions
│   ├── Dockerfile                     # Docker image config
│   └── nginx.conf                     # Nginx configuration
│
├── backend/                           # FastAPI Application (Port 8000)
│   ├── venv/                          # 📦 Backend Dependencies (Python packages)
│   │   ├── Scripts/                   # Windows executables
│   │   │   ├── python.exe             # Virtual environment Python
│   │   │   ├── pip.exe                # Package installer
│   │   │   └── uvicorn.exe            # ASGI server
│   │   └── Lib/                       # Installed Python packages
│   │       └── site-packages/         # All backend dependencies here
│   ├── app/                           # Application code
│   │   ├── __init__.py                # Package marker
│   │   ├── main.py                    # 🚀 BACKEND START POINT
│   │   ├── routes.py                  # All API endpoints (14 routes)
│   │   ├── models.py                  # Database models (User, Prediction, Decision)
│   │   ├── core/                      # Core configurations
│   │   │   ├── __init__.py
│   │   │   ├── config.py              # 🔧 App settings & environment variables
│   │   │   └── security.py            # 🔐 JWT authentication & password handling
│   │   └── db/                        # Database configuration
│   │       ├── __init__.py
│   │       ├── session.py             # 🔌 Database connection manager
│   │       └── base.py                # SQLAlchemy base class
│   ├── requirements.txt               # 📦 Backend dependencies list
│   ├── .env                           # 🔐 Environment variables (MySQL config)
│   ├── start.ps1                      # 🚀 Startup script (Windows)
│   ├── test_backend.py                # Backend test script
│   └── Dockerfile                     # Docker image config
│
├── scripts/                           # Utility scripts
│   ├── setup.sh                       # Linux/Mac setup
│   └── setup.bat                      # Windows setup
│
├── docs/                              # Documentation
│   ├── API.md                         # API documentation
│   ├── ARCHITECTURE.md                # Architecture details
│   ├── DATABASE.md                    # Database schema
│   └── DEPLOYMENT.md                  # Deployment guide
│
├── docker-compose.yml                 # Docker orchestration
├── .gitignore                         # Git ignore rules
├── README.md                          # Project overview
├── PROJECT_OVERVIEW.md                # Detailed overview
└── WORKFLOW.md                        # 📋 THIS FILE

```

---

## 🔄 Complete Application Flow

### 1️⃣ **Application Startup Flow**

#### **Starting Backend** (Port 8000)
```powershell
Location: D:\Project\PBL\backend

# Method 1: Using startup script
.\start.ps1

# Method 2: Direct command
D:\Project\PBL\backend\venv\Scripts\python.exe -B -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend Startup Sequence:**
```
1. D:\Project\PBL\backend\venv\Scripts\python.exe
   └─> Loads Python 3.12 from virtual environment

2. Imports app.main module
   └─> D:\Project\PBL\backend\app\main.py
       ├─> Reads config from app.core.config
       ├─> Loads routes from app.routes
       ├─> Connects to database via app.db.session
       └─> Creates FastAPI application

3. Lifespan events trigger
   ├─> Startup: Creates database tables if needed
   └─> Connects to MySQL at localhost:3306

4. Uvicorn starts server
   └─> Listens on http://0.0.0.0:8000
```

#### **Starting Frontend** (Port 3000)
```powershell
Location: D:\Project\PBL\frontend

npm start
```

**Frontend Startup Sequence:**
```
1. npm reads package.json
   └─> Executes "react-scripts start"

2. React Scripts starts development server
   ├─> Loads node_modules/ dependencies
   ├─> Webpack bundles JavaScript
   └─> Starts dev server on http://localhost:3000

3. Loads public/index.html
   └─> Injects <div id="root"></div>

4. Executes src/index.js
   ├─> Imports React & ReactDOM
   ├─> Imports App component
   └─> Renders App into root div

5. App.jsx initializes
   ├─> Wraps with Redux Provider (state management)
   ├─> Wraps with Material-UI ThemeProvider (styling)
   ├─> Sets up React Router (navigation)
   └─> Renders Login page (default route)
```

---

### 2️⃣ **User Authentication Flow**

```
┌──────────────┐
│   Browser    │ User opens http://localhost:3000
│ (User visit) │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  FRONTEND (React - Port 3000)                            │
│  Location: D:\Project\PBL\frontend\src\                 │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  1. index.js → App.jsx → React Router                    │
│     └─> Route "/" → Redirects to /login                  │
│                                                           │
│  2. pages/Login.jsx renders                              │
│     ├─> User enters email & password                     │
│     └─> Clicks "Login" button                            │
│                                                           │
│  3. services/api.js sends request                        │
│     POST http://localhost:8000/api/v1/auth/login         │
│     Body: { username: "admin@test.com",                  │
│             password: "admin123" }                       │
│                                                           │
└───────────────────────┬──────────────────────────────────┘
                        │ HTTP Request
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│  BACKEND (FastAPI - Port 8000)                           │
│  Location: D:\Project\PBL\backend\app\                  │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  4. app/main.py receives request                         │
│     └─> CORS middleware validates origin                 │
│     └─> Routes to app/routes.py                          │
│                                                           │
│  5. routes.py: @router.post("/auth/login")               │
│     ├─> Receives form data                               │
│     ├─> Calls app/db/session.py to get database session │
│     └─> Queries User model                               │
│                                                           │
│  6. Connects to MySQL                                    │
│     Location: localhost:3306                             │
│     Database: enterprise_ai_db                           │
│     └─> SELECT * FROM users WHERE email = ?             │
│                                                           │
└───────────────────────┬──────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│  DATABASE (MySQL Server 8.4)                             │
│  Location: C:\Program Files\MySQL\MySQL Server 8.4\     │
│  Data Dir: C:\Program Files\MySQL\MySQL Server 8.4\data\│
├──────────────────────────────────────────────────────────┤
│                                                           │
│  7. MySQL executes query                                 │
│     Database: enterprise_ai_db                           │
│     Table: users                                         │
│     └─> Returns user record with id=1                    │
│                                                           │
└───────────────────────┬──────────────────────────────────┘
                        │ User Data
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│  BACKEND (FastAPI)                                       │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  8. routes.py validates password                         │
│     └─> app/core/security.py: verify_password()         │
│         (Direct string comparison)                       │
│                                                           │
│  9. Creates JWT tokens                                   │
│     └─> app/core/security.py: create_access_token()     │
│         └─> Encodes: { sub: "1",                         │
│                        email: "admin@test.com",          │
│                        role: "viewer",                   │
│                        exp: timestamp }                  │
│                                                           │
│  10. Returns response                                    │
│      { access_token: "eyJhbGc...",                       │
│        refresh_token: "eyJhbGc...",                      │
│        token_type: "bearer" }                            │
│                                                           │
└───────────────────────┬──────────────────────────────────┘
                        │ HTTP Response
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│  FRONTEND (React)                                        │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  11. services/api.js receives response                   │
│      └─> Stores tokens in localStorage                   │
│          - access_token → Browser storage                │
│          - refresh_token → Browser storage               │
│                                                           │
│  12. Redux authSlice updates                             │
│      └─> Sets user as authenticated                      │
│      └─> Stores user info in state                       │
│                                                           │
│  13. React Router redirects                              │
│      Location: /login → /dashboard                       │
│      Component: pages/Dashboard.jsx renders              │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

### 3️⃣ **API Request Flow (Protected Route)**

Example: User views Dashboard → Fetches analytics data

```
┌──────────────────────────────────────────────────────────┐
│  FRONTEND                                                │
│  Location: D:\Project\PBL\frontend\src\pages\           │
│            Dashboard.jsx                                 │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  1. Dashboard.jsx useEffect() hook triggers              │
│     └─> Calls services/api.js                            │
│         api.get('/analytics/dashboard')                  │
│                                                           │
│  2. Axios interceptor (services/api.js)                  │
│     ├─> Reads access_token from localStorage            │
│     ├─> Adds Authorization header                        │
│     └─> Sends GET request                                │
│         http://localhost:8000/api/v1/analytics/dashboard │
│         Headers: { Authorization: "Bearer eyJhbGc..." }  │
│                                                           │
└───────────────────────┬──────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│  BACKEND                                                 │
│  Location: D:\Project\PBL\backend\app\                  │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  3. app/main.py receives request                         │
│     └─> Middleware checks CORS                           │
│     └─> Routes to app/routes.py                          │
│                                                           │
│  4. routes.py: @router.get("/analytics/dashboard")       │
│     └─> Dependency: get_current_user (from deps)        │
│                                                           │
│  5. Dependency execution                                 │
│     └─> Extracts token from Authorization header        │
│     └─> Calls core/security.py: decode JWT              │
│     └─> Gets user_id from token                          │
│     └─> Queries database for user                        │
│                                                           │
│  6. Queries MySQL database                               │
│     └─> Gets analytics data                              │
│     └─> Returns processed data                           │
│                                                           │
└───────────────────────┬──────────────────────────────────┘
                        │ JSON Response
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│  FRONTEND                                                │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  7. Axios receives response                              │
│     └─> Updates Redux store                              │
│     └─> Dashboard.jsx re-renders with data              │
│     └─> Charts and tables display data                   │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## 📦 Dependencies Storage & Access

### **Frontend Dependencies**

**Location:** `D:\Project\PBL\frontend\node_modules\`

**How They're Stored:**
```
frontend/
├── package.json              # Defines what packages to install
├── package-lock.json         # Locks exact versions
└── node_modules/             # All packages installed here
    ├── react/                # React library
    ├── react-dom/            # React DOM renderer
    ├── @mui/material/        # Material-UI components
    ├── @reduxjs/toolkit/     # Redux state management
    ├── axios/                # HTTP client
    ├── react-router-dom/     # Routing
    └── ... (1000+ packages)
```

**How They're Accessed:**
```javascript
// In any .jsx or .js file:
import React from 'react';              // → node_modules/react/
import { Provider } from 'react-redux'; // → node_modules/react-redux/
import axios from 'axios';              // → node_modules/axios/
```

**Installation Command:**
```bash
cd D:\Project\PBL\frontend
npm install                  # Reads package.json, installs to node_modules/
```

---

### **Backend Dependencies**

**Location:** `D:\Project\PBL\backend\venv\Lib\site-packages\`

**How They're Stored:**
```
backend/
├── requirements.txt          # Defines what packages to install
├── venv/                     # Virtual environment
│   ├── Scripts/
│   │   ├── python.exe        # Isolated Python interpreter
│   │   ├── pip.exe           # Package installer
│   │   └── uvicorn.exe       # ASGI server
│   └── Lib/
│       └── site-packages/    # All packages installed here
│           ├── fastapi/      # FastAPI framework
│           ├── sqlalchemy/   # ORM
│           ├── pydantic/     # Data validation
│           ├── uvicorn/      # ASGI server
│           ├── aiomysql/     # Async MySQL driver
│           ├── pymysql/      # MySQL driver
│           ├── jose/         # JWT tokens
│           └── ... (100+ packages)
```

**How They're Accessed:**
```python
# In any .py file:
from fastapi import FastAPI          # → venv/Lib/site-packages/fastapi/
from sqlalchemy import Column, String # → venv/Lib/site-packages/sqlalchemy/
import aiomysql                      # → venv/Lib/site-packages/aiomysql/
```

**Installation Command:**
```bash
cd D:\Project\PBL\backend

# Activate virtual environment
venv\Scripts\Activate.ps1

# Install packages
pip install -r requirements.txt      # Reads file, installs to venv/
```

---

## 🗄️ Database Flow

### **MySQL Database Structure**

**Server Location:** `C:\Program Files\MySQL\MySQL Server 8.4\`
**Data Location:** `C:\Program Files\MySQL\MySQL Server 8.4\data\enterprise_ai_db\`
**Service:** MySQL84 (Windows Service)

**Database Schema:**
```
enterprise_ai_db (Database)
│
├── users (Table)
│   ├── id (Integer, Primary Key, Auto-increment)
│   ├── email (String 100, Unique, Indexed)
│   ├── hashed_password (String 100)
│   ├── full_name (String 200)
│   ├── role (Enum: admin, manager, analyst, viewer)
│   ├── organization_id (Integer, Nullable)
│   ├── is_active (Boolean)
│   ├── last_login (DateTime, Nullable)
│   ├── created_at (DateTime)
│   └── updated_at (DateTime)
│
├── predictions (Table)
│   ├── id (Integer, Primary Key)
│   ├── user_id (Integer, Foreign Key → users.id)
│   ├── model_name (String 100)
│   ├── model_type (String 50)
│   ├── input_data (JSON)
│   ├── prediction_result (JSON)
│   ├── confidence_score (Float)
│   ├── execution_time_ms (Float)
│   ├── status (Enum: pending, completed, failed)
│   ├── created_at (DateTime)
│   └── updated_at (DateTime)
│
└── decisions (Table)
    ├── id (Integer, Primary Key)
    ├── user_id (Integer, Foreign Key → users.id)
    ├── decision_type (String 100)
    ├── context (JSON)
    ├── recommendation (Text)
    ├── confidence_score (Float)
    ├── status (Enum: pending, approved, rejected, implemented)
    ├── extra_data (JSON)
    ├── created_at (DateTime)
    └── updated_at (DateTime)
```

### **Database Connection Flow**

```
Python Code (backend/app)
        │
        ▼
app/core/config.py
  └─> DATABASE_URL = "mysql+aiomysql://root@localhost:3306/enterprise_ai_db"
        │
        ▼
app/db/session.py
  └─> create_async_engine(DATABASE_URL)
        │
        ▼
aiomysql driver (venv/Lib/site-packages/aiomysql/)
        │
        ▼
pymysql driver (venv/Lib/site-packages/pymysql/)
        │
        ▼
TCP Connection to localhost:3306
        │
        ▼
MySQL Server (C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe)
        │
        ▼
MySQL Data Files (C:\Program Files\MySQL\MySQL Server 8.4\data\)
  └─> enterprise_ai_db/
      ├─> users.ibd (InnoDB data file)
      ├─> predictions.ibd
      └─> decisions.ibd
```

---

## 🔌 API Endpoints Reference

**Base URL:** `http://localhost:8000/api/v1`

### **Authentication Endpoints**
```
POST   /auth/register          # Register new user
POST   /auth/login             # Login (returns JWT tokens)
POST   /auth/refresh           # Refresh access token
```

### **User Endpoints**
```
GET    /users/me               # Get current user profile
PUT    /users/me               # Update current user
```

### **Analytics Endpoints**
```
GET    /analytics/dashboard    # Get dashboard metrics
GET    /analytics/reports      # Get analytics reports
```

### **Predictions Endpoints**
```
POST   /predictions/sales-forecast      # Sales prediction
POST   /predictions/demand-forecast     # Demand prediction
GET    /predictions/history             # Prediction history
```

### **Decisions Endpoints**
```
POST   /decisions/evaluate      # Evaluate decision
GET    /decisions/history       # Decision history
GET    /decisions/rules         # Get decision rules
```

### **NLP Endpoints**
```
POST   /nlp/chat               # Chat with AI
POST   /nlp/sentiment          # Sentiment analysis
POST   /nlp/summarize          # Text summarization
```

### **System Endpoints**
```
GET    /health                 # Health check
```

---

## ⚙️ Configuration Files

### **Backend Configuration**

**File:** `D:\Project\PBL\backend\.env`
```env
# MySQL Configuration
MYSQL_SERVER=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DB=enterprise_ai_db

# Application
SECRET_KEY=<auto-generated>
DEBUG=True
ENVIRONMENT=development
LOG_LEVEL=INFO
```

**File:** `D:\Project\PBL\backend\app\core\config.py`
```python
# Reads .env file
# Provides settings object to entire application
# Accessed as: from app.core.config import settings
```

### **Frontend Configuration**

**File:** `D:\Project\PBL\frontend\src\services\api.js`
```javascript
const API_URL = 'http://localhost:8000/api/v1';  # Backend URL
```

---

## 🚀 Quick Start Commands

### **Full Application Startup**

**Terminal 1 - Backend:**
```powershell
cd D:\Project\PBL\backend
.\start.ps1
# Server starts on http://localhost:8000
```

**Terminal 2 - Frontend:**
```powershell
cd D:\Project\PBL\frontend
npm start
# Application opens at http://localhost:3000
```

### **Testing the Application**

**1. Open browser:** http://localhost:3000

**2. Login with test account:**
   - Email: `admin@test.com`
   - Password: `admin123`

**3. Navigate through pages:**
   - Dashboard → Analytics → Predictions → Decisions → Chat

---

## 🔄 Request/Response Lifecycle Summary

```
1. User Action (Browser)
   └─> React Component Event Handler
       └─> Redux Action Dispatch (optional)
           └─> API Call (services/api.js)
               │
               ▼
2. HTTP Request
   └─> axios with JWT token in header
       └─> http://localhost:8000/api/v1/...
               │
               ▼
3. Backend Receives Request
   └─> FastAPI (app/main.py)
       └─> CORS Middleware
           └─> Route Handler (app/routes.py)
               └─> Dependency Injection (get_current_user)
                   └─> JWT Verification (app/core/security.py)
                       │
                       ▼
4. Database Query
   └─> SQLAlchemy (app/db/session.py)
       └─> aiomysql driver
           └─> MySQL Server (localhost:3306)
               └─> enterprise_ai_db database
                   │
                   ▼
5. Data Processing
   └─> Backend processes data
       └─> Creates response object
           │
           ▼
6. HTTP Response (JSON)
   └─> FastAPI returns formatted JSON
       └─> GZIP compression
           │
           ▼
7. Frontend Receives Response
   └─> axios receives data
       └─> Updates Redux store (optional)
           └─> React component re-renders
               └─> UI updates with new data
```

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│   Browser   │ ← → localStorage (JWT tokens)
└──────┬──────┘
       │
       │ HTTP/WebSocket
       │
┌──────▼──────────────────────────────────────────┐
│  FRONTEND (http://localhost:3000)               │
│  ┌──────────────────────────────────────────┐  │
│  │ React Components (pages/*.jsx)           │  │
│  │  ├─> Login, Dashboard, Analytics...      │  │
│  │  └─> Material-UI Components              │  │
│  └──────────┬───────────────────────────────┘  │
│             │                                    │
│  ┌──────────▼───────────────────────────────┐  │
│  │ Redux Store (store/store.js)             │  │
│  │  ├─> auth state                          │  │
│  │  ├─> dashboard state                     │  │
│  │  └─> predictions state                   │  │
│  └──────────┬───────────────────────────────┘  │
│             │                                    │
│  ┌──────────▼───────────────────────────────┐  │
│  │ API Service (services/api.js)            │  │
│  │  ├─> Axios client                        │  │
│  │  ├─> Request interceptor (adds JWT)      │  │
│  │  └─> Response interceptor (auto-refresh) │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  Dependencies: node_modules/ (1000+ packages)   │
└──────────────────┬───────────────────────────────┘
                   │
                   │ REST API Calls
                   │ (JSON over HTTP)
                   │
┌──────────────────▼───────────────────────────────┐
│  BACKEND (http://localhost:8000)                 │
│  ┌──────────────────────────────────────────┐   │
│  │ FastAPI App (app/main.py)                │   │
│  │  ├─> CORS middleware                     │   │
│  │  ├─> Request timing                      │   │
│  │  └─> Error handling                      │   │
│  └──────────┬───────────────────────────────┘   │
│             │                                     │
│  ┌──────────▼───────────────────────────────┐   │
│  │ Routes (app/routes.py)                   │   │
│  │  ├─> 14 API endpoints                    │   │
│  │  ├─> Authentication                      │   │
│  │  ├─> Users, Analytics, Predictions       │   │
│  │  └─> Decisions, NLP, System              │   │
│  └──────────┬───────────────────────────────┘   │
│             │                                     │
│  ┌──────────▼───────────────────────────────┐   │
│  │ Security (app/core/security.py)          │   │
│  │  ├─> JWT token creation/verification     │   │
│  │  ├─> Password verification               │   │
│  │  └─> get_current_user dependency         │   │
│  └──────────┬───────────────────────────────┘   │
│             │                                     │
│  ┌──────────▼───────────────────────────────┐   │
│  │ Database Session (app/db/session.py)     │   │
│  │  ├─> AsyncEngine                         │   │
│  │  ├─> Connection pooling                  │   │
│  │  └─> get_db() dependency                 │   │
│  └──────────┬───────────────────────────────┘   │
│             │                                     │
│  ┌──────────▼───────────────────────────────┐   │
│  │ Models (app/models.py)                   │   │
│  │  ├─> User (SQLAlchemy model)             │   │
│  │  ├─> Prediction (SQLAlchemy model)       │   │
│  │  └─> Decision (SQLAlchemy model)         │   │
│  └──────────────────────────────────────────┘   │
│                                                   │
│  Dependencies: venv/Lib/site-packages/           │
└──────────────────┬────────────────────────────────┘
                   │
                   │ SQL Queries
                   │ (aiomysql + pymysql)
                   │
┌──────────────────▼────────────────────────────────┐
│  MySQL Server 8.4 (localhost:3306)                │
│  Location: C:\Program Files\MySQL\MySQL Server 8.4│
│  ┌────────────────────────────────────────────┐  │
│  │ enterprise_ai_db (Database)                │  │
│  │  ├─> users (1 record: admin@test.com)     │  │
│  │  ├─> predictions (empty)                   │  │
│  │  └─> decisions (empty)                     │  │
│  └────────────────────────────────────────────┘  │
│                                                    │
│  Data Storage: data\enterprise_ai_db\*.ibd files  │
└────────────────────────────────────────────────────┘
```

---

## 🎓 Key Takeaways

### **Frontend (React)**
- **Entry Point:** `frontend/src/index.js`
- **Dependencies:** Stored in `node_modules/`, installed via `npm install`
- **State Management:** Redux (store/slices/)
- **API Client:** Axios (services/api.js)
- **Routing:** React Router (App.jsx)
- **UI Framework:** Material-UI (@mui/material)

### **Backend (FastAPI)**
- **Entry Point:** `backend/app/main.py`
- **Dependencies:** Stored in `venv/Lib/site-packages/`, installed via `pip install`
- **Database:** SQLAlchemy ORM with async support
- **Authentication:** JWT tokens (python-jose)
- **API Framework:** FastAPI with Uvicorn server

### **Database (MySQL)**
- **Server:** MySQL 8.4 running as Windows service (MySQL84)
- **Location:** C:\Program Files\MySQL\MySQL Server 8.4\
- **Database Name:** enterprise_ai_db
- **Tables:** users, predictions, decisions
- **Connection:** aiomysql (async) + pymysql drivers

### **Communication**
- Frontend → Backend: REST API (HTTP/HTTPS)
- Backend → Database: SQL queries via SQLAlchemy ORM
- Authentication: JWT tokens in Authorization headers
- State Management: Redux (frontend), async sessions (backend)

---

## 🔗 Important URLs

- **Frontend Dev Server:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/api/v1/docs
- **Alternative API Docs:** http://localhost:8000/api/v1/redoc
- **Health Check:** http://localhost:8000/health
- **GitHub Repository:** https://github.com/abby-ra/PBL

---

## ✅ Current Status

- ✅ Backend running on port 8000
- ✅ MySQL database connected and initialized
- ✅ API endpoints functional (14 routes)
- ✅ Authentication working (JWT tokens)
- ✅ Test user created: admin@test.com
- ⏳ Frontend ready to start (npm start)

---

**Last Updated:** March 8, 2026
**Created by:** GitHub Copilot
**Project:** Enterprise Decision Support AI System (PBL)
