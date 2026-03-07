import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const Predictions = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Predictions
      </Typography>
      <Box sx={{ mt: 3 }}>
        <Typography variant="body1" color="textSecondary">
          ML-powered predictions and forecasting features coming soon...
        </Typography>
      </Box>
    </Container>
  );
};

export default Predictions;
