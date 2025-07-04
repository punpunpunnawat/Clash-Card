import { configureStore } from "@reduxjs/toolkit";
import playerReducer from "./slices/playerSlice";
import deckReducer from "./slices/deckSlice";
import soundReducer from "./slices/soundSlice";

export const store = configureStore({
  reducer: {
    player: playerReducer,
    deck: deckReducer,
    sound: soundReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
