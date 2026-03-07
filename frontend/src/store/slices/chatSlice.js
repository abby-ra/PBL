import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const sendChatMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ message, conversationId }, { rejectWithValue }) => {
    try {
      const response = await api.post('/nlp/chat', {
        message,
        conversation_id: conversationId,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [],
    conversationId: null,
    loading: false,
    error: null,
    typing: false,
  },
  reducers: {
    clearChat: (state) => {
      state.messages = [];
      state.conversationId = null;
      state.error = null;
    },
    setTyping: (state, action) => {
      state.typing = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state) => {
        state.loading = true;
        state.typing = true;
        state.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.typing = false;
        state.conversationId = action.payload.conversation_id;
        
        // Add user message and AI response
        state.messages.push({
          id: action.payload.message_id,
          type: 'ai',
          content: action.payload.response.text,
          data: action.payload.response.data,
          suggestions: action.payload.suggestions,
          timestamp: new Date().toISOString(),
        });
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.loading = false;
        state.typing = false;
        state.error = action.payload;
      });
  },
});

export const { clearChat, setTyping } = chatSlice.actions;
export default chatSlice.reducer;
