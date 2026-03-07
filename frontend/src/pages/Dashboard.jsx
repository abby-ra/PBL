import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Grid, Card, CardContent, Typography, Box, CircularProgress, Container } from '@mui/material';
import { TrendingUp, TrendingDown, People, AttachMoney } from '@mui/icons-material';
import { fetchDashboardMetrics } from '../store/slices/dashboardSlice';

const MetricCard = ({ title, value, change, trend, icon: Icon, color }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ my: 2 }}>
            {value}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {trend === 'up' ? (
              <TrendingUp color="success" />
            ) : (
              <TrendingDown color="error" />
            )}
            <Typography
              variant="body2"
              color={trend === 'up' ? 'success.main' : 'error.main'}
              sx={{ ml: 0.5 }}
            >
              {change > 0 ? '+' : ''}{change}%
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            backgroundColor: color + '20',
            borderRadius: 2,
            p: 1.5,
          }}
        >
          <Icon sx={{ fontSize: 32, color }} />
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const { metrics, loading } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardMetrics({}));
  }, [dispatch]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Revenue"
            value={`$${(metrics?.metrics?.total_revenue?.value || 0).toLocaleString()}`}
            change={metrics?.metrics?.total_revenue?.change_percent || 0}
            trend={metrics?.metrics?.total_revenue?.trend || 'up'}
            icon={AttachMoney}
            color="#1976d2"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Sales Count"
            value={(metrics?.metrics?.sales_count?.value || 0).toLocaleString()}
            change={metrics?.metrics?.sales_count?.change_percent || 0}
            trend={metrics?.metrics?.sales_count?.trend || 'up'}
            icon={TrendingUp}
            color="#2e7d32"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Customer Satisfaction"
            value={`${metrics?.metrics?.customer_satisfaction?.value || 0}/5`}
            change={metrics?.metrics?.customer_satisfaction?.change_percent || 0}
            trend={metrics?.metrics?.customer_satisfaction?.trend || 'up'}
            icon={People}
            color="#ed6c02"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Users"
            value={(metrics?.metrics?.active_users?.value || 0).toLocaleString()}
            change={metrics?.metrics?.active_users?.change_percent || 0}
            trend={metrics?.metrics?.active_users?.trend || 'down'}
            icon={People}
            color="#9c27b0"
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
