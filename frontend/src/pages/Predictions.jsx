import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { TrendingUp, AttachMoney, Warning } from '@mui/icons-material';
import api from '../services/api';

const Predictions = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Churn Prediction State
  const [churnData, setChurnData] = useState({
    customer_id: '',
    tenure_months: '',
    contract_value: '',
    support_tickets: '',
    product_usage_score: ''
  });

  // Price Optimization State
  const [priceData, setPriceData] = useState({
    product_id: '',
    current_price: '',
    cost_per_unit: '',
    competitor_avg_price: '',
    demand_elasticity: ''
  });

  // Risk Assessment State
  const [riskData, setRiskData] = useState({
    entity_id: '',
    entity_type: 'project',
    financial_risk: '',
    operational_risk: '',
    compliance_risk: '',
    market_risk: ''
  });

  const handleChurnSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post('/predictions/churn', {
        customer_id: churnData.customer_id,
        tenure_months: parseInt(churnData.tenure_months),
        contract_value: parseFloat(churnData.contract_value),
        support_tickets: parseInt(churnData.support_tickets),
        product_usage_score: parseFloat(churnData.product_usage_score)
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get prediction');
    } finally {
      setLoading(false);
    }
  };

  const handlePriceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post('/predictions/price-optimization', {
        product_id: priceData.product_id,
        current_price: parseFloat(priceData.current_price),
        cost_per_unit: parseFloat(priceData.cost_per_unit),
        competitor_avg_price: parseFloat(priceData.competitor_avg_price),
        demand_elasticity: parseFloat(priceData.demand_elasticity)
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get prediction');
    } finally {
      setLoading(false);
    }
  };

  const handleRiskSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post('/predictions/risk-assessment', {
        entity_id: riskData.entity_id,
        entity_type: riskData.entity_type,
        financial_risk: riskData.financial_risk ? parseFloat(riskData.financial_risk) : null,
        operational_risk: riskData.operational_risk ? parseFloat(riskData.operational_risk) : null,
        compliance_risk: riskData.compliance_risk ? parseFloat(riskData.compliance_risk) : null,
        market_risk: riskData.market_risk ? parseFloat(riskData.market_risk) : null
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get prediction');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      case 'CRITICAL': return 'error';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        ML Predictions
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => { setActiveTab(v); setResult(null); setError(null); }}>
          <Tab icon={<TrendingUp />} label="Churn Prediction" />
          <Tab icon={<AttachMoney />} label="Price Optimization" />
          <Tab icon={<Warning />} label="Risk Assessment" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Churn Prediction Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Customer Churn Analysis</Typography>
                  <form onSubmit={handleChurnSubmit}>
                    <TextField
                      fullWidth
                      label="Customer ID"
                      value={churnData.customer_id}
                      onChange={(e) => setChurnData({ ...churnData, customer_id: e.target.value })}
                      margin="normal"
                      required
                    />
                    <TextField
                      fullWidth
                      label="Tenure (months)"
                      type="number"
                      value={churnData.tenure_months}
                      onChange={(e) => setChurnData({ ...churnData, tenure_months: e.target.value })}
                      margin="normal"
                      required
                    />
                    <TextField
                      fullWidth
                      label="Contract Value ($)"
                      type="number"
                      value={churnData.contract_value}
                      onChange={(e) => setChurnData({ ...churnData, contract_value: e.target.value })}
                      margin="normal"
                      required
                    />
                    <TextField
                      fullWidth
                      label="Support Tickets"
                      type="number"
                      value={churnData.support_tickets}
                      onChange={(e) => setChurnData({ ...churnData, support_tickets: e.target.value })}
                      margin="normal"
                      required
                    />
                    <TextField
                      fullWidth
                      label="Product Usage Score (0-100)"
                      type="number"
                      value={churnData.product_usage_score}
                      onChange={(e) => setChurnData({ ...churnData, product_usage_score: e.target.value })}
                      margin="normal"
                      required
                      inputProps={{ min: 0, max: 100 }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      sx={{ mt: 2 }}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Analyze Churn Risk'}
                    </Button>
                  </form>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {result && (
                  <Paper elevation={2} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Prediction Results</Typography>
                    <Card sx={{ mt: 2, bgcolor: result.risk_level === 'HIGH' ? '#ffebee' : '#e8f5e9' }}>
                      <CardContent>
                        <Typography variant="h4" align="center">
                          {(result.churn_probability * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" align="center" color="textSecondary">
                          Churn Probability
                        </Typography>
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                          <Chip
                            label={result.risk_level}
                            color={getRiskColor(result.risk_level)}
                            size="large"
                          />
                        </Box>
                      </CardContent>
                    </Card>

                    <Typography variant="subtitle1" sx={{ mt: 3, fontWeight: 'bold' }}>
                      Risk Factors:
                    </Typography>
                    <List dense>
                      {result.risk_factors.map((factor, idx) => (
                        <ListItem key={idx}>
                          <ListItemText primary={`• ${factor}`} />
                        </ListItem>
                      ))}
                    </List>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle1" fontWeight="bold">
                      Recommendation:
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {result.recommendation}
                    </Typography>

                    <Typography variant="caption" display="block" sx={{ mt: 2 }} color="textSecondary">
                      Confidence: {(result.confidence * 100).toFixed(0)}% | ID: {result.prediction_id}
                    </Typography>
                  </Paper>
                )}
              </Grid>
            </Grid>
          )}

          {/* Price Optimization Tab */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Dynamic Pricing</Typography>
                  <form onSubmit={handlePriceSubmit}>
                    <TextField
                      fullWidth
                      label="Product ID"
                      value={priceData.product_id}
                      onChange={(e) => setPriceData({ ...priceData, product_id: e.target.value })}
                      margin="normal"
                      required
                    />
                    <TextField
                      fullWidth
                      label="Current Price ($)"
                      type="number"
                      value={priceData.current_price}
                      onChange={(e) => setPriceData({ ...priceData, current_price: e.target.value })}
                      margin="normal"
                      required
                      inputProps={{ step: 0.01 }}
                    />
                    <TextField
                      fullWidth
                      label="Cost per Unit ($)"
                      type="number"
                      value={priceData.cost_per_unit}
                      onChange={(e) => setPriceData({ ...priceData, cost_per_unit: e.target.value })}
                      margin="normal"
                      required
                      inputProps={{ step: 0.01 }}
                    />
                    <TextField
                      fullWidth
                      label="Competitor Average Price ($)"
                      type="number"
                      value={priceData.competitor_avg_price}
                      onChange={(e) => setPriceData({ ...priceData, competitor_avg_price: e.target.value })}
                      margin="normal"
                      required
                      inputProps={{ step: 0.01 }}
                    />
                    <TextField
                      fullWidth
                      label="Demand Elasticity"
                      type="number"
                      value={priceData.demand_elasticity}
                      onChange={(e) => setPriceData({ ...priceData, demand_elasticity: e.target.value })}
                      margin="normal"
                      required
                      inputProps={{ step: 0.1 }}
                      helperText="e.g., 1.5 for elastic, 0.5 for inelastic"
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      sx={{ mt: 2 }}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Optimize Price'}
                    </Button>
                  </form>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {result && (
                  <Paper elevation={2} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Optimization Results</Typography>
                    
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                      <Grid item xs={6}>
                        <Card>
                          <CardContent>
                            <Typography color="textSecondary" variant="caption">
                              Current Price
                            </Typography>
                            <Typography variant="h5">
                              ${result.current_price.toFixed(2)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6}>
                        <Card sx={{ bgcolor: '#e3f2fd' }}>
                          <CardContent>
                            <Typography color="textSecondary" variant="caption">
                              Optimal Price
                            </Typography>
                            <Typography variant="h5" color="primary">
                              ${result.optimal_price.toFixed(2)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 3 }}>
                      <Chip
                        label={result.strategy.replace(/_/g, ' ')}
                        color="primary"
                        sx={{ mb: 2 }}
                      />
                      <Typography variant="body2" paragraph>
                        {result.reasoning}
                      </Typography>

                      <Divider sx={{ my: 2 }} />

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">
                            Price Change
                          </Typography>
                          <Typography variant="h6" color={result.price_change < 0 ? 'success.main' : 'error.main'}>
                            {result.price_change > 0 ? '+' : ''}${result.price_change.toFixed(2)} 
                            ({result.price_change_percent > 0 ? '+' : ''}{result.price_change_percent.toFixed(1)}%)
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">
                            Revenue Impact
                          </Typography>
                          <Typography variant="h6" color={result.estimated_revenue_impact > 0 ? 'success.main' : 'error.main'}>
                            {result.estimated_revenue_impact > 0 ? '+' : ''}{result.estimated_revenue_impact.toFixed(1)}%
                          </Typography>
                        </Grid>
                      </Grid>

                      <Typography variant="caption" display="block" sx={{ mt: 2 }} color="textSecondary">
                        Confidence: {(result.confidence * 100).toFixed(0)}% | ID: {result.prediction_id}
                      </Typography>
                    </Box>
                  </Paper>
                )}
              </Grid>
            </Grid>
          )}

          {/* Risk Assessment Tab */}
          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Multi-Dimensional Risk Analysis</Typography>
                  <form onSubmit={handleRiskSubmit}>
                    <TextField
                      fullWidth
                      label="Entity ID"
                      value={riskData.entity_id}
                      onChange={(e) => setRiskData({ ...riskData, entity_id: e.target.value })}
                      margin="normal"
                      required
                    />
                    <TextField
                      fullWidth
                      select
                      label="Entity Type"
                      value={riskData.entity_type}
                      onChange={(e) => setRiskData({ ...riskData, entity_type: e.target.value })}
                      margin="normal"
                      SelectProps={{ native: true }}
                    >
                      <option value="project">Project</option>
                      <option value="customer">Customer</option>
                      <option value="transaction">Transaction</option>
                      <option value="investment">Investment</option>
                    </TextField>
                    <TextField
                      fullWidth
                      label="Financial Risk (0-100)"
                      type="number"
                      value={riskData.financial_risk}
                      onChange={(e) => setRiskData({ ...riskData, financial_risk: e.target.value })}
                      margin="normal"
                      inputProps={{ min: 0, max: 100, step: 1 }}
                    />
                    <TextField
                      fullWidth
                      label="Operational Risk (0-100)"
                      type="number"
                      value={riskData.operational_risk}
                      onChange={(e) => setRiskData({ ...riskData, operational_risk: e.target.value })}
                      margin="normal"
                      inputProps={{ min: 0, max: 100, step: 1 }}
                    />
                    <TextField
                      fullWidth
                      label="Compliance Risk (0-100)"
                      type="number"
                      value={riskData.compliance_risk}
                      onChange={(e) => setRiskData({ ...riskData, compliance_risk: e.target.value })}
                      margin="normal"
                      inputProps={{ min: 0, max: 100, step: 1 }}
                    />
                    <TextField
                      fullWidth
                      label="Market Risk (0-100)"
                      type="number"
                      value={riskData.market_risk}
                      onChange={(e) => setRiskData({ ...riskData, market_risk: e.target.value })}
                      margin="normal"
                      inputProps={{ min: 0, max: 100, step: 1 }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      sx={{ mt: 2 }}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Assess Risk'}
                    </Button>
                  </form>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {result && (
                  <Paper elevation={2} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Risk Assessment Results</Typography>
                    
                    <Card sx={{ mt: 2, bgcolor: result.color_code === 'red' ? '#ffebee' : result.color_code === 'orange' ? '#fff3e0' : result.color_code === 'yellow' ? '#fffde7' : '#e8f5e9' }}>
                      <CardContent>
                        <Typography variant="h3" align="center">
                          {result.overall_risk_score.toFixed(1)}
                        </Typography>
                        <Typography variant="body2" align="center" color="textSecondary">
                          Overall Risk Score
                        </Typography>
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                          <Chip
                            label={result.risk_level}
                            color={getRiskColor(result.risk_level)}
                            size="large"
                          />
                          <Chip
                            label={result.priority}
                            color="secondary"
                            size="large"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      </CardContent>
                    </Card>

                    <Typography variant="subtitle1" sx={{ mt: 3, fontWeight: 'bold' }}>
                      Risk Breakdown:
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {Object.entries(result.risk_breakdown).map(([key, value]) => (
                        value > 0 && (
                          <Grid item xs={6} key={key}>
                            <Card variant="outlined">
                              <CardContent>
                                <Typography variant="caption" color="textSecondary">
                                  {key.charAt(0).toUpperCase() + key.slice(1)}
                                </Typography>
                                <Typography variant="h6">
                                  {value.toFixed(0)}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        )
                      ))}
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle1" fontWeight="bold">
                      Mitigation Strategies:
                    </Typography>
                    <List dense>
                      {result.mitigation_strategies.map((strategy, idx) => (
                        <ListItem key={idx}>
                          <ListItemText primary={`${idx + 1}. ${strategy}`} />
                        </ListItem>
                      ))}
                    </List>

                    <Typography variant="caption" display="block" sx={{ mt: 2 }} color="textSecondary">
                      Confidence: {(result.confidence * 100).toFixed(0)}% | ID: {result.prediction_id}
                    </Typography>
                  </Paper>
                )}
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Predictions;
