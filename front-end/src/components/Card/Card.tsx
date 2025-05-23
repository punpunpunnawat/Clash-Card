// src/components/Card/index.tsx (หรือที่คุณใช้)

import type { CardProps } from "../../types/Card"; // ปรับ path ตามจริง
import "./Card.css";
const Card = (props: CardProps & { flipped?: boolean } & { className?: string}) => {
  const { id, type, onClick, flipped = false, className="" } = props;

  const handleOnClick = () => {
    onClick?.(id);
  };

  return (
    <div
      className={`Card ${!flipped ? "flipped" : ""} ${className}`}

      onClick={handleOnClick}
    >
      <div className="Card__inner">
        <div className="Card__front">
          <img src='/BackOfCard.svg' width={150} height={250} />
        </div>
        <div className="Card__back">
          {type == "rock" ? <img src='/RockCard.svg' width={150} height={250} /> :
           type == "paper" ? <img src='/PaperCard.svg' width={150} height={250} /> :
           type == "scissors" && <img src='/ScissorsCard.svg' width={150} height={250} />}
        </div>
      </div>
    </div>
  );
};

export default Card;
