import React, { useState, useEffect } from "react";
import Deck from "./components/Deck";
import type { CardProps } from "./types/Card";
import type { CharacterStatsProps } from "./types/Character";
import HealthBar from "./components/HealthBar";

const Player: CharacterStatsProps = {
  atk: 10,
  def: 5,
  hp: 50,
  spd: 10,
};

const EnemyBot: CharacterStatsProps = {
  atk: 5,
  def: 2,
  hp: 40,
  spd: 10,
};

const allCards: CardProps[] = [
  { id: 1, type: "rock", name: "Rock", emoji: "✊" },
  { id: 2, type: "paper", name: "Paper", emoji: "✋" },
  { id: 3, type: "scissors", name: "Scissors", emoji: "✌️" },
];

const generateMainDeckPool = (): CardProps[] => {
  const pool: CardProps[] = [];
  let id = 1;
  for (let i = 0; i < 5; i++) {
    for (const card of allCards) {
      pool.push({ ...card, id: id++ });
    }
  }
  return pool;
};

const drawToFive = (
  hand: CardProps[],
  pool: CardProps[]
): [CardProps[], CardProps[]] => {
  const newHand = [...hand];
  const newPool = [...pool];

  while (newHand.length < 5 && newPool.length > 0) {
    const index = Math.floor(Math.random() * newPool.length);
    newHand.push(newPool.splice(index, 1)[0]);
  }

  return [newHand, newPool];
};

const App: React.FC = () => {
  const [mainDeckPool, setMainDeckPool] = useState<CardProps[]>(generateMainDeckPool());
  const [hand, setHand] = useState<CardProps[]>([]);
  const [botCard, setBotCard] = useState<CardProps | null>(null);
  const [result, setResult] = useState<string>("");

  // สร้าง state เก็บ HP ปัจจุบัน
  const [playerHP, setPlayerHP] = useState<number>(Player.hp);
  const [botHP, setBotHP] = useState<number>(EnemyBot.hp);

  useEffect(() => {
    const [initialHand, updatedPool] = drawToFive([], mainDeckPool);
    setHand(initialHand);
    setMainDeckPool(updatedPool);
  }, []);

  const botPlay = (): CardProps => {
    const choice = allCards[Math.floor(Math.random() * allCards.length)];
    return { ...choice };
  };

  // ฟังก์ชันคำนวณดาเมจ
  function calculateDamage(attacker: CharacterStatsProps, defender: CharacterStatsProps): number {
    const rawDamage = attacker.atk - defender.def;
    return rawDamage > 0 ? rawDamage : 1;
  }

  // เช็กผลแพ้ชนะ
  const checkWinner = (player: CardProps, bot: CardProps): string => {
    if (player.name === bot.name) return "Draw";
    if (
      (player.name === "Rock" && bot.name === "Scissors") ||
      (player.name === "Paper" && bot.name === "Rock") ||
      (player.name === "Scissors" && bot.name === "Paper")
    ) {
      return "You Win!";
    }
    return "You Lose!";
  };

  // เมื่อผู้เล่นเลือกการ์ด
  const onSelectCard = (card: CardProps) => {
    if (playerHP <= 0 || botHP <= 0) return; // หยุดเล่นถ้าฝ่ายใด HP หมด

    const bot = botPlay();
    setBotCard(bot);

    const winner = checkWinner(card, bot);
    setResult(winner);

    // อัพเดต HP ตามผลแพ้ชนะ
    if (winner === "You Win!") {
      const damage = calculateDamage(Player, EnemyBot);
      setBotHP((prev) => Math.max(prev - damage, 0));
    } else if (winner === "You Lose!") {
      const damage = calculateDamage(EnemyBot, Player);
      setPlayerHP((prev) => Math.max(prev - damage, 0));
    }

    // เอาการ์ดที่เล่นออกจากมือ
    const updatedHand = hand.filter((c) => c.id !== card.id);

    // จั่วการ์ดเติมให้มือเต็ม 5 ใบ
    const [newHand, newPool] = drawToFive(updatedHand, mainDeckPool);

    setHand(newHand);
    setMainDeckPool(newPool);
  };

  return (
    <div className="App">
      <h1>Clash & Card - RPS Battle</h1>

      <div style={{ border: "1px solid #ccc", padding: "1rem", marginBottom: "1rem" }}>
        <h3>Player</h3>
        <p>ATK: {Player.atk} DEF: {Player.def} SPD: {Player.spd}</p>
        <HealthBar currentHP={playerHP} maxHP={Player.hp} />
      </div>

      <h2>Your Hand</h2>
      {hand.length > 0 ? (
        <Deck cards={hand} onSelectCard={onSelectCard} />
      ) : (
        <p>No more cards to draw!</p>
      )}

      <div style={{ border: "1px solid #ccc", padding: "1rem", marginBottom: "1rem" }}>
        <h3>Bot</h3>
        <p>ATK: {EnemyBot.atk} DEF: {EnemyBot.def} SPD: {EnemyBot.spd}</p>
        <HealthBar currentHP={botHP} maxHP={EnemyBot.hp} />
      </div>

      <h2>Bot Played</h2>
      {botCard ? (
        <div style={{ fontSize: 48 }}>
          {botCard.emoji}
          <br />
          {botCard.name}
        </div>
      ) : (
        <p>Waiting for your move...</p>
      )}

      <h2>Result: {result}</h2>

      <p>Cards remaining in deck: {mainDeckPool.length}</p>
    </div>
  );
};

export default App;
