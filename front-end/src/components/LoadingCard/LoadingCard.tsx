import { useEffect, useState } from "react";
import "./LoadingCard.css";

const LoadingCard = () => {
	const [rotation, setRotation] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setRotation(prev => prev + 180);
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	return (
		<div className="LoadingCard">
			<div
				className="LoadingCard__inner"
				style={{ transform: `rotateY(${rotation}deg)` }}
			>
				<div className="LoadingCard__back">
					<img src="/BackOfCard.svg" width={150} height={250} />
				</div>
				<div className="LoadingCard__front">
					<img src="/LoadingCard.svg" width={150} height={250} />
				</div>
			</div>
		</div>
	);
};

export default LoadingCard;
