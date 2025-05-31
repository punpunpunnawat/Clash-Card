import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { CardProps, CardType } from "../../types/Card";
import Card from "./../../components/Card/Card";
import HealthBar from "../../components/HealthBar";
import "./css/enemyBattle.css";
import "./css/CardAttack.css";
import type { UnitStat } from "../../types/UnitStat";
const Lobby = () => {
  type ServerMessage =
    | { type: "slot_assigned"; slot: "A" | "B" }
    | {
        type: "selection_status";
        opponentSelected: boolean;
      }
    | {
        type: "initialData";
        player: {
          name: string;
          level: number;
          currentHP: number;
          cardRemaining: CardCount;
          hand: CardProps[];
          stat: {
            atk: number;
            def: number;
            spd: number;
            hp: number;
          };
        };
        opponent: {
          name: string;
          level: number;
          currentHP: number;
          cardRemaining: CardCount;
          handSize: number;
          stat: {
            atk: number;
            def: number;
            spd: number;
            hp: number;
          };
        };
      }
    | {
        type: "round_result";
        gameStatus: string;
        roundWinner: string;
        opponentPlayed: CardType;
        playerPlayed: CardProps;
        playerHand: CardProps[];
        damage: {
          enemyToPlayer: number;
          playerToEnemy: number;
        };
        hp: {
          enemy: number;
          player: number;
        };
        cardRemaining: {
          player: {
            paper: number;
            rock: number;
            scissors: number;
          };
          opponent: {
            paper: number;
            rock: number;
            scissors: number;
          };
        };
      };

  type RoundResult = {
    type: "round_result";
    gameStatus: string;
    roundWinner: string;
    opponentPlayed: CardType;
    playerPlayed: CardProps;
    playerHand: CardProps[];
    damage: {
      enemyToPlayer: number;
      playerToEnemy: number;
    };
    hp: {
      enemy: number;
      player: number;
    };
    cardRemaining: {
      player: {
        paper: number;
        rock: number;
        scissors: number;
      };
      opponent: {
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
    opponent: CardCount;
  };

  type PlayerDetail = {
    stat: UnitStat;
    name: string;
    level: number;
  }

  const { id: roomID } = useParams();
  const ws = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

  // const [input, setInput] = useState("");

  //const [playerSelected, setPlayerSelected] = useState<boolean>(false);
  //const [opponentSelected, setOpponentSelected] = useState<boolean>(false);
  const [opponentHandSize, setOpponentHandSize] = useState<number>(0);

  const [selectedPlayerCard, setSelectedPlayerCard] =
    useState<CardProps | null>(null);
  const [selectedOpponentCard, setSelectedOpponentCard] =
    useState<CardProps | null>(null);
  const [playerSlot, setPlayerSlot] = useState<"A" | "B" | null>(null);
  const [playerHand, setPlayerHand] = useState<CardProps[]>([]);

  const [currentPlayerHP, setCurrentPlayerHP] = useState(0);
  const [currentOpponentHP, setCurrentOpponentHP] = useState(0);
  //const [maxPlayerHP, setMaxPlayerHP] = useState(0);
  //const [maxOpponentHP, setMaxOpponentHP] = useState(0);

  const [playerDetail, setPlayerDetail] = useState<PlayerDetail>({name: "player", level: 0, stat: {atk:0, def:0, spd:0, hp:0}});
  const [opponentDetail, setOpponentDetail] = useState<PlayerDetail>({name: "enemy", level: 0, stat: {atk:0, def:0, spd:0, hp:0}});

  const [winner, setWinner] = useState("");

  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);

  //Animated
  const [showCard, setShowCard] = useState(false);
  //Animate
  const [animatingPlayerCard, setAnimatingPlayerCard] =
    useState<CardProps | null>(null);
  const [animatingOpponentCard, setAnimatingOpponentCard] =
    useState<CardProps | null>(null);
  const [playerDrawStyle, setPlayerDrawStyle] = useState<React.CSSProperties>(
    {}
  );
  const [enemyDrawStyle, setEnemyDrawStyle] = useState<React.CSSProperties>({});
  const [cardRemaining, setCardRemaining] = useState<CardRemaining>({
    player: {},
    opponent: {},
  });

  const playerDeckRef = useRef<HTMLDivElement>(null);
  const playerHandRef = useRef<HTMLDivElement>(null);
  const enemyDeckRef = useRef<HTMLDivElement>(null);
  const enemyHandRef = useRef<HTMLDivElement>(null);

  //GAME STATE
  type GameState =
    | "WAIT_OPPONENT"
    | "SELECT_CARD"
    | "CARD_SELECTED"
    | "BOTH_SELECTED"
    | "SHOW_RESULT"
    | "DO_DAMAGE"
    | "DRAW_CARD"
    | "GAME_END_WIN"
    | "GAME_END_LOSE";
  const [gameState, setGameState] = useState<GameState>("WAIT_OPPONENT");

  //CARD FUNC
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

  const drawOpponentCard = () => {
    const deck = enemyDeckRef.current;
    const hand = enemyHandRef.current;
    if (!deck || !hand) return;
    const deckRect = deck.getBoundingClientRect();
    const handRect = hand.getBoundingClientRect();
    setAnimatingOpponentCard({ id: "temp", type: "hidden" });
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
      setOpponentHandSize((prev) => prev + 1); // actual add
      setAnimatingOpponentCard(null); // remove floating card
    }, 600); // slightly longer than transition
  };

  useEffect(() => {
    console.log("result isss");
    console.log(roundResult);
    if (roundResult) {
      switch (gameState) {
        case "BOTH_SELECTED":
          setSelectedOpponentCard({
            id: "enemy",
            type: roundResult.opponentPlayed,
          });
          console.log(roundResult.opponentPlayed);
          //setOpponentHandSize(opponentHandSize - 1);
          setGameState("SHOW_RESULT");
          break;
        case "SHOW_RESULT":
          setTimeout(() => {
            setShowCard(false);
            setTimeout(() => {
              console.log(roundResult.roundWinner);
              setWinner(roundResult.roundWinner);

              setTimeout(() => {
                setShowCard(true);
                setWinner("");
                setSelectedPlayerCard(null);
                setSelectedOpponentCard(null);
                setGameState("DO_DAMAGE");
              }, 1000);
            }, 1000);
          }, 2000);
          break;

        case "DO_DAMAGE":
          if (roundResult) {
            setCurrentPlayerHP(Number(roundResult.hp.player));
            setCurrentOpponentHP(Number(roundResult.hp.enemy));
            if (roundResult.gameStatus === "playerWin") {
              setGameState("GAME_END_WIN");
            } else if (roundResult.gameStatus === "botWin") {
              setGameState("GAME_END_LOSE");
            }
            setGameState("DRAW_CARD");
          }

          break;

        case "DRAW_CARD":
          drawPlayerCard(findNewCard(roundResult.playerHand), "player");
          drawOpponentCard();
          setCardRemaining(roundResult.cardRemaining);
          setRoundResult(null);

          setGameState("SELECT_CARD");
          break;
        default:
          break;
      }
    }
  }, [gameState, roundResult]);

  useEffect(() => {
    if (!roomID) return;

    const token = localStorage.getItem("authToken")!;

    ws.current = new WebSocket(`ws://localhost:8080/ws/pvp?room=${roomID}`, [
      token,
    ]);

    ws.current.onopen = () => setMessages((m) => [...m, "🟢 Connected"]);
    ws.current.onmessage = (e) => {
      setMessages((m) => [...m, `📨 ${e.data}`]);

      try {
        const msg = JSON.parse(e.data) as ServerMessage;

        switch (msg.type) {
          case "slot_assigned":
            setPlayerSlot(msg.slot);
            break;

          case "selection_status":
            console.log(msg.opponentSelected);
            if (msg.opponentSelected) {
              setSelectedOpponentCard({ id: "enemy", type: "hidden" });
              setOpponentHandSize((prev) => prev + -1);
              //setOpponentHandSize(opponentHandSize-1);
            }

            break;

          case "initialData":
            //set hand
            setPlayerHand(msg.player.hand);
            setOpponentHandSize(msg.opponent.handSize);

            //setCardRemaining
            setCardRemaining({player: msg.player.cardRemaining, opponent: msg.opponent.cardRemaining})
            //set Stat
            setPlayerDetail({name: msg.player.name, level: msg.player.level, stat:msg.player.stat});
            setOpponentDetail({name: msg.opponent.name, level: msg.opponent.level, stat:msg.opponent.stat});
            setCurrentPlayerHP(msg.player.currentHP);
            setCurrentOpponentHP(msg.opponent.currentHP);
            console.log(msg);
            console.log(playerHand);
            setGameState("SELECT_CARD")
            break;

          case "round_result":
            console.log(msg);
            setRoundResult(msg);
            setGameState("BOTH_SELECTED");
            break;

          default:
            console.warn("⚠️ Unknown message type:", msg);
            break;
        }
      } catch (err) {
        console.error("Invalid message", err);
      }
    };

    ws.current.onclose = () => setMessages((m) => [...m, "🔴 Disconnected"]);

    return () => ws.current?.close();
  }, [roomID]);

  const handleCardSelect = (cardID: string) => {
    if (gameState !== "SELECT_CARD") return;
    if (ws.current?.readyState !== WebSocket.OPEN) return;
    setPlayerHand((prevHand) => prevHand.filter((card) => card.id !== cardID));
    setSelectedPlayerCard(
      playerHand.find((card) => card.id === cardID) || null
    );

    ws.current.send(
      JSON.stringify({
        type: "selected_card",
        cardID: cardID,
      })
    );
    setGameState("CARD_SELECTED");
    // setMessages((m) => [...m, `📤 You selected: ${cardID}`]);
  };

  useEffect(() => {
    console.log(roundResult);
  }, [roundResult]);

  useEffect(() => {
    console.log(selectedOpponentCard);
  }, [selectedOpponentCard]);

  if(gameState==="WAIT_OPPONENT") return<div>waiting</div>
  return (
    <div className="EnemyBattle">
      <div className="EnemyBattle__arena">
        <div className="EnemyBattle__enemy-bar">
          ? : Enemy{" "}
          <HealthBar currentHP={currentOpponentHP} maxHP={opponentDetail.stat.hp} />{" "}
          ROCK:{cardRemaining.opponent.rock} PAPER:
          {cardRemaining.opponent.paper} SCISSORS
          {cardRemaining.opponent.scissors}
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
                      onClick={handleCardSelect}
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
            {selectedOpponentCard && (
              <Card
                type={selectedOpponentCard.type}
                id={selectedOpponentCard.id}
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
            {Array.from({ length: opponentHandSize }).map((_, index) => {
              const total = opponentHandSize;
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
          {animatingOpponentCard &&
            (console.log(
              "Animating enemy card triggered",
              animatingOpponentCard
            ),
            (
              <div style={enemyDrawStyle}>
                <Card
                  id={animatingOpponentCard.id}
                  type={animatingOpponentCard.type}
                  flipped
                />
              </div>
            ))}
        </div>
        <div className="EnemyBattle__player-bar">
          ? : {playerSlot}{" "}
          <HealthBar currentHP={currentPlayerHP} maxHP={playerDetail.stat.hp} />
          ROCK:{cardRemaining.player.rock} PAPER:{cardRemaining.player.paper}{" "}
          SCISSORS{cardRemaining.player.scissors} {gameState}
        </div>
      </div>

      <div className="relative group">
        <button className="p-2 bg-blue-500 text-white rounded">Hover me</button>
      </div>
    </div>
  );
};

export default Lobby;
