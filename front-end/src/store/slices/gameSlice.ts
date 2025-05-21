// src/store/slices/gameSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface GameState {
  turn: 'player' | 'bot';
  winner: 'player' | 'bot' | 'draw' | null;
  result: string;
}

const initialState: GameState = {
  turn: 'player',
  winner: null,
  result: '',
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setTurn(state, action: PayloadAction<'player' | 'bot'>) {
      state.turn = action.payload;
    },
    setWinner(state, action: PayloadAction<'player' | 'bot' | 'draw' | null>) {
      state.winner = action.payload;
    },
    setResult(state, action: PayloadAction<string>) {
      state.result = action.payload;
    },
  },
});

export const { setTurn, setWinner, setResult } = gameSlice.actions;
export default gameSlice.reducer;
