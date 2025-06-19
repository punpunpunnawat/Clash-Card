// managers/soundManager.ts
import { Howl } from 'howler';

// BGM
const bgmTracks = {
  menu: new Howl({ src: ['/sounds/bgm/menu.mp3'], loop: true, volume: 0.5 }),
  battle: new Howl({ src: ['/sounds/bgm/battle.mp3'], loop: true, volume: 0.5 }),
};

let currentBGM: Howl | null = null;
let currentTrackName: keyof typeof bgmTracks | null = null;

// จะเล่นเพลงใหม่ ก็ต่อเมื่อชื่อเพลงไม่ตรงกับอันที่เล่นอยู่
export const playBGM = (name: keyof typeof bgmTracks) => {
  if (currentTrackName === name) return; // ถ้าเล่นเพลงเดิมอยู่ ไม่ทำอะไร

  if (currentBGM) {
    currentBGM.stop();
  }

  currentBGM = bgmTracks[name];
  currentTrackName = name;
  currentBGM.play();
};

// ใช้ตอนออกจาก PvP → กลับไปเริ่มเพลงเมนูใหม่
export const restartMenuBGM = () => {
  if (currentBGM) {
    currentBGM.stop();
  }

  currentBGM = bgmTracks.menu;
  currentTrackName = 'menu';
  currentBGM.play();
};

export const stopBGM = () => {
  if (currentBGM) {
    currentBGM.stop();
    currentTrackName = null;
    currentBGM = null;
  }
};

// SFX
export const sfx = {
  win: new Howl({ src: ['/sounds/sfx/win.mp3'], volume: 1 }),
  lose: new Howl({ src: ['/sounds/sfx/lose.mp3'], volume: 1 }),
  card: new Howl({ src: ['/sounds/sfx/card.mp3'], volume: 1 }),
  levelUp: new Howl({ src: ['/sounds/sfx/level-up.mp3'], volume: 1 }),
  hit: new Howl({ src: ['/sounds/sfx/hit.mp3'], volume: 1 }),
  evade: new Howl({ src: ['/sounds/sfx/evade.mp3'], volume: 1 }),
};

// Global mute/volume
export const setGlobalMute = (mute: boolean) => {
  Object.values(bgmTracks).forEach(bgm => bgm.mute(mute));
  Object.values(sfx).forEach(sound => sound.mute(mute));
};

export const setGlobalVolume = (volume: number) => {
  Object.values(bgmTracks).forEach(bgm => bgm.volume(volume));
  Object.values(sfx).forEach(sound => sound.volume(volume));
};
