import type { CardProps } from "../../types/Card"; // ปรับ path ตามจริง
import "./Card.css";
const Card = (
  props: CardProps & { isHidden?: boolean } & { className?: string }
) => {
  const { id, type, onClick, isHidden = false, className = "" } = props;

  const handleOnClick = () => {
    onClick?.(id);
  };

  return (
    <div
      className={`Card ${isHidden ? "isHidden" : ""} ${className}`}
      onClick={handleOnClick}
    >
      <div className="Card__inner">
        
        <div className="Card__back">
          <img src="/cards/BackOfCard.svg" width={150} height={250} />
        </div>
        <div className="Card__front">
          {type == "rock" ? (
            <img src="/cards/RockCard.svg" width={150} height={250} />
          ) : type == "paper" ? (
            <img src="/cards/PaperCard.svg" width={150} height={250} />
          ) : (
            type == "scissors" && (
              <img src="/cards/ScissorsCard.svg" width={150} height={250} />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;
