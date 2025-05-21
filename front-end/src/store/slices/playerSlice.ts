import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UnitStat } from "../../types/UnitStat";

export interface Player {
  id: number;
  username: string;
  email: string;
  stat: UnitStat;
  level: number;
  currentLevel: number;
  exp: number;
  money: number;
  createdAt: string;
}



interface PlayerState {
  player: Player | null;
}

const initialState: PlayerState = {
  player: null,
};

const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    setPlayer(state, action: PayloadAction<Player>) {
      console.log(action);
      state.player = action.payload;
      console.log("Updated player state:", state.player);
    },
    clearPlayer(state) {
      state.player = null;
    },
  },
});

export const { setPlayer, clearPlayer } = playerSlice.actions;

export default playerSlice.reducer;
