import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const Decisions = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Decision Support
      </Typography>
      <Box sx={{ mt: 3 }}>
        <Typography variant="body1" color="textSecondary">
          AI-powered decision recommendations coming soon...
        </Typography>
      </Box>
    </Container>
  );
};

export default Decisions;
