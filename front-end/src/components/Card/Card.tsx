import type { CardProps } from "../../types/Card"; // ปรับ path ตามจริง
import "./Card.css";
const Card = (
	props: CardProps & { isHidden?: boolean } & { className?: string }
) => {
	const { id, type, onClick, isHidden = false, className = "" } = props;

	const handleOnClick = () => {
		onClick?.(id);
	};

  const getCardImage = (type: string) => {
    const capitalized = type.charAt(0).toUpperCase() + type.slice(1);
    return `/cards/${capitalized}Card.svg`;
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
						<img
							src={getCardImage(type)}
							width={150}
							height={250}
						/>
				</div>
			</div>
		</div>
	);
};

export default Card;
