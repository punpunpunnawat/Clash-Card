import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import NavBar from "../../components/NavBar";
import ErrorOverlay from "../../components/ErrorOverlay";
import ShopList from "../../components/ShopList";

import { fetchPlayer } from "../../store/slices/playerSlice";
import { fetchDeck } from "../../store/slices/deckSlice";

import type { AppDispatch, RootState } from "../../store";

import { buyCard, changeClass, upgradeStat } from "../../api/api";

import "./Upgrade.css";

const Upgrade = () => {
	const dispatch: AppDispatch = useDispatch();
	const player = useSelector((state: RootState) => state.player);
	const deck = useSelector((state: RootState) => state.deck);

	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		dispatch(fetchPlayer());
		dispatch(fetchDeck());
	}, [dispatch]);

	const updatePlayerData = async () => {
		await dispatch(fetchPlayer());
	};
	const updateDeckData = async () => {
		await dispatch(fetchDeck());
		await dispatch(fetchPlayer());
	};

	const handleClickChangeClass = async (newClass: string) => {
		const token = localStorage.getItem("authToken") || "";
		try {
			await changeClass(newClass, token);
			await updatePlayerData();
		} catch (err) {
			setErrorMessage(
				err instanceof Error ? err.message : "Unknown error"
			);
		}
	};

	const handleClickUpgradeStat = async (statType: string) => {
		const token = localStorage.getItem("authToken") || "";
		try {
			await upgradeStat(statType, token);
			await updatePlayerData();
		} catch (err) {
			setErrorMessage(
				err instanceof Error ? err.message : "Unknown error"
			);
		}
	};

	const handleClickBuyCard = async (cardType: string) => {
		const token = localStorage.getItem("authToken") || "";
		try {
			await buyCard(cardType, token);
			await updateDeckData();
		} catch (err) {
			setErrorMessage(
				err instanceof Error ? err.message : "Unknown error"
			);
		}
	};

	return (
		<div className="upgrade">
			<NavBar backPath="/" />

			<div className="upgrade__body">
				<h1 style={{ fontWeight: "normal" }}>Upgrade and buy card</h1>

				<div className="upgrade__body_class-card">
					{["warrior", "mage", "assassin"].map((cls) =>
						player?.class === cls ? (
							<div
								key={cls}
								className={`upgrade__body_class-card_${cls}`}
							>
								<label style={{ fontSize: 24 }}>
									{cls[0].toUpperCase() + cls.slice(1)}
								</label>
								<img
									src={`cards/${
										cls[0].toUpperCase() + cls.slice(1)
									}Card.svg`}
								/>
								<button style={{ width: "100%" }} disabled>
									Active
								</button>
							</div>
						) : (
							<div
								key={cls}
								className={`upgrade__body_class-card_${cls}`}
							>
								<label style={{ fontSize: 24 }}>
									{cls[0].toUpperCase() + cls.slice(1)}
								</label>
								<img
									src={`cards/${
										cls[0].toUpperCase() + cls.slice(1)
									}Card.svg`}
									style={{ opacity: 0.5 }}
								/>
								<button
									style={{ width: "100%" }}
									onClick={() => handleClickChangeClass(cls)}
									disabled={player.gold < 1000}
								>
									1000 G
								</button>
							</div>
						)
					)}
				</div>

				<div className="select-class__body_detail">
					{/* Skill */}
					<div className="select-class__body_detail_skill">
						<h4>Skill</h4>
						<div className="select-class__body_detail_skill_explain">
							<span>
								{player.class === "warrior"
									? "When drawing with Rock, deal half of your damage. (always hit)"
									: player.class === "mage"
									? "When winning with Paper, gain 1 True Sight token. Use to reveal opponent's hand."
									: "When winning with Scissors, ignore the opponent’s defense. (always hit)"}
							</span>
						</div>
					</div>

					{/* Stat */}
					<div className="select-class__body_detail_stat">
						<h4>Stat</h4>
						<div className="select-class__body_detail_stat_quantity">
							{(["atk", "def", "spd", "hp"] as const).map(
								(stat) => (
									<ShopList
										key={stat}
										type="stat"
										title={stat.toUpperCase()}
										curQuantity={player.stat[stat]}
										cost={1}
										playerBalance={player.statPoint}
										onClick={() =>
											handleClickUpgradeStat(stat)
										}
									/>
								)
							)}
						</div>
					</div>

					{/* Deck */}
					<div className="select-class__body_detail_card">
						<h4>Deck</h4>
						<div className="select-class__body_detail_card_quantity">
							{(["rock", "paper", "scissors"] as const).map((card) => (
								<ShopList
									key={card}
									type="card"
									title={`${
										card[0].toUpperCase() + card.slice(1)
									} Card`}
									curQuantity={deck[card]}
									cost={500}
									playerBalance={player.gold}
									onClick={() => handleClickBuyCard(card)}
								/>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Error Overlay */}
			{errorMessage && (
				<ErrorOverlay
					message={errorMessage}
					onClose={() => setErrorMessage(null)}
				/>
			)}
		</div>
	);
};

export default Upgrade;
