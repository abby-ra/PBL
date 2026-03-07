import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const Settings = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Box sx={{ mt: 3 }}>
        <Typography variant="body1" color="textSecondary">
          User settings and preferences coming soon...
        </Typography>
      </Box>
    </Container>
  );
};

export default Settings;
