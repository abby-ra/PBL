import React, { useState, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  Avatar,
  CircularProgress,
  IconButton,
  Chip,
  Alert
} from '@mui/material';
import { Send, AttachFile, Person, SmartToy } from '@mui/icons-material';
import api from '../services/api';

const Chat = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you with predictions, analytics, and decision support. You can also upload files (CSV, JSON, TXT) for analysis.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(scrollToBottom, [messages]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file type
      const allowedTypes = ['text/plain', 'text/csv', 'application/json'];
      const allowedExtensions = ['.txt', '.csv', '.json'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please upload a CSV, JSON, or TXT file');
        setSelectedFile(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() && !selectedFile) return;

    const userMessage = {
      role: 'user',
      content: input || `[Uploaded file: ${selectedFile.name}]`,
      timestamp: new Date(),
      file: selectedFile?.name
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      let response;

      if (selectedFile) {
        // Upload file with message
        const formData = new FormData();
        formData.append('message', input || 'Please analyze this file');
        formData.append('file', selectedFile);

        response = await api.post('/nlp/chat-upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Text-only message
        response = await api.post('/nlp/chat', {
          message: input,
          conversation_id: null
        });
      }

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
        fileProcessed: response.data.file_processed
      };

      setMessages(prev => [...prev, assistantMessage]);
      setSelectedFile(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom>
        AI Assistant
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Chat Messages */}
      <Paper
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          mb: 2,
          bgcolor: '#f5f5f5'
        }}
      >
        <List>
          {messages.map((msg, idx) => (
            <ListItem
              key={idx}
              sx={{
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                mb: 2
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  maxWidth: '70%',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: msg.role === 'user' ? 'primary.main' : 'secondary.main',
                    mx: 1
                  }}
                >
                  {msg.role === 'user' ? <Person /> : <SmartToy />}
                </Avatar>
                <Box>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      bgcolor: msg.role === 'user' ? 'primary.light' : 'white',
                      color: msg.role === 'user' ? 'white' : 'text.primary'
                    }}
                  >
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </Typography>
                    {msg.file && (
                      <Chip
                        label={msg.file}
                        size="small"
                        icon={<AttachFile />}
                        sx={{ mt: 1 }}
                      />
                    )}
                    {msg.fileProcessed && (
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={`${msg.fileProcessed.filename} (${(msg.fileProcessed.size_bytes / 1024).toFixed(1)} KB)`}
                          size="small"
                          color="success"
                        />
                      </Box>
                    )}
                  </Paper>
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                    {msg.timestamp.toLocaleTimeString()}
                  </Typography>
                </Box>
              </Box>
            </ListItem>
          ))}
          {loading && (
            <ListItem sx={{ justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </ListItem>
          )}
          <div ref={messagesEndRef} />
        </List>
      </Paper>

      {/* Input Area */}
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.csv,.json"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <IconButton
          color="primary"
          onClick={() => fileInputRef.current?.click()}
        >
          <AttachFile />
        </IconButton>

        <Box sx={{ flex: 1 }}>
          {selectedFile && (
            <Box sx={{ mb: 1 }}>
              <Chip
                label={selectedFile.name}
                onDelete={handleRemoveFile}
                color="primary"
                size="small"
                icon={<AttachFile />}
              />
            </Box>
          )}
          <TextField
            fullWidth
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            variant="outlined"
            size="small"
          />
        </Box>

        <Button
          type="submit"
          variant="contained"
          endIcon={<Send />}
          disabled={loading || (!input.trim() && !selectedFile)}
        >
          Send
        </Button>
      </Paper>
    </Container>
  );
};

export default Chat;
