import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cvsReducer from './slices/cvsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cvs: cvsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
