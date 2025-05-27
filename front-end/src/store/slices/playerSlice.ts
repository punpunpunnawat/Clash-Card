import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UnitStat } from "../../types/UnitStat";

export interface Player {
  id: number;
  username: string;
  email: string;
  stat: UnitStat;
  level: number;
  currentCampaignLevel: number;
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

export const fetchPlayer = createAsyncThunk(
  "player/fetchPlayer",
  async () => {
    const token = localStorage.getItem("authToken");
    console.log(token)
    if (!token) {
      throw new Error("No auth token");
    }

    const res = await fetch("http://localhost:8080/api/user", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch user data");
    }

    return await res.json();
  }
);


const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    setPlayer(state, action: PayloadAction<Player>) {
      state.player = action.payload;
    },
    clearPlayer(state) {
      state.player = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchPlayer.fulfilled, (state, action) => {
      state.player = action.payload;
    });
  },
});


export const { setPlayer, clearPlayer } = playerSlice.actions;

export default playerSlice.reducer;
