import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const generateSalesForecast = createAsyncThunk(
  'predictions/generateSalesForecast',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.post('/predictions/sales-forecast', params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchPredictionHistory = createAsyncThunk(
  'predictions/fetchHistory',
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get('/predictions/history', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const predictionsSlice = createSlice({
  name: 'predictions',
  initialState: {
    forecasts: [],
    history: [],
    loading: false,
    error: null,
    currentPrediction: null,
  },
  reducers: {
    clearPredictions: (state) => {
      state.forecasts = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate forecast
      .addCase(generateSalesForecast.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateSalesForecast.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPrediction = action.payload;
        state.forecasts.unshift(action.payload);
      })
      .addCase(generateSalesForecast.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch history
      .addCase(fetchPredictionHistory.fulfilled, (state, action) => {
        state.history = action.payload.predictions;
      });
  },
});

export const { clearPredictions } = predictionsSlice.actions;
export default predictionsSlice.reducer;
