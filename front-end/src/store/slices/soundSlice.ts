import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface SoundState {
  isMuted: boolean;
  volume: number; // 0.0 to 1.0
}

const initialState: SoundState = {
  isMuted: false,
  volume: 1.0,
};

const soundSlice = createSlice({
  name: 'sound',
  initialState,
  reducers: {
    toggleMute(state) {
      state.isMuted = !state.isMuted;
    },
    setVolume(state, action: PayloadAction<number>) {
      state.volume = action.payload;
    },
  },
});

export const { toggleMute, setVolume } = soundSlice.actions;
export default soundSlice.reducer;
