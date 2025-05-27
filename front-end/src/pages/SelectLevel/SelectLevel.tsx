import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { fetchPlayer } from "../../store/slices/playerSlice";

const SelectLevel = () => {
  const dispatch: AppDispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchPlayer());
    //dispatch(fetchDeck(1));
  }, [dispatch]);
  const navigate = useNavigate();


  const player = useSelector((state: RootState) => state.player.player);
  console.log(player)

  const handleSelectLevel = (levelId: number) => {
    navigate(`/bot-battle/${levelId}`);
  };
  return (
    <div>
      Campaign Level Select
      {player &&
        Array.from({ length: player.currentCampaignLevel }).map((_, index) => {
          return (
            <button onClick={() => handleSelectLevel(index + 1)}>
              Level {index + 1}
            </button>
          );
        })}
    </div>
  );
};
export default SelectLevel;
