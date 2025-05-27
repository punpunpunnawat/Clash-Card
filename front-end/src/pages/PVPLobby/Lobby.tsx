import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { CardProps, CardType } from "../../types/Card";

const Lobby = () => {
  const { id: roomID } = useParams();
  const ws = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const [playerSelectedCard, setPlayerSelectedCard] =
    useState<CardProps | null>(null);
  const [opponentSelectedCard, setOpponentSelectedCard] =
    useState<CardProps | null>(null);

    const [playerSlot, setPlayerSlot] = useState<"A" | "B" | null>(null);

  useEffect(() => {
    if (!roomID) return;

    ws.current = new WebSocket(`ws://localhost:8080/ws/pvp?room=${roomID}`);

    ws.current.onopen = () => setMessages((m) => [...m, "🟢 Connected"]);

    ws.current.onmessage = (e) => {
  setMessages((m) => [...m, `📨 ${e.data}`]);

  try {
    const msg = JSON.parse(e.data);

    if (msg.type === "slot_assigned") {
      setPlayerSlot(msg.slot);
    } else if (msg.type === "selection_status") {
      const playerIsA = playerSlot === "A";

      if (playerIsA) {
        if (msg.Bselected) {
          setOpponentSelectedCard({ id: "opponent", type: "hidden" });
        } else {
          setOpponentSelectedCard(null);
        }
      } else if (playerSlot === "B") {
        if (msg.Aselected) {
          setOpponentSelectedCard({ id: "opponent", type: "hidden" });
        } else {
          setOpponentSelectedCard(null);
        }
      }
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

    setPlayerSelectedCard(card);
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
          🧍‍♂️ You selected: <b>{playerSelectedCard?.type ?? "-"}</b>
        </p>
        <p>
          🧍‍♀️ Opponent: {opponentSelectedCard ? "✅ Selected" : "❌ Not yet"}
        </p>
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

      <div className="text-sm text-gray-600 space-y-1">
        {messages.map((msg, idx) => (
          <div key={idx}>{msg}</div>
        ))}
      </div>
    </div>
  );
};

export default Lobby;
