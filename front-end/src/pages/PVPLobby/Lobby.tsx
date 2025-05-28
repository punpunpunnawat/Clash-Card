import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { CardProps, CardType } from "../../types/Card";
import Card from "./../../components/Card/Card";

const Lobby = () => {
  type ServerMessage =
    | { type: "slot_assigned"; slot: "A" | "B" }
    | {
        type: "selection_status";
        Aselected: boolean;
        Bselected: boolean;
      }
    | {
        type: "player_hand";
        playerHand: CardProps[];
      };

  const { id: roomID } = useParams();
  const ws = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  //const [playerSelected, setPlayerSelected] = useState<boolean>(false);
  const [opponentSelected, setOpponentSelected] = useState<boolean>(false);
  const [selectedCard, setSelectedCard] = useState<CardProps | null>(null);
  const [playerSlot, setPlayerSlot] = useState<"A" | "B" | null>(null);

  const [playerHand, setPlayerHand] = useState<CardProps[] | null>(null);


    const playerDeckRef = useRef<HTMLDivElement>(null);
  const playerHandRef = useRef<HTMLDivElement>(null);
  const enemyDeckRef = useRef<HTMLDivElement>(null);
  const enemyHandRef = useRef<HTMLDivElement>(null);

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

        if (msg.type === "slot_assigned") {
          setPlayerSlot(msg.slot);
        } else if (msg.type === "selection_status") {
          console.log("A " + msg.Aselected);
          console.log("B " + msg.Bselected);
          const playerIsA = playerSlot === "A";
          console.log(msg);
          if (playerIsA) {
            if (msg.Bselected) {
              console.log("b enemy set");
              setOpponentSelected(true);
            } else {
              setOpponentSelected(false);
            }
          } else if (playerSlot === "B") {
            if (msg.Aselected) {
              console.log("a enemy set");
              setOpponentSelected(true);
            } else {
              setOpponentSelected(false);
            }
          }
        } else if (msg.type === "player_hand") {
          setPlayerHand(msg.playerHand);
          console.log(msg)
          console.log(playerHand)
        }
      } catch (err) {
        console.error("Invalid message", err);
      }
    };

    ws.current.onclose = () => setMessages((m) => [...m, "🔴 Disconnected"]);

    return () => ws.current?.close();
  }, [roomID]);

  const handleCardSelect = (type: CardType) => {
    if (ws.current?.readyState !== WebSocket.OPEN) return;

    const card: CardProps = {
      id: "player",
      type,
    };

    ws.current.send(
      JSON.stringify({
        type: "selected_card",
        card: type,
      })
    );

    setSelectedCard(card);
    setMessages((m) => [...m, `📤 You selected: ${type}`]);
  };

  const sendMessage = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(input);
      setMessages((m) => [...m, `📤 ${input}`]);
      setInput("");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">ห้อง: {roomID}</h2>

      <div className="space-x-2">
        <button
          onClick={() => handleCardSelect("rock")}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          ✊ Rock
        </button>
        <button
          onClick={() => handleCardSelect("paper")}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          ✋ Paper
        </button>
        <button
          onClick={() => handleCardSelect("scissors")}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          ✌️ Scissors
        </button>
      </div>

      <div>
        <p>
          🧍‍♂️ You selected: <b>{selectedCard?.type ?? "-"}</b>
        </p>
        <p>🧍‍♀️ Opponent: {opponentSelected ? "✅ Selected" : "❌ Not yet"}</p>
      </div>

      <div className="mt-4">
        <input
          className="border p-1 mr-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-400 text-white px-3 py-1 rounded"
        >
          ส่ง
        </button>
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
                    // onClick={handleSelectCard}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          {messages.map((msg, idx) => (
            <div key={idx}>{msg}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
