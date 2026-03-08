import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import { Add, Edit, Delete, Refresh } from '@mui/icons-material';
import api from '../services/api';

const Decisions = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    conditions: '{}',
    actions: '[]',
    priority: 5,
    enabled: true
  });

  const loadRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/decisions/rules');
      setRules(response.data.rules || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleOpenDialog = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        description: rule.description,
        conditions: JSON.stringify(rule.conditions, null, 2),
        actions: JSON.stringify(rule.actions, null, 2),
        priority: rule.priority,
        enabled: rule.enabled
      });
    } else {
      setEditingRule(null);
      setFormData({
        name: '',
        description: '',
        conditions: '{}',
        actions: '[]',
        priority: 5,
        enabled: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRule(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        conditions: JSON.parse(formData.conditions),
        actions: JSON.parse(formData.actions),
        priority: parseInt(formData.priority),
        enabled: formData.enabled
      };

      if (editingRule) {
        await api.put(`/decisions/rules/${editingRule.rule_id}`, payload);
      } else {
        await api.post('/decisions/rules', payload);
      }

      handleCloseDialog();
      loadRules();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save rule');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;

    setLoading(true);
    setError(null);

    try {
      await api.delete(`/decisions/rules/${ruleId}`);
      loadRules();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete rule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Decision Rules
        </Typography>
        <Box>
          <IconButton onClick={loadRules} color="primary" sx={{ mr: 1 }}>
            <Refresh />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Create Rule
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary">
                      No decision rules found. Create one to get started!
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.rule_id}>
                    <TableCell>{rule.rule_id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {rule.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {rule.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={rule.priority}
                        size="small"
                        color={rule.priority >= 8 ? 'error' : rule.priority >= 5 ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={rule.enabled ? 'Enabled' : 'Disabled'}
                        size="small"
                        color={rule.enabled ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {rule.created_at ? new Date(rule.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(rule)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(rule.rule_id)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRule ? 'Edit Decision Rule' : 'Create Decision Rule'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rule Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Priority (1-10)"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                inputProps={{ min: 1, max: 10 }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                value={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.value === 'true' })}
                SelectProps={{ native: true }}
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Conditions (JSON)"
                value={formData.conditions}
                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                multiline
                rows={4}
                helperText='Example: {"inventory_level": {"lt": 20}, "demand": {"gt": 100}}'
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Actions (JSON Array)"
                value={formData.actions}
                onChange={(e) => setFormData({ ...formData, actions: e.target.value })}
                multiline
                rows={3}
                helperText='Example: ["create_purchase_order", "notify_manager", "update_inventory"]'
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : editingRule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Decisions;
