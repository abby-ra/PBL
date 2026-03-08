import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { BarChart, TrendingUp, Assessment, Timeline } from '@mui/icons-material';
import api from '../services/api';

const Analytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    group_by: 'day',
    model_types: [],
    compare_previous_period: false
  });

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        group_by: filters.group_by
      };

      if (filters.start_date) payload.start_date = filters.start_date;
      if (filters.end_date) payload.end_date = filters.end_date;
      if (filters.model_types.length > 0) payload.model_types = filters.model_types;
      if (filters.compare_previous_period) payload.compare_previous_period = true;

      const response = await api.post('/analytics/dashboard', payload);
      setDashboardData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Analytics Dashboard
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>Filters</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Group By</InputLabel>
              <Select
                value={filters.group_by}
                label="Group By"
                onChange={(e) => handleFilterChange('group_by', e.target.value)}
              >
                <MenuItem value="day">Day</MenuItem>
                <MenuItem value="week">Week</MenuItem>
                <MenuItem value="month">Month</MenuItem>
                <MenuItem value="quarter">Quarter</MenuItem>
                <MenuItem value="year">Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={loadDashboard}
              disabled={loading}
              sx={{ height: '56px' }}
            >
              {loading ? <CircularProgress size={24} /> : 'Apply Filters'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      )}

      {dashboardData && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Assessment color="primary" sx={{ mr: 1 }} />
                    <Typography color="textSecondary" variant="caption">
                      Total Predictions
                    </Typography>
                  </Box>
                  <Typography variant="h4">
                    {dashboardData.summary.total_predictions}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Timeline color="success" sx={{ mr: 1 }} />
                    <Typography color="textSecondary" variant="caption">
                      Total Decisions
                    </Typography>
                  </Box>
                  <Typography variant="h4">
                    {dashboardData.summary.total_decisions}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <TrendingUp color="warning" sx={{ mr: 1 }} />
                    <Typography color="textSecondary" variant="caption">
                      Approved Decisions
                    </Typography>
                  </Box>
                  <Typography variant="h4">
                    {dashboardData.summary.approved_decisions}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <BarChart color="info" sx={{ mr: 1 }} />
                    <Typography color="textSecondary" variant="caption">
                      Avg Confidence
                    </Typography>
                  </Box>
                  <Typography variant="h4">
                    {(dashboardData.summary.average_confidence * 100).toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Date Range Info */}
          <Paper sx={{ p: 2, mt: 3 }}>
            <Typography variant="body2" color="textSecondary">
              <strong>Date Range:</strong> {dashboardData.summary.date_range}
            </Typography>
            {dashboardData.filters_applied.model_types && dashboardData.filters_applied.model_types.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="textSecondary" component="span">
                  <strong>Model Types:</strong>{' '}
                </Typography>
                {dashboardData.filters_applied.model_types.map((type) => (
                  <Chip key={type} label={type} size="small" sx={{ ml: 0.5 }} />
                ))}
              </Box>
            )}
          </Paper>

          {/* Grouped Data */}
          {dashboardData.grouped_data && dashboardData.grouped_data.length > 0 && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Trends Over Time (Grouped by {filters.group_by})
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {dashboardData.grouped_data.map((period, idx) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          {period.period}
                        </Typography>
                        <Typography variant="body2">
                          Predictions: <strong>{period.predictions}</strong>
                        </Typography>
                        <Typography variant="body2">
                          Decisions: <strong>{period.decisions}</strong>
                        </Typography>
                        <Typography variant="body2">
                          Confidence: <strong>{(period.avg_confidence * 100).toFixed(0)}%</strong>
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* Comparison */}
          {dashboardData.comparison && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Period Comparison
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" variant="caption">
                        Predictions Change
                      </Typography>
                      <Typography variant="h5" color={dashboardData.comparison.predictions_change > 0 ? 'success.main' : 'error.main'}>
                        {dashboardData.comparison.predictions_change > 0 ? '+' : ''}{dashboardData.comparison.predictions_change.toFixed(1)}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" variant="caption">
                        Decisions Change
                      </Typography>
                      <Typography variant="h5" color={dashboardData.comparison.decisions_change > 0 ? 'success.main' : 'error.main'}>
                        {dashboardData.comparison.decisions_change > 0 ? '+' : ''}{dashboardData.comparison.decisions_change.toFixed(1)}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" variant="caption">
                        Confidence Change
                      </Typography>
                      <Typography variant="h5" color={dashboardData.comparison.confidence_change > 0 ? 'success.main' : 'error.main'}>
                        {dashboardData.comparison.confidence_change > 0 ? '+' : ''}{dashboardData.comparison.confidence_change.toFixed(1)}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          )}
        </>
      )}
    </Container>
  );
};

export default Analytics;
