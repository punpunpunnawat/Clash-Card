import {
	createSlice,
	createAsyncThunk,
	type PayloadAction,
} from "@reduxjs/toolkit";
export interface DeckCard {
	rock: number;
	paper: number;
	scissors: number;
}

interface DeckState {
	rock: number;
	paper: number;
	scissors: number;
}

const initialState: DeckState = {
	rock: 0,
	paper: 0,
	scissors: 0,
};

export const fetchDeck = createAsyncThunk("deck/fetchDeck", async () => {
	const token = localStorage.getItem("authToken");
	if (!token) throw new Error("No auth token");

	const res = await fetch("http://localhost:8080/api/deck", {
		headers: { Authorization: `Bearer ${token}` },
	});

	if (!res.ok) throw new Error("Failed to fetch user data");

	console.log(res);
	// สมมติ backend ส่งมาแบบ array [{card_type:"rock", quantity:10},...]
	const data: { card_type: keyof DeckCard; quantity: number }[] =
		await res.json();

	console.log("Backend response data:", data); // เพิ่มบรรทัดนี้ดูข้อมูลดิบก่อนแปลง

	const deckObj: DeckCard = { rock: 0, paper: 0, scissors: 0 };
	data.forEach((c) => {
		deckObj[c.card_type] = c.quantity;
	});

	console.log("Converted deck object:", deckObj); // ดูข้อมูลหลังแปลง

	return deckObj;
});

const deckSlice = createSlice({
	name: "deck",
	initialState,
	reducers: {
		setDeck(state, action: PayloadAction<DeckCard>) {
			state.rock = action.payload.rock;
			state.paper = action.payload.paper;
			state.scissors = action.payload.scissors;
		},
		clearDeck(state) {
			state.rock = 0;
			state.paper = 0;
			state.scissors = 0;
		},
	},
	extraReducers: (builder) => {
		builder.addCase(fetchDeck.fulfilled, (state, action) => {
			state.rock = action.payload.rock;
			state.paper = action.payload.paper;
			state.scissors = action.payload.scissors;
		});
	},
});

export const { setDeck, clearDeck } = deckSlice.actions;
export default deckSlice.reducer;
