import { sfx } from "../managers/soundManager";
import type { AnimationState, BattleRefs, RoundResult } from "../types/Battle";
import type { CardProps } from "../types/Card";

export function useBattle(
	playerHand: CardProps[],
	setPlayerHand: React.Dispatch<React.SetStateAction<CardProps[]>>,
	setOpponentHandSize: React.Dispatch<React.SetStateAction<number>>,
	setAnimationState: React.Dispatch<React.SetStateAction<AnimationState>>,
	setSelectedPlayerCard: React.Dispatch<
		React.SetStateAction<CardProps | null>
	>,
	setSelectedOpponentCard: React.Dispatch<
		React.SetStateAction<CardProps | null>
	>,
	roundResult: RoundResult | null,
	refs: BattleRefs
) {
	const findNewCard = (updatedCard: CardProps[]) => {
		const currentIds = playerHand.map((card) => card.id);
		const filteredNewCards = updatedCard.filter(
			(card) => !currentIds.includes(card.id)
		);
		const newCard = filteredNewCards[0];
		return newCard;
	};

	const cardSelect = (side: "player" | "opponent", cardID: string) => {
		const isPlayer = side === "player";

		const handRef = isPlayer ? refs.player.hand : refs.opponent.hand;
		const placerRef = isPlayer
			? refs.player.cardPlacer
			: refs.opponent.cardPlacer;

		const hand = handRef.current;
		const cardPlacer = placerRef.current;
		if (!hand || !cardPlacer) return;

		const handRect = hand.getBoundingClientRect();
		const cardPlacerRect = cardPlacer.getBoundingClientRect();

		if (isPlayer) {
			setAnimationState((prev) => ({
				...prev,
				player: { ...prev.player, selectingCard: true },
			}));
			setPlayerHand((prev) => prev.filter((card) => card.id !== cardID));
		} else {
			setAnimationState((prev) => ({
				...prev,
				opponent: { ...prev.opponent, selectingCard: true },
			}));
			setOpponentHandSize((prev) => prev - 1);
		}

		sfx.card.play();

		const setSelectStyle = (style: React.CSSProperties) => {
			setAnimationState((prev) => ({
				...prev,
				[side]: { ...prev[side], selectStyle: style },
			}));
		};

		const setSelectedCard = (card: CardProps | null) => {
			if (isPlayer) setSelectedPlayerCard(card);
			else setSelectedOpponentCard(card);
		};

		const clearSelecting = () => {
			setAnimationState((prev) => ({
				...prev,
				[side]: { ...prev[side], selectingCard: false },
			}));
		};

		setSelectStyle({
			position: "fixed",
			left: handRect.left + handRect.width / 3,
			top: handRect.top,
			width: handRect.width,
			height: handRect.height,
			transition: "all 0.5s ease",
			zIndex: 1000,
		});

		setTimeout(() => {
			setSelectStyle({
				position: "fixed",
				left: cardPlacerRect.left + 10,
				top: cardPlacerRect.top + 10,
				width: handRect.width,
				height: handRect.height,
				transition: "all 0.5s ease",
				zIndex: 1000,
			});
		}, 50);

		setTimeout(() => {
			if (isPlayer) {
				const selected = playerHand.find((card) => card.id === cardID);
				setSelectedCard(selected ?? null);
			} else {
				setSelectedCard({ id: "temp", type: "hidden" });
			}
			clearSelecting();
		}, 500);
	};

	const drawCard = (side: "player" | "opponent", newCard: CardProps) => {
		const isPlayer = side === "player";

		const deck = isPlayer
			? refs.player.deck.current
			: refs.opponent.deck.current;
		const hand = isPlayer
			? refs.player.hand.current
			: refs.opponent.hand.current;
		if (!deck || !hand) return;

		const deckRect = deck.getBoundingClientRect();
		const handRect = hand.getBoundingClientRect();

		if (isPlayer) {
			setAnimationState((prev) => ({
				...prev,
				player: { ...prev.player, drawingCard: newCard },
			}));
		} else {
			setAnimationState((prev) => ({
				...prev,
				opponent: {
					...prev.opponent,
					drawingCard: { id: "hidden", type: "hidden" },
				},
			}));
		}

		sfx.card.play();

		const setDrawStyle = (style: React.CSSProperties) => {
			setAnimationState((prev) => ({
				...prev,
				[side]: { ...prev[side], drawStyle: style },
			}));
		};

		setDrawStyle({
			position: "fixed",
			left: deckRect.left,
			top: deckRect.top,
			width: deckRect.width,
			height: deckRect.height,
			transition: "all 0.5s ease",
			zIndex: 1000,
		});

		setTimeout(() => {
			setDrawStyle({
				position: "fixed",
				left: handRect.left + handRect.width - deckRect.width / 2,
				top: handRect.top + handRect.height / 2 - deckRect.height / 2,
				width: deckRect.width,
				height: deckRect.height,
				transition: "all 0.5s ease",
				zIndex: 1000,
			});
		}, 50);

		setTimeout(() => {
			if (isPlayer) {
				setPlayerHand(roundResult?.player.hand ?? []);
				console.log(
					"✅ หลังจั่ว - playerHand ถูกเซ็ต:",
					roundResult?.player.hand
				);
			} else {
				setOpponentHandSize(roundResult?.opponent.handLength ?? 0);
				console.log(
					"✅ หลังจั่ว - opponentHandSize ถูกเซ็ต:",
					roundResult?.opponent.handLength
				);
			}

			// clear draw animation
			setAnimationState((prev) => ({
				...prev,
				[side]: { ...prev[side], drawingCard: null },
			}));
		}, 500);
	};

	return {
		cardSelect,
		drawCard,
		findNewCard,
	};
}
