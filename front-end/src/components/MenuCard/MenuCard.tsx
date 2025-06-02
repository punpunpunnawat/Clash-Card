import { useState } from "react";
import './MenuCard.css'
type MenuCardProps = {
  type: "Campaign" | "PvP" | "Upgrade";
  onClick?: () => void;
};

const MenuCard = ({
  onClick = () => null,
  type,
}: MenuCardProps) => {
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);
  const handleOnClick = () => onClick?.();

  return (
    <div
      className={`MenuCard ${isHovering ? "isHovering" : ""}`}
      onClick={handleOnClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="MenuCard__inner">
        <div className="MenuCard__back">
          {type === "Campaign" && <img src="/CampaignCard2.svg"/>}
          {type === "PvP" && <img src="/PVPCard2.svg"/>}
          {type === "Upgrade" && <img src="/UpgradeCard2.svg"/>}
        </div>
        <div className="MenuCard__front">
          {type === "Campaign" && <img src="/CampaignCard.svg"/>}
          {type === "PvP" && <img src="/PVPCard.svg"/>}
          {type === "Upgrade" && <img src="/UpgradeCard.svg"/>}
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
