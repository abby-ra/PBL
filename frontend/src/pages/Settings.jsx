import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  Switch,
  FormControlLabel,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Person,
  Lock,
  Security,
  Notifications,
  Dashboard,
  Edit,
  PhotoCamera,
  Save,
  Delete,
  DragIndicator,
  Add
} from '@mui/icons-material';
import { useSelector } from 'react-redux';

const Settings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const currentUser = useSelector((state) => state.auth.user);

  // Personal Settings State
  const [profile, setProfile] = useState({
    name: currentUser?.full_name || '',
    email: currentUser?.email || '',
    photo: null
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    predictionAlerts: true,
    decisionAlerts: true,
    weeklyReport: true
  });

  // Dashboard Customization State
  const [dashboardSettings, setDashboardSettings] = useState({
    theme: 'light',
    defaultDateRange: '30',
    defaultGroupBy: 'day',
    autoRefresh: false,
    refreshInterval: 300
  });

  const [widgets, setWidgets] = useState([
    { id: 1, name: 'Predictions Summary', enabled: true },
    { id: 2, name: 'Recent Decisions', enabled: true },
    { id: 3, name: 'Analytics Chart', enabled: true },
    { id: 4, name: 'Quick Actions', enabled: false },
    { id: 5, name: 'AI Insights', enabled: true }
  ]);

  const [favoriteReports, setFavoriteReports] = useState([
    'Monthly Analytics',
    'Churn Analysis Report'
  ]);

  const [newReport, setNewReport] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Handlers
  const handleProfileUpdate = () => {
    setSuccess('Profile updated successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match!');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters!');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setSuccess('Password changed successfully!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setSuccess(null), 3000);
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNotificationChange = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
  };

  const handleDashboardSettingChange = (key, value) => {
    setDashboardSettings({ ...dashboardSettings, [key]: value });
  };

  const handleWidgetToggle = (id) => {
    setWidgets(widgets.map(w => 
      w.id === id ? { ...w, enabled: !w.enabled } : w
    ));
  };

  const handleAddReport = () => {
    if (newReport.trim()) {
      setFavoriteReports([...favoriteReports, newReport]);
      setNewReport('');
      setDialogOpen(false);
    }
  };

  const handleRemoveReport = (report) => {
    setFavoriteReports(favoriteReports.filter(r => r !== report));
  };

  const handleSaveSettings = () => {
    setSuccess('Settings saved successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ mt: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<Person />} label="Personal Settings" />
          <Tab icon={<Dashboard />} label="Dashboard Customization" />
        </Tabs>

        {/* Personal Settings Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Profile Management */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Person sx={{ mr: 1 }} />
                      <Typography variant="h6">Profile Management</Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                      <Grid item xs={12} display="flex" alignItems="center" gap={2}>
                        <Avatar
                          src={profile.photo}
                          sx={{ width: 100, height: 100 }}
                        >
                          {profile.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="photo-upload"
                            type="file"
                            onChange={handlePhotoUpload}
                          />
                          <label htmlFor="photo-upload">
                            <Button
                              variant="outlined"
                              component="span"
                              startIcon={<PhotoCamera />}
                            >
                              Upload Photo
                            </Button>
                          </label>
                          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            JPG, PNG or GIF (max 5MB)
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Full Name"
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Button
                          variant="contained"
                          startIcon={<Save />}
                          onClick={handleProfileUpdate}
                        >
                          Update Profile
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Change Password */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Lock sx={{ mr: 1 }} />
                      <Typography variant="h6">Change Password</Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          type="password"
                          label="Current Password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="password"
                          label="New Password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          helperText="Minimum 8 characters"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="password"
                          label="Confirm New Password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          variant="contained"
                          onClick={handlePasswordChange}
                        >
                          Change Password
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Two-Factor Authentication */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Security sx={{ mr: 1 }} />
                      <Typography variant="h6">Two-Factor Authentication</Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />

                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="body1" gutterBottom>
                          Add an extra layer of security to your account
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {twoFactorEnabled 
                            ? 'Two-factor authentication is currently enabled' 
                            : 'Enable 2FA to protect your account'}
                        </Typography>
                      </Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={twoFactorEnabled}
                            onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                            color="primary"
                          />
                        }
                        label={twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      />
                    </Box>

                    {twoFactorEnabled && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                        <Typography variant="body2">
                          <strong>Setup Code:</strong> XXXX-XXXX-XXXX-XXXX
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          Use this code with your authenticator app (Google Authenticator, Authy, etc.)
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Notification Preferences */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Notifications sx={{ mr: 1 }} />
                      <Typography variant="h6">Notification Preferences</Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />

                    <List>
                      <ListItem>
                        <ListItemText
                          primary="Email Notifications"
                          secondary="Receive updates via email"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={notifications.emailNotifications}
                            onChange={() => handleNotificationChange('emailNotifications')}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Push Notifications"
                          secondary="Browser push notifications"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={notifications.pushNotifications}
                            onChange={() => handleNotificationChange('pushNotifications')}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Prediction Alerts"
                          secondary="Notify when predictions complete"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={notifications.predictionAlerts}
                            onChange={() => handleNotificationChange('predictionAlerts')}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Decision Alerts"
                          secondary="Notify when decision rules trigger"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={notifications.decisionAlerts}
                            onChange={() => handleNotificationChange('decisionAlerts')}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Weekly Reports"
                          secondary="Receive weekly analytics summary"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={notifications.weeklyReport}
                            onChange={() => handleNotificationChange('weeklyReport')}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Dashboard Customization Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Color Theme */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Color Theme
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <FormControl fullWidth>
                      <InputLabel>Theme</InputLabel>
                      <Select
                        value={dashboardSettings.theme}
                        label="Theme"
                        onChange={(e) => handleDashboardSettingChange('theme', e.target.value)}
                      >
                        <MenuItem value="light">Light Mode</MenuItem>
                        <MenuItem value="dark">Dark Mode</MenuItem>
                        <MenuItem value="auto">Auto (System Default)</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>

              {/* Default Date Range */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Default Date Range
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <FormControl fullWidth>
                      <InputLabel>Date Range</InputLabel>
                      <Select
                        value={dashboardSettings.defaultDateRange}
                        label="Date Range"
                        onChange={(e) => handleDashboardSettingChange('defaultDateRange', e.target.value)}
                      >
                        <MenuItem value="7">Last 7 days</MenuItem>
                        <MenuItem value="30">Last 30 days</MenuItem>
                        <MenuItem value="90">Last 90 days</MenuItem>
                        <MenuItem value="180">Last 6 months</MenuItem>
                        <MenuItem value="365">Last year</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>

              {/* Default Grouping */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Default Data Grouping
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <FormControl fullWidth>
                      <InputLabel>Group By</InputLabel>
                      <Select
                        value={dashboardSettings.defaultGroupBy}
                        label="Group By"
                        onChange={(e) => handleDashboardSettingChange('defaultGroupBy', e.target.value)}
                      >
                        <MenuItem value="day">Day</MenuItem>
                        <MenuItem value="week">Week</MenuItem>
                        <MenuItem value="month">Month</MenuItem>
                        <MenuItem value="quarter">Quarter</MenuItem>
                        <MenuItem value="year">Year</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>

              {/* Auto Refresh */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Auto Refresh
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box display="flex" alignItems="center" gap={2}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={dashboardSettings.autoRefresh}
                            onChange={(e) => handleDashboardSettingChange('autoRefresh', e.target.checked)}
                          />
                        }
                        label="Enable Auto Refresh"
                      />
                    </Box>
                    {dashboardSettings.autoRefresh && (
                      <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Refresh Interval</InputLabel>
                        <Select
                          value={dashboardSettings.refreshInterval}
                          label="Refresh Interval"
                          onChange={(e) => handleDashboardSettingChange('refreshInterval', e.target.value)}
                        >
                          <MenuItem value={60}>1 minute</MenuItem>
                          <MenuItem value={300}>5 minutes</MenuItem>
                          <MenuItem value={600}>10 minutes</MenuItem>
                          <MenuItem value={1800}>30 minutes</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Widget Layout */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        Widget Layout
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Toggle widgets on/off (drag to reorder)
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <List>
                      {widgets.map((widget) => (
                        <ListItem
                          key={widget.id}
                          sx={{
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            mb: 1,
                            bgcolor: widget.enabled ? 'background.paper' : 'action.disabledBackground'
                          }}
                        >
                          <IconButton size="small" sx={{ cursor: 'grab' }}>
                            <DragIndicator />
                          </IconButton>
                          <ListItemText
                            primary={widget.name}
                            secondary={widget.enabled ? 'Active' : 'Hidden'}
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              checked={widget.enabled}
                              onChange={() => handleWidgetToggle(widget.id)}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Favorite Reports */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        Favorite Reports
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<Add />}
                        onClick={() => setDialogOpen(true)}
                      >
                        Add Report
                      </Button>
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {favoriteReports.map((report, idx) => (
                        <Chip
                          key={idx}
                          label={report}
                          onDelete={() => handleRemoveReport(report)}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                      {favoriteReports.length === 0 && (
                        <Typography variant="body2" color="textSecondary">
                          No favorite reports yet. Add one to get started!
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Save Button */}
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Save />}
                  onClick={handleSaveSettings}
                >
                  Save All Settings
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Add Report Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Add Favorite Report</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Report Name"
            value={newReport}
            onChange={(e) => setNewReport(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="e.g., Daily Sales Report"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddReport} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Settings;
