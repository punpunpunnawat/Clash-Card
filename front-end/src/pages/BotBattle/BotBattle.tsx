import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import Card from "../../components/Card";
import type { CardProps } from "../../types/Card";
import "./BotBattle.css";
import "./CardAttack.css";
import "./CardLayer.css";
import HealthBar from "../../components/HealthBar";

type UpdatedData = {
  botCard: CardProps;
  botHand: CardProps[]; //อย่าลืมเอาออก
  damage: string[];
  hp: {
    bot: number;
    player: number;
  };
  playerCard: CardProps;
  playerHand: CardProps[];
  result: string;
  winner: string;
};

type GameState =
  | "SELECT_CARD"
  | "CARD_SELECTED"
  | "SHOW_WINNER"
  | "DO_DAMAGE"
  | "DRAW_CARD";

const BotBattle = () => {
  const [gameState, setGameState] = useState<GameState>("SELECT_CARD");

  const player = useSelector((state: RootState) => state.player.player);
  const [playerData] = useState(player);
  const [currentPlayerHP, setCurrentPlayerHP] = useState<number>(
    Number(player?.stat.hp)
  );
  const [currentEnemyHP, setCurrentEnemyHP] = useState<number>(0);
  const [playerHand, setPlayerHand] = useState<CardProps[]>([]);
  const [updatedData, setUpdatedData] = useState<UpdatedData>();
  const [selectedPlayerCard, setSelectedPlayerCard] =
    useState<CardProps | null>(null);
  const [selectedBotCard, setSelectedBotCard] = useState<CardProps | null>(
    null
  );
  const [showCard, setShowCard] = useState(true);
  const [winner, setWinner] = useState("");

  const [animatingCard, setAnimatingCard] = useState<CardProps | null>(null);
  const [animStyle, setAnimStyle] = useState<React.CSSProperties>({});
  const deckRef = useRef<HTMLDivElement>(null);
  const handRef = useRef<HTMLDivElement>(null);

  const animateDrawCard = (card: CardProps) => {
    const deck = deckRef.current;
    const hand = handRef.current;
    console.log("deckRect", deck?.getBoundingClientRect());
    console.log("handRect", hand?.getBoundingClientRect());
    if (!deck || !hand) return;

    const deckRect = deck.getBoundingClientRect();
    const handRect = hand.getBoundingClientRect();

    setAnimatingCard(card); // show the flying card

    // start at deck
    setAnimStyle({
      position: "fixed",
      left: deckRect.left,
      top: deckRect.top,
      width: deckRect.width,
      height: deckRect.height,
      transition: "all 0.5s ease",
      zIndex: 1000,
    });

    // trigger animation in next tick
    setTimeout(() => {
      setAnimStyle((prev) => ({
        ...prev,
        left: handRect.left + handRect.width / 2 - deckRect.width / 2,
        top: handRect.top,
      }));
    }, 50);

    // after animation ends
    setTimeout(() => {
      setPlayerHand((prev) => [...prev, card]); // actual add
      setAnimatingCard(null); // remove floating card
    }, 600); // slightly longer than transition
  };

  useEffect(() => {
    console.log("✅ selectedPlayerCard changed to:", selectedPlayerCard);
  }, [selectedPlayerCard]);

  useEffect(() => {
    fetch("http://localhost:8080/api/battle/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: 1 }), // ส่ง userId ไป
    })
      .then((res) => res.json()) // <== เพิ่ม .json() ตรงนี้
      .then((data) => {
        setCurrentEnemyHP(Number(data.botHP));
        setPlayerHand(data.playerHand);
        console.log("Data:", data);
      })
      .catch((err) => {
        console.error("Error starting battle:", err);
      });
  }, []);

  useEffect(() => {
    if (selectedBotCard && selectedBotCard) {
      setGameState("SHOW_WINNER");
    }
  }, [selectedPlayerCard, selectedBotCard]);

  useEffect(() => {
    switch (gameState) {
      case "SELECT_CARD":
        // ยังไม่ทำอะไร รอผู้เล่นเลือกการ์ด
        break;

      case "CARD_SELECTED":
        // ถ้าคุณมี logic ที่จะทำหลังจากเลือกการ์ด เช่น แสดงการ์ดที่เลือก ฯลฯ ก็ใส่ตรงนี้
        break;

      case "SHOW_WINNER":
        console.log("showing winner");
        setTimeout(() => {
          setShowCard(false);
          setTimeout(() => {
            if (updatedData) {
              setWinner(updatedData.winner);
            }
            setTimeout(() => {
              setShowCard(true);
              setWinner("");
              setSelectedPlayerCard(null);
              setSelectedBotCard(null);
              setGameState("DO_DAMAGE");
            }, 1000);
          }, 1000);
        }, 2000);

        break;

      case "DO_DAMAGE":
        if (updatedData) {
          setCurrentPlayerHP(Number(updatedData.hp.player));
          setCurrentEnemyHP(Number(updatedData.hp.bot));
          setGameState("DRAW_CARD");
        }
        break;

      case "DRAW_CARD":
        if (updatedData) findNewCardAndDraw(updatedData?.playerHand);

        break;

      default:
        break;
    }
  }, [gameState]);

  const findNewCardAndDraw = (updatedCard: CardProps[]) => {
    const currentIds = playerHand.map((card) => card.id);
    const filteredNewCards = updatedCard.filter(
      (card) => !currentIds.includes(card.id)
    );
    animateDrawCard(filteredNewCards[0]);
  };
  const handleSelectCard = (id: string) => {
    console.log(id);
    setPlayerHand((prevHand) => prevHand.filter((card) => card.id !== id));

    //setGameState("CARD_SELECTED");
    setSelectedPlayerCard(playerHand.find((card) => card.id === id) || null);
    console.log(selectedPlayerCard);
    fetch("http://localhost:8080/api/battle/play", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: 1, cardId: id }), // ส่ง userId ไป
    })
      .then((res) => res.json()) // <== เพิ่ม .json() ตรงนี้
      .then((data) => {
        setSelectedBotCard(data.botCard);
        setUpdatedData(data); // เก็บผลไว้ก่อน
        console.log(data);
      })
      .catch((err) => {
        console.error("Error starting battle:", err);
      });
  };

  if (!playerData) return <div>Loading user data...</div>;

  return (
    <div>
      <div>
        <h2>
          Player: {playerData?.username} (Level {playerData?.level})
        </h2>
        <div>
          <HealthBar currentHP={currentPlayerHP} maxHP={playerData.stat.hp} />
          <p>HP: {playerData?.stat.hp}</p>
          <p>ATK: {playerData?.stat.atk}</p>
          <p>DEF: {playerData?.stat.def}</p>
          <p>SPD: {playerData?.stat.spd}</p>
        </div>
      </div>

      <div>
        <h2>Enemy: BotTest (Level 999)</h2>
        <div>
          <HealthBar currentHP={currentEnemyHP} maxHP={playerData.stat.hp} />
          <p>HP: {playerData?.stat.hp}</p>
          <p>ATK: {playerData?.stat.atk}</p>
          <p>DEF: {playerData?.stat.def}</p>
          <p>SPD: {playerData?.stat.spd}</p>
        </div>
      </div>

      <div className="BotBattle__card-layer">
        <div className="BotBattle__card-layer_deck" ref={deckRef}>
          DECK
        </div>
        <div className="hand" ref={handRef}>
          {playerHand?.map((card, index) => {
            const total = playerHand.length;
            const angleStep = 10; // ค่าที่ควบคุมความเอียง
            const mid = (total - 1) / 2;
            const angle = (index - mid) * angleStep;
            const xOffset = (index - mid) * -10; // 👉 เพิ่มระยะห่างแนวนอน (ค่ามากขึ้น = ห่างขึ้น)
            const yOffset = Math.abs(index - mid) * 20; // ยิ่งห่างจากตรงกลาง ยิ่งต่ำลง
            const transform = `rotate(${angle}deg) translate(${xOffset}px, ${yOffset}px)`;

            return (
              <div key={card.id} style={{ transform }}>
                <div className="card-wrapper">
                  <Card
                    id={card.id}
                    type={card.type}
                    onClick={handleSelectCard}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {animatingCard && (
          <div style={animStyle}>
            <Card id={animatingCard.id} type={animatingCard.type} />
          </div>
        )}
      </div>

      <div className="BotBattle__show-winner">
        {selectedPlayerCard && (
          <div
            className={
              winner === "player"
                ? "card card-attack-right"
                : winner === "bot"
                ? "card card-fly-left"
                : "card"
            }
          >
            <Card
              type={selectedPlayerCard.type}
              id={selectedPlayerCard.id}
              flipped={showCard}
            />
          </div>
        )}

        {selectedBotCard && (
          <div
            className={
              winner === "bot"
                ? "card card-attack-left"
                : winner === "player"
                ? "card card-fly-right"
                : "card"
            }
          >
            <Card
              type={selectedBotCard.type}
              id={selectedBotCard.id}
              flipped={showCard}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BotBattle;
