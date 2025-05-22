import React, { useEffect } from "react";
import { fetchPlayer } from "../../store/slices/playerSlice";
import { fetchDeck  } from "../../store/slices/deckSlice";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../store"; // import AppDispatch ด้วย


function Home() {
  
  const player = useSelector((state: RootState) => state.player.player);
  const deck = useSelector((state: RootState) => state.deck.deck);
  const navigate = useNavigate();

  const dispatch: AppDispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchPlayer(1));
    dispatch(fetchDeck(1));
  }, [dispatch]);

  const handleClickPlayWithBot = () => {
    navigate("/bot-battle");
  };

  const handleClickSelectLevel = () => {
    navigate("/level");
  };

  if (!player) return <div>กำลังโหลดข้อมูลผู้เล่น...</div>;

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
      <button onClick={handleClickPlayWithBot}>Play with Bot</button>
      <button onClick={handleClickSelectLevel}>Select Level</button>
    </div>
  );
}

export default Home