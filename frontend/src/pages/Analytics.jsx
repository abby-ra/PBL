import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const Analytics = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Analytics
      </Typography>
      <Box sx={{ mt: 3 }}>
        <Typography variant="body1" color="textSecondary">
          Advanced analytics and reporting features coming soon...
        </Typography>
      </Box>
    </Container>
  );
};

export default Analytics;
