import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import Card from "../../components/Card";
import type { CardProps } from "../../types/Card";
import "./css/enemyBattle.css";
import "./css/CardAttack.css";
import HealthBar from "../../components/HealthBar";
import { fetchDeck } from "../../store/slices/deckSlice";
import { fetchPlayer } from "../../store/slices/playerSlice";
import { useParams } from "react-router-dom";

type UpdatedData = {
  enemyCard: CardProps;
  enemyHand: CardProps[]; //อย่าลืมเอาออก
  damage: string[];
  hp: {
    enemy: number;
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
    enemy: {
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
  enemy: CardCount;
};
type GameState =
  | "SELECT_CARD"
  | "CARD_SELECTED"
  | "SHOW_WINNER"
  | "DO_DAMAGE"
  | "DRAW_CARD";

const EnemyBattle = () => {
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
  const [selectedEnemyCard, setSelectedEnemyCard] = useState<CardProps | null>(
    null
  );
  const [showCard, setShowCard] = useState(true);

  const [winner, setWinner] = useState("");

  const [playerHand, setPlayerHand] = useState<CardProps[]>([]);
  const [enemyHandSize, setEnemyHandSize] = useState(0);
  const [cardRemaining, setCardRemaining] = useState<CardRemaining>({
    player: {},
    enemy: {},
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
      setEnemyHandSize((prev) => prev + 1); // actual add
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
        setMaxEnemyHP(Number(data.enemyHP));
        console.log("emhp:", data.enemyHP);
        setCurrentEnemyHP(Number(data.enemyHP));
        setPlayerHand(data.playerHand);
        setEnemyHandSize(data.enemyHandSize);
        sessionStorage.setItem("matchId", data.matchId);
        

        console.log("Data:", data);
      })
      .catch((err) => {
        console.error("Error starting battle:", err);
      });
  }, []);

  const handleSelectCard = (id: string) => {
    if (gameState !== "SELECT_CARD") return;
    console.log(id);
    const matchId = sessionStorage.getItem("matchId");
    setPlayerHand((prevHand) => prevHand.filter((card) => card.id !== id));
    setEnemyHandSize(enemyHandSize - 1);
    //setGameState("CARD_SELECTED");
    setSelectedPlayerCard(playerHand.find((card) => card.id === id) || null);
    console.log(selectedPlayerCard);
    fetch(`http://localhost:8080/api/battle/${matchId}/play`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userID:player?.id, cardId: id }), // ส่ง userId ไป
    })
      .then((res) => res.json()) // <== เพิ่ม .json() ตรงนี้
      .then((data) => {
        setSelectedEnemyCard(data.enemyCard);
        setUpdatedData(data); // เก็บผลไว้ก่อน
        console.log(data);
      })
      .catch((err) => {
        console.error("Error starting battle:", err);
      });
  };

  useEffect(() => {
    if (selectedEnemyCard && selectedEnemyCard) {
      setGameState("SHOW_WINNER");
    }
  }, [selectedPlayerCard, selectedEnemyCard]);

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
              console.log(updatedData.winner)
              setWinner(updatedData.winner);
            }
            setTimeout(() => {
              setShowCard(true);
              setWinner("");
              setSelectedPlayerCard(null);
              setSelectedEnemyCard(null);
              setGameState("DO_DAMAGE");
            }, 1000);
          }, 1000);
        }, 2000);

        break;

      case "DO_DAMAGE":
        if (updatedData) {
          setCurrentPlayerHP(Number(updatedData.hp.player));
          setCurrentEnemyHP(Number(updatedData.hp.enemy));
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

  if (!player || !maxEnemyHP) return <div>loading</div>;
  return (
    <div className="EnemyBattle">
      <div className="EnemyBattle__arena">
        <div className="EnemyBattle__enemy-bar">
          ? : Enemy <HealthBar currentHP={currentEnemyHP} maxHP={maxEnemyHP} />{" "}
          ROCK:{cardRemaining.enemy.rock} PAPER:{cardRemaining.enemy.paper}{" "}
          SCISSORS{cardRemaining.enemy.scissors}
        </div>
        <div className="EnemyBattle__board-player">
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
          <div className="EnemyBattle__card-layer_deck" ref={playerDeckRef}>
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

        <div className="EnemyBattle__board">
          <div className="EnemyBattle__board_card-placer">
            <img src="/CardPlacer-Player.svg" width={170} height={270} />
            {selectedPlayerCard && (
              <Card
                type={selectedPlayerCard.type}
                id={selectedPlayerCard.id}
                flipped={showCard}
                className={
                  (winner === "player"
                    ? "card card-attack-right"
                    : winner === "enemy"
                    ? "card card-fly-left"
                    : "card") + " xxx"
                }
              />
            )}
          </div>
          <div className="EnemyBattle__board_card-placer">
            <img src="/CardPlacer-Enemy.svg" width={170} height={270} />
            {selectedEnemyCard && (
              <Card
                type={selectedEnemyCard.type}
                id={selectedEnemyCard.id}
                flipped={showCard}
                className={
                  winner === "enemy"
                    ? "card card-attack-left"
                    : winner === "player"
                    ? "card card-fly-right"
                    : "card"
                }
              />
            )}
          </div>
        </div>

        <div className="EnemyBattle__board-enemy">
          <div
            className="EnemyBattle__card-layer_deck"
            ref={enemyDeckRef}
            style={{ transform: "scaleY(-1)" }}
          >
            <img src="/BackOfCard.svg" width={150} height={250} />
          </div>
          <div className="hand" ref={enemyHandRef}>
            {Array.from({ length: enemyHandSize }).map((_, index) => {
              const total = enemyHandSize;
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
        <div className="EnemyBattle__player-bar">
          {player?.level} : {player?.username}{" "}
          <HealthBar currentHP={currentPlayerHP} maxHP={player?.stat.hp} />
          ROCK:{cardRemaining.player.rock} PAPER:{cardRemaining.player.paper}{" "}
          SCISSORS{cardRemaining.player.scissors}
        </div>
      </div>

      <div className="relative group">
        <button className="p-2 bg-blue-500 text-white rounded">Hover me</button>
      </div>
    </div>
  );
};

export default EnemyBattle;
