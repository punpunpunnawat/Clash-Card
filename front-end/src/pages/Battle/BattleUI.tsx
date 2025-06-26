// components/BattleUI.tsx
import React from "react";

import type {
	AnimationState,
	BattleRefs,
	CardCount,
	CardRemaining,
	PlayerDetail,
} from "../../types/Battle";
import type { CardProps } from "../../types/Card";
import ClassSkillOverlay from "../../components/ClassSkillOverlay";
import Card from "../../components/Card";
import PlayerStatus from "../../components/PlayerStatus";
import "./css/CardAttack.css";

interface BattleUIProps {
	gameState: string;
	refs: BattleRefs;
	uiState: {
		hideCard: boolean;
		hidePlayerCard: boolean;
		showTrueSightAlert: boolean;
		trueSightResult: CardCount | null;
		showClassSkill: boolean;
	};
	animationState: AnimationState;
	playerHand: CardProps[];
	opponentHandSize: number;
	cardRemaining: CardRemaining;
	selectedPlayerCard: CardProps | null;
	selectedOpponentCard: CardProps | null;
	playerDetail: PlayerDetail & { currentHP: number };
	opponentDetail: PlayerDetail & { currentHP: number };
	onClickSelectCard: (cardID: string) => void;
	onClickTrueSight: () => void;
	setUiState: React.Dispatch<
		React.SetStateAction<{
			hideCard: boolean;
			hidePlayerCard: boolean;
			showTrueSightAlert: boolean;
			trueSightResult: CardCount | null;
			showClassSkill: boolean;
		}>
	>;
}

const BattleUI: React.FC<BattleUIProps> = ({
	gameState,
	refs,
	uiState,
	animationState,
	playerHand,
	opponentHandSize,
	cardRemaining,
	selectedPlayerCard,
	selectedOpponentCard,
	playerDetail,
	opponentDetail,
	onClickSelectCard,
	onClickTrueSight,
	setUiState,
}) => {
	const handleCardSelect = (cardID: string) => {
		onClickSelectCard?.(cardID);
	};

	const handleUseTrueSight = () => {
		onClickTrueSight?.();
	};

	return (
		<div className="battle">
			{/* Overlay true sight result */}
			{uiState.trueSightResult && (
				<div className="battle__overlay">
					<h2>Opponent hand's card</h2>
					<div className="battle__overlay_card">
						{Object.entries(uiState.trueSightResult).flatMap(
							([type, count]) =>
								Array.from({ length: count }).map((_, i) => (
									<Card
										id={`${type}-${i}`}
										type={
											type as
												| "rock"
												| "paper"
												| "scissors"
										}
									/>
								))
						)}
					</div>
				</div>
			)}

			{uiState.showTrueSightAlert && (
				<div className="battle__overlay">
					<h2>Opponent use True Sight and know your hand's card</h2>
					<img src="/cards/TrueSightCard.svg" />
				</div>
			)}

			{uiState.showClassSkill && (
				<ClassSkillOverlay
					onClickClose={() =>
						setUiState((prev) => ({
							...prev,
							showClassSkill: false,
						}))
					}
				/>
			)}

			{/* Player Hand */}
			<div className="battle__player_hand" ref={refs.player.hand}>
				{playerHand.map((card, index) => {
					const total = playerHand.length;
					const angleStep = 10;
					const mid = (total - 1) / 2;
					const angle = (index - mid) * angleStep;
					const xOffset = (index - mid) * -30;
					const yOffset = Math.abs(index - mid) * 20;
					const transform = `rotate(${angle}deg) translate(${xOffset}px, ${yOffset}px)`;
					return (
						<div
							key={card.id}
							style={{
								transform,
								transition: "transform 0.5s ease",
							}}
						>
							<div className="card-wrapper">
								<Card
									id={card.id}
									type={card.type}
									onClick={() => handleCardSelect(card.id)}
								/>
							</div>
						</div>
					);
				})}
			</div>

			{/* Player Status */}
			<div className="battle__player_status">
				<PlayerStatus
					level={playerDetail.level}
					playerClass={playerDetail.class}
					currentHP={playerDetail.currentHP}
					stat={playerDetail.stat}
					cardRemaining={cardRemaining.player}
					trueSight={playerDetail.trueSight}
					onClickPassive={() => handleUseTrueSight()}
				/>
			</div>

			{/* Player Deck */}
			<div className="battle__player_deck" ref={refs.player.deck}>
				{cardRemaining.player.rock +
					cardRemaining.player.paper +
					cardRemaining.player.scissors >
				3 ? (
					<img src="/cards/BackOfCard.svg" width={150} height={250} />
				) : (
					<div style={{ width: 150, height: 250 }} />
				)}
			</div>

			{/* Player Drawing Card */}
			{animationState.player.drawingCard && (
				<div style={animationState.player.drawStyle}>
					<Card
						id={animationState.player.drawingCard.id}
						type={animationState.player.drawingCard.type}
					/>
				</div>
			)}

			<div className="battle__board">
				<div
					className="battle__board_card-placers"
					ref={refs.player.cardPlacer}
				>
					<div className="battle__board_card-placer player">
						<img src="/cards/CardPlacer-Player.svg" />
					</div>

					<div
						className="battle__board_card-placer opponent"
						ref={refs.opponent.cardPlacer}
					>
						<img src="/cards/CardPlacer-Opponent.svg" />
					</div>
				</div>

				<div className="battle__board_card-selected">
					{selectedPlayerCard ? (
						<div
							onMouseEnter={() =>
								gameState === "CARD_SELECTED" &&
								setUiState((prev) => ({
									...prev,
									hidePlayerCard: false,
								}))
							}
							onMouseLeave={() =>
								setUiState((prev) => ({
									...prev,
									hidePlayerCard: true,
								}))
							}
						>
							<Card
								type={selectedPlayerCard.type}
								id={selectedPlayerCard.id}
								isHidden={
									uiState.hideCard && uiState.hidePlayerCard
								}
								className={`${animationState.player.battleAnimation}`}
							/>
						</div>
					) : (
						<div style={{ visibility: "hidden" }}>
							<Card id={"temp"} type={"hidden"} isHidden />
						</div>
					)}
					{selectedOpponentCard ? (
						<div className="battle__board_card-placer_selected-card">
							<Card
								type={selectedOpponentCard.type}
								id={selectedOpponentCard.id}
								isHidden={uiState.hideCard}
								className={`${animationState.opponent.battleAnimation}`}
							/>
						</div>
					) : (
						<div style={{ visibility: "hidden" }}>
							<Card id={"temp"} type={"hidden"} isHidden />
						</div>
					)}
				</div>
			</div>

			{/* Animations */}
			{animationState.player.selectingCard && (
				<div style={animationState.player.selectStyle}>
					<Card id={"temp"} type={"hidden"} isHidden />
				</div>
			)}
			{animationState.opponent.selectingCard && (
				<div style={animationState.opponent.selectStyle}>
					<Card id={"temp"} type={"hidden"} isHidden />
				</div>
			)}

			{/* Opponent Status */}
			<div className="battle__opponent_status">
				<PlayerStatus
					level={opponentDetail.level}
					playerClass={opponentDetail.class}
					currentHP={opponentDetail.currentHP}
					stat={opponentDetail.stat}
					cardRemaining={cardRemaining.opponent}
					trueSight={opponentDetail.trueSight}
				/>
			</div>

			{/* Opponent Deck */}
			<div className="battle__opponent_deck" ref={refs.opponent.deck}>
				{cardRemaining.opponent.rock +
					cardRemaining.opponent.paper +
					cardRemaining.opponent.scissors >
				3 ? (
					<img src="/cards/BackOfCard.svg" width={150} height={250} />
				) : (
					<div style={{ width: 150, height: 250 }} />
				)}
			</div>

			{/* Opponent Hand */}
			<div className="battle__opponent_hand" ref={refs.opponent.hand}>
				{Array.from({ length: opponentHandSize }).map((_, index) => {
					const total = opponentHandSize;
					const angleStep = 10;
					const mid = (total - 1) / 2;
					const angle = -(index - mid) * angleStep;
					const xOffset = (index - mid) * -30;
					const yOffset = Math.abs(index - mid) * -20;
					const transform = `rotate(${angle}deg) translate(${xOffset}px, ${yOffset}px)`;

					return (
						<div
							key={`opponent-card-${index}`}
							style={{
								transform,
								transition: "transform 0.5s ease",
							}}
						>
							<div
								className="card-wrapper"
								style={{ transform: "scaleY(-1)" }}
							>
								<Card id={"none"} type="hidden" isHidden />
							</div>
						</div>
					);
				})}
			</div>

			{/* Opponent Drawing Card */}
			{animationState.opponent.drawingCard && (
				<div style={animationState.opponent.drawStyle}>
					<Card
						id={animationState.opponent.drawingCard.id}
						type={animationState.opponent.drawingCard.type}
						isHidden
					/>
				</div>
			)}
		</div>
	);
};

export default BattleUI;
