
import "./ShopList.css"

type ShopListProps = {
    type: "stat"|"card",
    title: string,
    curQuantity: number,
    cost: number,
    playerBalance: number,
    onClick: () => void;
}

const ShopList = ( {type, title, curQuantity, cost, playerBalance, onClick }:ShopListProps ) => {

    const handleClick = () => {
        onClick?.();
    }
	return (
		<div className="shop-list">
			<span
				style={{
					fontSize: 16,
					width: type === "stat" ? 48 : type === "card" ? 128 : 0,
					textAlign: "start",
				}}
			>
				{title}
			</span>
			<span className="number-box" style={{ width: 16 }}>
				{curQuantity}
			</span>
			<button
				onClick={handleClick}
				disabled={playerBalance < cost}
			>
				{cost} {type === "stat" ? "P" : type === "card" && "G"}
			</button>
		</div>
	);
};

export default ShopList
