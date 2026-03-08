import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../store/slices/authSlice';
import api from '../services/api';

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const Login = () => {
  const [tabValue, setTabValue] = useState(0);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  
  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authState = useSelector((state) => state.auth);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
    setSuccess('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      await dispatch(login({ email: loginEmail, password: loginPassword })).unwrap();
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      console.error('Login failed:', err);
      if (err.response?.status === 401) {
        setError('Invalid email or password. If you are new, please register first.');
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Login failed. Please check your credentials or register if you are a new user.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation
    if (registerPassword !== registerConfirmPassword) {
      setError('Passwords do not match!');
      return;
    }
    
    if (registerPassword.length < 6) {
      setError('Password must be at least 6 characters long!');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.post('/auth/register', {
        email: registerEmail,
        password: registerPassword,
        full_name: registerFullName,
        role: 'viewer'
      });
      
      setSuccess('Registration successful! Please login with your credentials.');
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterFullName('');
      setRegisterConfirmPassword('');
      
      // Switch to login tab after 2 seconds
      setTimeout(() => {
        setTabValue(0);
        setLoginEmail(registerEmail);
        setSuccess('');
      }, 2000);
    } catch (err) {
      console.error('Registration failed:', err);
      if (err.response?.data?.detail) {
        if (err.response.data.detail.includes('already registered')) {
          setError('This email is already registered. Please login instead.');
        } else {
          setError(err.response.data.detail);
        }
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Enterprise Decision Support AI
          </Typography>
          <Typography variant="body2" align="center" color="textSecondary" gutterBottom>
            Your Intelligent Business Assistant
          </Typography>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} centered>
              <Tab label="Login" />
              <Tab label="Register" />
            </Tabs>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}

          {/* Login Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box component="form" onSubmit={handleLogin}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Existing users: Sign in with your credentials
              </Typography>
              <TextField
                margin="normal"
                required
                fullWidth
                id="login-email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="login-password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>
              
              <Divider sx={{ my: 2 }}>OR</Divider>
              
              <Typography variant="body2" align="center" color="textSecondary">
                New to our platform?{' '}
                <Button 
                  onClick={() => setTabValue(1)} 
                  sx={{ textTransform: 'none' }}
                >
                  Create an account
                </Button>
              </Typography>
            </Box>
          </TabPanel>

          {/* Register Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box component="form" onSubmit={handleRegister}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                New users: Create your account to get started
              </Typography>
              <TextField
                margin="normal"
                required
                fullWidth
                id="register-fullname"
                label="Full Name"
                name="fullname"
                autoComplete="name"
                autoFocus
                value={registerFullName}
                onChange={(e) => setRegisterFullName(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="register-email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="register-password"
                autoComplete="new-password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                helperText="Minimum 6 characters"
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="register-confirm-password"
                autoComplete="new-password"
                value={registerConfirmPassword}
                onChange={(e) => setRegisterConfirmPassword(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Create Account'}
              </Button>
              
              <Divider sx={{ my: 2 }}>OR</Divider>
              
              <Typography variant="body2" align="center" color="textSecondary">
                Already have an account?{' '}
                <Button 
                  onClick={() => setTabValue(0)} 
                  sx={{ textTransform: 'none' }}
                >
                  Sign in here
                </Button>
              </Typography>
            </Box>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
