import { configureStore } from "@reduxjs/toolkit";
import { codebaseApi } from "../services/api";

export const store = configureStore({
  reducer: {
    [codebaseApi.reducerPath]: codebaseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(codebaseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
