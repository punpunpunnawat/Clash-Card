import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";

type CardType = "rock" | "paper" | "scissors";

interface DeckCard {
  cardType: CardType;
}

interface DeckState {
  deck: DeckCard[];
}

const initialState: DeckState = {
  deck: [],
};

export const fetchDeck = createAsyncThunk(
  "deck/fetchDeck",
  async () => {
    const token = localStorage.getItem("authToken");
    console.log(token)
    if (!token) {
      throw new Error("No auth token");
    }

    const res = await fetch("http://localhost:8080/api/deck", {
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

const deckSlice = createSlice({
  name: "deck",
  initialState,
  reducers: {
    setDeck(state, action: PayloadAction<DeckCard[]>) {
      state.deck = action.payload;
    },
    clearDeck(state) {
      state.deck = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchDeck.fulfilled, (state, action) => {
      state.deck = action.payload;
    });
  },
});

export const { setDeck, clearDeck } = deckSlice.actions;
export default deckSlice.reducer;
