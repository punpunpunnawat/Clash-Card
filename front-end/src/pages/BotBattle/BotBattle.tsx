import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import Card from "../../components/Card";
import type { CardProps } from "../../types/Card";
import "./css/BotBattle.css";
import "./css/CardAttack.css";
import "./css/CardLayer.css";
import HealthBar from "../../components/HealthBar";
import { fetchDeck } from "../../store/slices/deckSlice";
import { fetchPlayer } from "../../store/slices/playerSlice";
import { useParams } from "react-router-dom";

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
  cardRemaining: {
    player: {
      paper: number;
      rock: number;
      scissors: number;
    };
    bot: {
      paper: number;
      rock: number;
      scissors: number;
    };
  };
};
type CardCount = {
  [CardType: string]: number; // เช่น { rock: 2, paper: 1 }
};

type CardRemaining = {
  player: CardCount;
  bot: CardCount;
};
type GameState =
  | "SELECT_CARD"
  | "CARD_SELECTED"
  | "SHOW_WINNER"
  | "DO_DAMAGE"
  | "DRAW_CARD";

const BotBattle = () => {
  const { levelId } = useParams<{ levelId: string }>();
  const player = useSelector((state: RootState) => state.player.player);

  const dispatch: AppDispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchPlayer(1));
    dispatch(fetchDeck(1));
  }, [dispatch]);
  const [gameState, setGameState] = useState<GameState>("SELECT_CARD");

  useEffect(() => {
    if (player?.stat?.hp) {
      setCurrentPlayerHP(Number(player.stat.hp));
    }
  }, [player]);

  const [currentPlayerHP, setCurrentPlayerHP] = useState<number>(
    Number(player?.stat.hp)
  );

  const [maxEnemyHP, setMaxEnemyHP] = useState<number>(0);
  const [currentEnemyHP, setCurrentEnemyHP] = useState<number>(0);

  const [updatedData, setUpdatedData] = useState<UpdatedData>();

  //Arena
  const [selectedPlayerCard, setSelectedPlayerCard] =
    useState<CardProps | null>(null);
  const [selectedBotCard, setSelectedBotCard] = useState<CardProps | null>(
    null
  );
  const [showCard, setShowCard] = useState(true);

  const [winner, setWinner] = useState("");

  const [playerHand, setPlayerHand] = useState<CardProps[]>([]);
  const [botHandSize, setBotHandSize] = useState(0);
  const [cardRemaining, setCardRemaining] = useState<CardRemaining>({
    player: {},
    bot: {},
  });

  //Animate
  const [animatingPlayerCard, setAnimatingPlayerCard] =
    useState<CardProps | null>(null);
  const [animatingEnemyCard, setAnimatingEnemyCard] =
    useState<CardProps | null>(null);
  const [playerDrawStyle, setPlayerDrawStyle] = useState<React.CSSProperties>(
    {}
  );
  const [enemyDrawStyle, setEnemyDrawStyle] = useState<React.CSSProperties>({});
  const playerDeckRef = useRef<HTMLDivElement>(null);
  const playerHandRef = useRef<HTMLDivElement>(null);
  const enemyDeckRef = useRef<HTMLDivElement>(null);
  const enemyHandRef = useRef<HTMLDivElement>(null);

  const handleSelectCard = (id: string) => {
    if (gameState !== "SELECT_CARD") return;
    console.log(id);
    setPlayerHand((prevHand) => prevHand.filter((card) => card.id !== id));
    setBotHandSize(botHandSize - 1);
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

  const findNewCard = (updatedCard: CardProps[]) => {
    const currentIds = playerHand.map((card) => card.id);
    const filteredNewCards = updatedCard.filter(
      (card) => !currentIds.includes(card.id)
    );
    const newCard = filteredNewCards[0];
    return newCard;
  };

  const drawPlayerCard = (newCard: CardProps, side: string) => {
    console.log(side, newCard);

    const deck = playerDeckRef.current;
    const hand = playerHandRef.current;
    if (!deck || !hand) return;
    const deckRect = deck.getBoundingClientRect();
    const handRect = hand.getBoundingClientRect();

    setAnimatingPlayerCard(newCard);

    // start at deck
    setPlayerDrawStyle({
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
      setPlayerDrawStyle((prev) => ({
        ...prev,
        left: handRect.left + handRect.width - deckRect.width / 2,
        top: handRect.top + handRect.height / 2 - deckRect.height / 2,
      }));
    }, 50);

    // after animation ends
    setTimeout(() => {
      setPlayerHand((prev) => [...prev, newCard]); // actual add
      setAnimatingPlayerCard(null); // remove floating card
    }, 600); // slightly longer than transition
  };

  const drawEnemyCard = () => {
    const deck = enemyDeckRef.current;
    const hand = enemyHandRef.current;
    if (!deck || !hand) return;
    const deckRect = deck.getBoundingClientRect();
    const handRect = hand.getBoundingClientRect();
    setAnimatingEnemyCard({ id: "temp", type: "hidden" });
    // start at deck
    setEnemyDrawStyle({
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
      setEnemyDrawStyle((prev) => ({
        ...prev,
        left: handRect.left + handRect.width - deckRect.width / 2,
        top: handRect.top + handRect.height / 2 - deckRect.height / 2,
      }));
    }, 50);

    // after animation ends
    setTimeout(() => {
      setBotHandSize((prev) => prev + 1); // actual add
      setAnimatingEnemyCard(null); // remove floating card
    }, 600); // slightly longer than transition
  };

  // useEffect(() => {
  //   console.log("updatedData changed to:", updatedData);
  //   console.log("rem changed to:", cardRemaining);
  //   if (updatedData?.cardRemaining) setCardRemaining(updatedData.cardRemaining);
  // }, [updatedData]);

  useEffect(() => {
    fetch("http://localhost:8080/api/battle/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: 1, levelId: Number(levelId) }), // ส่ง userId ไป
    })
      .then((res) => res.json()) // <== เพิ่ม .json() ตรงนี้
      .then((data) => {
        setCardRemaining(data.cardRemaining);
        setMaxEnemyHP(Number(data.botHP));
        setCurrentEnemyHP(Number(data.botHP));
        setPlayerHand(data.playerHand);
        setBotHandSize(data.botHandSize);
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
        if (updatedData) {
          drawPlayerCard(findNewCard(updatedData?.playerHand), "player");
          drawEnemyCard();
          setCardRemaining(updatedData.cardRemaining);
        }
        setGameState("SELECT_CARD");
        break;

      default:
        break;
    }
  }, [gameState]);

  if (!player) return <div>loading</div>;
  return (
    <div className="BotBattle">
      <div className="BotBattle__arena">
        <div className="BotBattle__enemy-bar">
          ? : Enemy <HealthBar currentHP={currentEnemyHP} maxHP={maxEnemyHP}/> ROCK:{cardRemaining.bot.rock} PAPER:{cardRemaining.bot.paper} SCISSORS{cardRemaining.bot.scissors}
        </div>
        <div className="BotBattle__board-player">
          <div style={{ width: 150, height: 250, visibility: "hidden" }} />
          <div className="hand" ref={playerHandRef}>
            {playerHand?.map((card, index) => {
              const total = playerHand.length;
              const angleStep = 10; // ค่าที่ควบคุมความเอียง
              const mid = (total - 1) / 2;
              const angle = (index - mid) * angleStep;
              const xOffset = (index - mid) * -30; // 👉 เพิ่มระยะห่างแนวนอน (ค่ามากขึ้น = ห่างขึ้น)
              const yOffset = Math.abs(index - mid) * 20; // ยิ่งห่างจากตรงกลาง ยิ่งต่ำลง
              const transform = `rotate(${angle}deg) translate(${xOffset}px, ${yOffset}px)`;
              return (
                <div
                  key={card.id}
                  style={{
                    transform,
                    transition: "transform 0.5s ease", // 👈 ใส่ transition ตรงนี้
                  }}
                >
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
          <div className="BotBattle__card-layer_deck" ref={playerDeckRef}>
            <img src="/BackOfCard.svg" width={150} height={250} />
          </div>
          {animatingPlayerCard && (
            <div style={playerDrawStyle}>
              <Card
                id={animatingPlayerCard.id}
                type={animatingPlayerCard.type}
              />
            </div>
          )}
        </div>

        <div className="BotBattle__board">

          <div className="BotBattle__board_card-placer">
            <img src="/CardPlacer-Player.svg" width={170} height={270} />
            {selectedPlayerCard && (
              <Card
                type={selectedPlayerCard.type}
                id={selectedPlayerCard.id}
                flipped={showCard}
                className={
                  (winner === "player"
                    ? "card card-attack-right"
                    : winner === "bot"
                    ? "card card-fly-left"
                    : "card") + " xxx"
                }
              />
            )}
          </div>
          <div className="BotBattle__board_card-placer">
            <img src="/CardPlacer-Enemy.svg" width={170} height={270} />
            {selectedBotCard && (
              <Card
                type={selectedBotCard.type}
                id={selectedBotCard.id}
                flipped={showCard}
                className={
                  winner === "bot"
                    ? "card card-attack-left"
                    : winner === "player"
                    ? "card card-fly-right"
                    : "card"
                }
              />
            )}
          </div>
        </div>

        <div className="BotBattle__board-enemy">
          <div
            className="BotBattle__card-layer_deck"
            ref={enemyDeckRef}
            style={{ transform: "scaleY(-1)" }}
          >
            <img src="/BackOfCard.svg" width={150} height={250} />
          </div>
          <div className="hand" ref={enemyHandRef}>
            {Array.from({ length: botHandSize }).map((_, index) => {
              const total = botHandSize;
              const angleStep = 10; // ค่าที่ควบคุมความเอียง
              const mid = (total - 1) / 2;
              const angle = -(index - mid) * angleStep;
              const xOffset = (index - mid) * -30;
              const yOffset = Math.abs(index - mid) * -20;
              const transform = `rotate(${angle}deg) translate(${xOffset}px, ${yOffset}px)`;

              return (
                <div
                  style={{
                    transform,
                    transition: "transform 0.5s ease",
                  }}
                >
                  <div
                    className="card-wrapper"
                    style={{ transform: "scaleY(-1)" }}
                  >
                    <Card
                      id={"id here"}
                      type="hidden" // เปลี่ยน type ได้ตามที่ต้องการ
                      flipped
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ width: 150, height: 250, visibility: "hidden" }} />
          {animatingEnemyCard &&
            (console.log("Animating enemy card triggered", animatingEnemyCard),
            (
              <div style={enemyDrawStyle}>
                <Card
                  id={animatingEnemyCard.id}
                  type={animatingEnemyCard.type}
                  flipped
                />
              </div>
            ))}
        </div>
        <div className="BotBattle__player-bar">
          {player?.level} : {player?.username}{" "}
            <HealthBar currentHP={currentPlayerHP} maxHP={player?.stat.hp} /> 
          ROCK:{cardRemaining.bot.rock} PAPER:{cardRemaining.player.paper} SCISSORS{cardRemaining.player.scissors}
        </div>
      </div>

      <div className="relative group">
        <button className="p-2 bg-blue-500 text-white rounded">Hover me</button>
      </div>
    </div>
  );
};

export default BotBattle;
