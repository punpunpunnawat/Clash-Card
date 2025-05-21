import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPlayer } from "../../store/slices/playerSlice";
import { type RootState } from "../../store"; // หรือ path ที่เก็บ store
import { setDeck } from "../../store/slices/deckSlice";
import { useNavigate } from "react-router-dom";

function Home() {
  const dispatch = useDispatch();
  const player = useSelector((state: RootState) => state.player.player);
  const deck = useSelector((state: RootState) => state.deck.deck);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8080/api/user/1")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched player:", data);
        dispatch(setPlayer(data));
      })
      .catch(console.error);

    fetch("http://localhost:8080/api/user/1/deck")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched deck:", data);
        dispatch(setDeck(data));
      })
      .catch(console.error);
  }, [dispatch]);

  const handleClickPlayWithBot = () => {
    navigate("/bot-battle")
  }

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
    </div>
  );
}
export default Home