# 🔐 Login & Registration System Guide

## ✅ Setup Complete!

Your Enterprise Decision Support AI now has a complete authentication system with both **Login** and **Registration** functionality.

---

## 👥 Pre-configured Login Credentials

Two test accounts are ready to use:

### 1. Admin Account
- **Email:** `admin@test.com`
- **Password:** `admin123`
- **Role:** Admin (Viewer permissions)
- **Status:** ✓ Active

### 2. Regular User Account
- **Email:** `user@test.com`
- **Password:** `user123`
- **Role:** Viewer
- **Status:** ✓ Active

---

## 🔄 Complete User Flow

### **For New Users (First Time)**

1. **Visit the Application**
   - Open: `http://localhost:3000`
   - You'll see the Login page with two tabs: **Login** and **Register**

2. **Click the "Register" Tab**
   - Enter your details:
     - Full Name
     - Email Address
     - Password (minimum 6 characters)
     - Confirm Password
   - Click "Create Account"

3. **Automatic Database Storage**
   - ✅ Your details are automatically saved in MySQL database
   - ✅ Table: `enterprise_ai_db.users`
   - ✅ Stored fields: email, password, full_name, role, timestamps

4. **Success Message**
   - Shows: "Registration successful! Please login with your credentials."
   - Automatically switches to Login tab after 2 seconds
   - Your email is pre-filled in the login form

5. **Login**
   - Enter your registered email and password
   - Click "Sign In"
   - Redirected to Dashboard

### **For Existing Users (2nd+ Time)**

1. **Visit the Application**
   - Open: `http://localhost:3000`
   - Login tab is shown by default

2. **Enter Credentials**
   - Email: Your registered email
   - Password: Your password
   - Click "Sign In"

3. **Automatic Verification**
   - ✅ Backend checks if email exists in database
   - ✅ Verifies password matches stored password
   - ✅ Updates last login timestamp
   - ✅ Generates JWT access token

4. **Access Granted**
   - Redirected to Dashboard
   - Full access to all features

---

## 🔒 Security Features Implemented

### **Registration Validation**
```
✓ Email format validation
✓ Duplicate email check (prevents re-registration)
✓ Password minimum length (6 characters)
✓ Password confirmation match
✓ Auto-sanitization of inputs
```

### **Login Validation**
```
✓ Email existence check in database
✓ Password verification against stored password
✓ Active account status check
✓ JWT token generation for session management
✓ Last login timestamp update
```

### **Error Handling**
```
✓ "Email already registered" → Prompts to login instead
✓ "Invalid credentials" → Suggests registration for new users
✓ "Inactive user" → Account disabled message
✓ Network errors → User-friendly error messages
```

---

## 📊 Database Integration

### **When You Register:**
```sql
INSERT INTO users (
    email, 
    hashed_password, 
    full_name, 
    role, 
    is_active,
    created_at
) VALUES (
    'your_email@example.com',
    'your_password',
    'Your Name',
    'VIEWER',
    1,
    CURRENT_TIMESTAMP
);
```

### **When You Login:**
```sql
-- Step 1: Find user
SELECT * FROM users WHERE email = 'your_email@example.com';

-- Step 2: Verify password
-- (Done in application code)

-- Step 3: Update last login
UPDATE users 
SET last_login = CURRENT_TIMESTAMP 
WHERE email = 'your_email@example.com';
```

---

## 🎯 User Interface Features

### **Login Tab**
- Email and password fields
- "Sign In" button
- Link to switch to Register tab
- Demo credentials display box
- Error messages for invalid login
- Success message on login
- Loading spinner during authentication

### **Register Tab**
- Full Name field
- Email field
- Password field (with hint: "Minimum 6 characters")
- Confirm Password field
- "Create Account" button
- Link to switch back to Login tab
- Error messages for validation issues
- Success message on registration
- Auto-redirect to Login after success

### **Error Messages**
| Scenario | Message |
|----------|---------|
| Email already exists | "This email is already registered. Please login instead." |
| Invalid login | "Invalid email or password. If you are new, please register first." |
| Passwords don't match | "Passwords do not match!" |
| Password too short | "Password must be at least 6 characters long!" |
| Account inactive | "Inactive user" |

---

## 🔄 Complete Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Opens App                            │
│              http://localhost:3000                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                ┌────────────────┐
                │  Is New User?  │
                └────────┬───────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
   ┌──────────────┐              ┌──────────────┐
   │   YES - NEW  │              │ NO - EXISTING │
   │     USER     │              │     USER      │
   └──────┬───────┘              └──────┬────────┘
          │                             │
          ▼                             ▼
   ┌──────────────┐              ┌──────────────┐
   │ REGISTER TAB │              │  LOGIN TAB   │
   └──────┬───────┘              └──────┬────────┘
          │                             │
          │ Fill Form:                  │ Enter:
          │ • Full Name                 │ • Email
          │ • Email                     │ • Password
          │ • Password                  │
          │ • Confirm Password          │
          │                             │
          ▼                             ▼
   ┌──────────────────┐          ┌──────────────────┐
   │ Click "Create    │          │ Click "Sign In"  │
   │     Account"     │          │                  │
   └──────┬───────────┘          └──────┬───────────┘
          │                             │
          ▼                             ▼
   ┌──────────────────────────────────────────────┐
   │  Frontend sends to Backend API               │
   │  POST /api/v1/auth/register                  │
   │  POST /api/v1/auth/login                     │
   └──────────────────┬───────────────────────────┘
                      │
                      ▼
   ┌──────────────────────────────────────────────┐
   │        Backend Validates Credentials         │
   │                                               │
   │  Register:                    Login:          │
   │  • Check if email exists    • Find user      │
   │  • Validate password        • Verify pwd     │
   │  • Create user record       • Check active   │
   │  • Save to database         • Update login   │
   │                                               │
   └──────────────────┬───────────────────────────┘
                      │
                      ▼
   ┌──────────────────────────────────────────────┐
   │           MySQL Database Query               │
   │                                               │
   │  Register: INSERT INTO users (...)           │
   │  Login: SELECT + UPDATE users                │
   └──────────────────┬───────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────┐
        │    Validation Result    │
        └──────┬──────────────────┘
               │
     ┌─────────┴─────────┐
     │                   │
     ▼                   ▼
┌─────────┐         ┌─────────┐
│ SUCCESS │         │  ERROR  │
└────┬────┘         └────┬────┘
     │                   │
     ▼                   ▼
┌─────────────────┐ ┌────────────────────┐
│ Register: Show  │ │ Show Error Message │
│ success, switch │ │ • Already exists   │
│ to Login tab    │ │ • Invalid creds    │
│                 │ │ • Validation fail  │
│ Login: Generate │ └────────────────────┘
│ JWT token, save │
│ to localStorage │
│ redirect to     │
│ /dashboard      │
└─────────────────┘
```

---

## 🚀 Testing the System

### **Test Registration (New User)**
1. Open: http://localhost:3000
2. Click "Register" tab
3. Enter:
   - Full Name: `Test User 3`
   - Email: `test3@example.com`
   - Password: `password123`
   - Confirm: `password123`
4. Click "Create Account"
5. ✅ Should show success message
6. ✅ Auto-switch to Login tab
7. ✅ Email pre-filled

### **Test Login (Existing User)**
1. Stay on Login tab (or refresh page)
2. Enter:
   - Email: `admin@test.com`
   - Password: `admin123`
3. Click "Sign In"
4. ✅ Should redirect to Dashboard
5. ✅ JWT token stored in browser
6. ✅ User info available in app

### **Test Duplicate Registration**
1. Try to register with `admin@test.com` again
2. ✅ Should show: "This email is already registered. Please login instead."

### **Test Invalid Login**
1. Enter:
   - Email: `wrong@example.com`
   - Password: `wrongpass`
2. ✅ Should show: "Invalid email or password. If you are new, please register first."

---

## 📁 Files Modified/Created

### **Backend**
- ✅ `backend/create_test_users.py` - Script to create test users
- ✅ `backend/list_users.py` - Script to list registered users
- ✅ `backend/app/routes.py` - Already has login/register endpoints
- ✅ Database: 2 users created in `users` table

### **Frontend**
- ✅ `frontend/src/pages/Login.jsx` - Updated with tabs and full functionality
  - Login tab with demo credentials display
  - Register tab with validation
  - Error and success message handling
  - Auto-redirect after successful registration
  - Toggle between Login/Register

---

## 🔍 Verify Database Records

Run this to see all registered users:
```powershell
cd D:\Project\PBL\backend
.\venv\Scripts\python.exe list_users.py
```

Or access database directly:
```powershell
cd "C:\Program Files\MySQL\MySQL Server 8.4\bin"
.\mysql -u root
USE enterprise_ai_db;
SELECT id, email, full_name, role, is_active, created_at FROM users;
```

---

## 📝 Summary

### **What Works Now:**

✅ **Two Pre-configured Accounts**
- admin@test.com / admin123
- user@test.com / user123

✅ **Registration System**
- New users can create accounts
- Automatic database storage
- Email uniqueness validation
- Password strength validation
- Password confirmation matching

✅ **Login System**
- Existing users can login
- Email existence verification
- Password verification
- JWT token generation
- Session management

✅ **Error Handling**
- Clear error messages
- Guided user flow
- Validation feedback

✅ **User Experience**
- Tabbed interface (Login/Register)
- Demo credentials display
- Auto-redirect after registration
- Loading states
- Success/Error alerts

---

## 🎉 Ready to Use!

Your authentication system is fully functional. Users can:
1. **Register** → Credentials saved to database
2. **Login** → System verifies against database
3. **Access Dashboard** → Full application features

Start the frontend to test:
```powershell
cd D:\Project\PBL\frontend
npm start
```

Then visit: **http://localhost:3000**
