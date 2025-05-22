import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { useNavigate } from "react-router-dom";

const SelectLevel = () => {
      const navigate = useNavigate();

  const player = useSelector((state: RootState) => state.player.player);
  const handleSelectLevel = (levelId: number) => {
    navigate(`/bot-battle/${levelId}`);
  };
  return (
    <div>
      Campaign Level Select
      {player &&
        Array.from({ length: player.currentCampaignLevel }).map((_, index) => {
          return <button onClick={() => handleSelectLevel(index+1)}>Level {index + 1}</button>;
        })}
    </div>
  );
};
export default SelectLevel;
