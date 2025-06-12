import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UnitStat } from "../../types/UnitStat";

export interface Player {
  id: string;
  username: string;
  email: string;
  stat: UnitStat;
  level: number;
  currentCampaignLevel: number;
  exp: number;
  gold: number;
  createdAt: string;
  class: "none"|"warrior"|"mage"|"assassin";
  statPoint : number;
}

const initialState: Player = {
  id: "0",
  username: "",
  email: "",
  stat: {
    atk: 0,
    def: 0,
    spd: 0,
    hp: 0,
  },
  level: 1,
  currentCampaignLevel: 1,
  exp: 0,
  gold: 0,
  createdAt: "",
  class: "none",
  statPoint: 0,
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
      return action.payload; 
    },
    clearPlayer() {
      return initialState; 
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchPlayer.fulfilled, (state, action) => {
      return action.payload; 
    });
  },
});


export const { setPlayer, clearPlayer } = playerSlice.actions;

export default playerSlice.reducer;
