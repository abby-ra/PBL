import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Chat from './pages/Chat';
import Predictions from './pages/Predictions';
import Decisions from './pages/Decisions';
import History from './pages/History';
import Settings from './pages/Settings';
import './index.css';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-base)' }}>
        <div className="spinner" style={{ width:28, height:28 }} />
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout><Navigate to="/dashboard" replace /></Layout></PrivateRoute>} />
      <Route path="/dashboard"   element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/analytics"   element={<PrivateRoute><Layout><Analytics /></Layout></PrivateRoute>} />
      <Route path="/chat"        element={<PrivateRoute><Layout><Chat /></Layout></PrivateRoute>} />
      <Route path="/predictions" element={<PrivateRoute><Layout><Predictions /></Layout></PrivateRoute>} />
      <Route path="/decisions"   element={<PrivateRoute><Layout><Decisions /></Layout></PrivateRoute>} />
      <Route path="/history"     element={<PrivateRoute><Layout><History /></Layout></PrivateRoute>} />
      <Route path="/settings"    element={<PrivateRoute><Layout><Settings /></Layout></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}