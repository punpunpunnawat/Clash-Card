import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

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
});

export const { setDeck, clearDeck } = deckSlice.actions;
export default deckSlice.reducer;
