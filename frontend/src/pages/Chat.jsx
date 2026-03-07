import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const Chat = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        AI Assistant
      </Typography>
      <Box sx={{ mt: 3 }}>
        <Typography variant="body1" color="textSecondary">
          Conversational AI interface coming soon...
        </Typography>
      </Box>
    </Container>
  );
};

export default Chat;
