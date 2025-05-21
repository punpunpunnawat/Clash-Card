// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import playerReducer from './slices/playerSlice';
import gameReducer from './slices/gameSlice';
import deckReducer from "./slices/deckSlice";

export const store = configureStore({
  reducer: {
    player: playerReducer,
    game: gameReducer,
    deck: deckReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
