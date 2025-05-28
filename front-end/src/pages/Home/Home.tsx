import React, { useEffect, useState } from "react";
import { fetchPlayer } from "../../store/slices/playerSlice";
import { fetchDeck } from "../../store/slices/deckSlice";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../store"; // import AppDispatch ด้วย

function Home() {
  const player = useSelector((state: RootState) => state.player.player);
  const deck = useSelector((state: RootState) => state.deck.deck);
  const [lobbyID, setLobbyID] = useState("");
  const navigate = useNavigate();

  const dispatch: AppDispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchPlayer());
    dispatch(fetchDeck());
  }, [dispatch]);

  const handleClickLobby = () => {
    if (lobbyID.trim()) {
      navigate(`/lobby/${lobbyID.trim()}`);
    }
  };

  const handleClickSelectLevel = () => {
    navigate("/level");
  };

  const handleChangeLobbyID = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLobbyID(e.target.value);
  };

  useEffect(() => (
    console.log(deck)
  ),[deck])

  if (!player) return <div>กำลังโหลดข้อมูลผู้เล่น...</div>;
  console.log(player)
  return (
    <div>
      <h1>ยินดีต้อนรับ {player.username}</h1>
      <p>เลเวล: {player.level}</p>
      <p>พลังโจมตี: {player.stat.atk}</p>
      <p>พลังป้องกัน: {player.stat.def}</p>
      <p>HP: {player.stat.hp}</p>
      <p>ความเร็ว: {player.stat.spd}</p>
      <p>เงิน: {player.money}</p>
      <ul>
        {deck.map((card, index) => (
          <li key={index}>
            การ์ดที่ {index + 1}: {card.cardType}
          </li>
        ))}
      </ul>
      <input
        placeholder="Enter Lobby ID"
        value={lobbyID}
        onChange={handleChangeLobbyID}
      />

      <button onClick={handleClickLobby}>Lobby</button>
      <button onClick={handleClickSelectLevel}>Select Level</button>
    </div>
  );
}

export default Home;
