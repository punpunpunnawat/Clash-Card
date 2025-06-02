import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { CardProps } from "../../types/Card";
import Card from "./../../components/Card/Card";
import HealthBar from "../../components/HealthBar";
import "./css/PvP.css";
import "./css/CardAttack.css";
import type {
	CardRemaining,
	PlayerDetail,
	RoundResult,
	ServerMessage,
} from "../../types/Pvp";
import Pill from "../../components/Pill";
const Lobby = () => {
	const { id: roomID } = useParams();
	const ws = useRef<WebSocket | null>(null);
	const [opponentHandSize, setOpponentHandSize] = useState<number>(0);

	const [selectedPlayerCard, setSelectedPlayerCard] =
		useState<CardProps | null>(null);
	const [selectedOpponentCard, setSelectedOpponentCard] =
		useState<CardProps | null>(null);
	const [playerHand, setPlayerHand] = useState<CardProps[]>([]);

	const [currentPlayerHP, setCurrentPlayerHP] = useState(0);
	const [currentOpponentHP, setCurrentOpponentHP] = useState(0);

	const [playerDetail, setPlayerDetail] = useState<PlayerDetail>({
		name: "player",
		level: 0,
		stat: { atk: 0, def: 0, spd: 0, hp: 0 },
	});
	const [opponentDetail, setOpponentDetail] = useState<PlayerDetail>({
		name: "enemy",
		level: 0,
		stat: { atk: 0, def: 0, spd: 0, hp: 0 },
	});

	const [winner, setWinner] = useState("");

	const [roundResult, setRoundResult] = useState<RoundResult | null>(null);

	//Animated
	const [hideCard, setHideCard] = useState(true);
	const [hidePlayerCard, setHidePlayerCard] = useState(true);
	//Animate
	const [animatingPlayerCard, setAnimatingPlayerCard] =
		useState<CardProps | null>(null);
	const [animatingOpponentCard, setAnimatingOpponentCard] =
		useState<CardProps | null>(null);
	const [playerDrawStyle, setPlayerDrawStyle] = useState<React.CSSProperties>(
		{}
	);
	const [enemyDrawStyle, setEnemyDrawStyle] = useState<React.CSSProperties>(
		{}
	);
	const [cardRemaining, setCardRemaining] = useState<CardRemaining>({
		player: { rock: 0, paper: 0, scissors: 0 },
		opponent: { rock: 0, paper: 0, scissors: 0 },
	});

	const playerDeckRef = useRef<HTMLDivElement>(null);
	const playerHandRef = useRef<HTMLDivElement>(null);
	const enemyDeckRef = useRef<HTMLDivElement>(null);
	const enemyHandRef = useRef<HTMLDivElement>(null);

	//GAME STATE
	type GameState =
		| "WAIT_OPPONENT"
		| "SELECT_CARD"
		| "CARD_SELECTED"
		| "BOTH_SELECTED"
		| "SHOW_RESULT"
		| "DO_DAMAGE"
		| "DRAW_CARD"
		| "GAME_END_WIN"
		| "GAME_END_LOSE";
	const [gameState, setGameState] = useState<GameState>("WAIT_OPPONENT");

	//CARD FUNC
	const findNewCard = (updatedCard: CardProps[]) => {
		const currentIds = playerHand.map((card) => card.id);
		const filteredNewCards = updatedCard.filter(
			(card) => !currentIds.includes(card.id)
		);
		const newCard = filteredNewCards[0];
		return newCard;
	};

	const drawPlayerCard = (newCard: CardProps) => {
		const deck = playerDeckRef.current;
		const hand = playerHandRef.current;
		if (!deck || !hand) return;
		const deckRect = deck.getBoundingClientRect();
		const handRect = hand.getBoundingClientRect();

		setAnimatingPlayerCard(newCard);

		// start at deck
		setPlayerDrawStyle({
			position: "fixed",
			left: deckRect.left,
			top: deckRect.top,
			width: deckRect.width,
			height: deckRect.height,
			transition: "all 0.5s ease",
			zIndex: 1000,
		});

		// trigger animation in next tick
		setTimeout(() => {
			setPlayerDrawStyle((prev) => ({
				...prev,
				left: handRect.left + handRect.width - deckRect.width / 2,
				top: handRect.top + handRect.height / 2 - deckRect.height / 2,
			}));
		}, 50);

		// after animation ends
		setTimeout(() => {
			setPlayerHand((prev) => [...prev, newCard]); // actual add
			setAnimatingPlayerCard(null); // remove floating card
		}, 600); // slightly longer than transition
	};

	const drawOpponentCard = () => {
		const deck = enemyDeckRef.current;
		const hand = enemyHandRef.current;
		if (!deck || !hand) return;
		const deckRect = deck.getBoundingClientRect();
		const handRect = hand.getBoundingClientRect();
		setAnimatingOpponentCard({ id: "temp", type: "hidden" });
		// start at deck
		setEnemyDrawStyle({
			position: "fixed",
			left: deckRect.left,
			top: deckRect.top,
			width: deckRect.width,
			height: deckRect.height,
			transition: "all 0.5s ease",
			zIndex: 1000,
		});

		// trigger animation in next tick
		setTimeout(() => {
			setEnemyDrawStyle((prev) => ({
				...prev,
				left: handRect.left + handRect.width - deckRect.width / 2,
				top: handRect.top + handRect.height / 2 - deckRect.height / 2,
			}));
		}, 50);

		// after animation ends
		setTimeout(() => {
			setOpponentHandSize((prev) => prev + 1); // actual add
			setAnimatingOpponentCard(null); // remove floating card
		}, 600); // slightly longer than transition
	};

	useEffect(() => {
    console.log(roundResult)
		if (roundResult) {
			switch (gameState) {
				case "BOTH_SELECTED":
					setSelectedOpponentCard(roundResult.opponentPlayed);
					setGameState("SHOW_RESULT");
					break;
				case "SHOW_RESULT":
					setTimeout(() => {
						setHideCard(false);
						setTimeout(() => {
							setWinner(roundResult.roundWinner);
							setTimeout(() => {
								setHideCard(true);
								setWinner("");
								setSelectedPlayerCard(null);
								setSelectedOpponentCard(null);
								setGameState("DO_DAMAGE");
							}, 1000);
						}, 1000);
					}, 2000);
					break;

				case "DO_DAMAGE":
					if (roundResult) {
						setCurrentPlayerHP(Number(roundResult.hp.player));
						setCurrentOpponentHP(Number(roundResult.hp.opponent));
						if (roundResult.gameStatus === "playerWin") {
							setGameState("GAME_END_WIN");
						} else if (roundResult.gameStatus === "opponentWin") {
							setGameState("GAME_END_LOSE");
						} else setGameState("DRAW_CARD");
					}

					break;

				case "DRAW_CARD":
					drawPlayerCard(findNewCard(roundResult.playerHand));
					drawOpponentCard();
					setCardRemaining(roundResult.cardRemaining);
					setRoundResult(null);

					setGameState("SELECT_CARD");
					break;
				default:
					break;
			}
		}
	}, [gameState, roundResult]);

	useEffect(() => {
		if (!roomID) return;

		const token = localStorage.getItem("authToken")!;

		ws.current = new WebSocket(
			`ws://localhost:8080/ws/pvp?room=${roomID}`,
			[token]
		);

		//ws.current.onopen = () => setMessages((m) => [...m, "🟢 Connected"]);
		ws.current.onmessage = (e) => {
			//setMessages((m) => [...m, `📨 ${e.data}`]);

			try {
				const msg = JSON.parse(e.data) as ServerMessage;

				switch (msg.type) {
					case "slot_assigned":
						//setPlayerSlot(msg.slot);
						break;

					case "initialData":
						//set hand
						setPlayerHand(msg.player.hand);
						setOpponentHandSize(msg.opponent.handSize);

						//setCardRemaining
						setCardRemaining({
							player: msg.player.cardRemaining,
							opponent: msg.opponent.cardRemaining,
						});

						//set Stat
						setPlayerDetail({
							name: msg.player.name,
							level: msg.player.level,
							stat: msg.player.stat,
						});
						setOpponentDetail({
							name: msg.opponent.name,
							level: msg.opponent.level,
							stat: msg.opponent.stat,
						});
						setCurrentPlayerHP(msg.player.currentHP);
						setCurrentOpponentHP(msg.opponent.currentHP);

						setGameState("SELECT_CARD");
						break;

					case "selection_status":
						if (msg.opponentSelected) {
							setSelectedOpponentCard({
								id: "enemy",
								type: "hidden",
							});
							setOpponentHandSize((prev) => prev - 1);
						}
						break;

					case "round_result":
						setRoundResult(msg);
						setGameState("BOTH_SELECTED");
						break;

					default:
						console.warn("⚠️ Unknown message type:", msg);
						break;
				}
			} catch (err) {
				console.error("Invalid message", err);
			}
		};

		ws.current.onclose = () => null;

		return () => ws.current?.close();
	}, [roomID]);

	const handleCardSelect = (cardID: string) => {
		if (gameState !== "SELECT_CARD") return;
		if (ws.current?.readyState !== WebSocket.OPEN) return;
		setPlayerHand((prevHand) =>
			prevHand.filter((card) => card.id !== cardID)
		);
		setSelectedPlayerCard(
			playerHand.find((card) => card.id === cardID) || null
		);

		ws.current.send(
			JSON.stringify({
				type: "selected_card",
				cardID: cardID,
			})
		);
		setGameState("CARD_SELECTED");
		// setMessages((m) => [...m, `📤 You selected: ${cardID}`]);
	};

	if (gameState === "WAIT_OPPONENT") return <div>waiting</div>;
	if (gameState === "GAME_END_WIN") return <div>win</div>;
	if (gameState === "GAME_END_LOSE") return <div>lose</div>;
	return (
		<div className="PvP">
			<div className="PvP__enemy-bar">
				<Pill
					label={opponentDetail.level + " : " + opponentDetail.name}
				/>

				<HealthBar
					currentHP={currentOpponentHP}
					maxHP={opponentDetail.stat.hp}
				/>
				<Pill
					label={`Rock ${
						cardRemaining.opponent.rock
							? cardRemaining.opponent.rock
							: 0
					}`}
					type="Rock"
				/>
				<Pill
					label={`Paper ${
						cardRemaining.opponent.paper
							? cardRemaining.opponent.paper
							: 0
					}`}
					type="Paper"
				/>
				<Pill
					label={`Scissors ${
						cardRemaining.opponent.scissors
							? cardRemaining.opponent.scissors
							: 0
					}`}
					type="Scissors"
				/>
			</div>
			<div className="PvP__board-player">
				<div
					style={{
						width: 150,
						height: 250,
						visibility: "hidden",
					}}
				/>
				<div className="hand" ref={playerHandRef}>
					{playerHand?.map((card, index) => {
						const total = playerHand.length;
						const angleStep = 10; // ค่าที่ควบคุมความเอียง
						const mid = (total - 1) / 2;
						const angle = (index - mid) * angleStep;
						const xOffset = (index - mid) * -30; // 👉 เพิ่มระยะห่างแนวนอน (ค่ามากขึ้น = ห่างขึ้น)
						const yOffset = Math.abs(index - mid) * 20; // ยิ่งห่างจากตรงกลาง ยิ่งต่ำลง
						const transform = `rotate(${angle}deg) translate(${xOffset}px, ${yOffset}px)`;
						return (
							<div
								key={card.id}
								style={{
									transform,
									transition: "transform 0.5s ease", // 👈 ใส่ transition ตรงนี้
								}}
							>
								<div className="card-wrapper">
									<Card
										id={card.id}
										type={card.type}
										onClick={handleCardSelect}
									/>
								</div>
							</div>
						);
					})}
				</div>
				<div
					className="PvP__card-layer_board-enemy_deck"
					ref={playerDeckRef}
				>
					<img src="/BackOfCard.svg" width={150} height={250} />
				</div>
				{animatingPlayerCard && (
					<div style={playerDrawStyle}>
						<Card
							id={animatingPlayerCard.id}
							type={animatingPlayerCard.type}
						/>
					</div>
				)}
			</div>

			<div className="PvP__board">
				<div className="PvP__board_card-placer">
					<img
						src="/CardPlacer-Player.svg"
						width={170}
						height={270}
					/>
					{selectedPlayerCard && (
						<div
							onMouseEnter={() =>
								gameState === "CARD_SELECTED" &&
								setHidePlayerCard(false)
							}
							onMouseLeave={() => setHidePlayerCard(true)}
						>
							<Card
								type={selectedPlayerCard.type}
								id={selectedPlayerCard.id}
								isHidden={hideCard && hidePlayerCard}
								className={
									winner === "player"
										? "card card-attack-right"
										: winner === "enemy"
										? "card card-fly-left"
										: "card"
								}
							/>
						</div>
					)}
				</div>

				<div className="PvP__board_card-placer">
					<img src="/CardPlacer-Enemy.svg" width={170} height={270} />
					{selectedOpponentCard && (
						<Card
							type={selectedOpponentCard.type}
							id={selectedOpponentCard.id}
							isHidden={hideCard}
							className={
								winner === "enemy"
									? "card card-attack-left"
									: winner === "player"
									? "card card-fly-right"
									: "card"
							}
						/>
					)}
				</div>
			</div>

			<div className="PvP__board-enemy">
				<div
					className="PvP__board-enemy_deck"
					ref={enemyDeckRef}
					style={{ transform: "scaleY(-1)" }}
				>
					<img src="/BackOfCard.svg" width={150} height={250} />
				</div>

				<div className="hand" ref={enemyHandRef}>
					{Array.from({ length: opponentHandSize }).map(
						(_, index) => {
							const total = opponentHandSize;
							const angleStep = 10; // ค่าที่ควบคุมความเอียง
							const mid = (total - 1) / 2;
							const angle = -(index - mid) * angleStep;
							const xOffset = (index - mid) * -30;
							const yOffset = Math.abs(index - mid) * -20;
							const transform = `rotate(${angle}deg) translate(${xOffset}px, ${yOffset}px)`;

							return (
								<div
									style={{
										transform,
										transition: "transform 0.5s ease",
									}}
								>
									<div
										className="card-wrapper"
										style={{ transform: "scaleY(-1)" }}
									>
										<Card
											id={"id here"}
											type="hidden" // เปลี่ยน type ได้ตามที่ต้องการ
											isHidden
										/>
									</div>
								</div>
							);
						}
					)}
				</div>

				<div
					style={{
						width: 150,
						height: 250,
						visibility: "hidden",
					}}
				/>
				{animatingOpponentCard && (
					<div style={enemyDrawStyle}>
						<Card
							id={animatingOpponentCard.id}
							type={animatingOpponentCard.type}
							isHidden
						/>
					</div>
				)}
			</div>
			<div className="PvP__player-bar">
				<Pill
					label={opponentDetail.level + " : " + opponentDetail.name}
				/>

				<HealthBar
					currentHP={currentPlayerHP}
					maxHP={playerDetail.stat.hp}
				/>
				<Pill
					label={`Rock ${
						cardRemaining.player.rock
							? cardRemaining.player.rock
							: 0
					}`}
					type="Rock"
				/>
				<Pill
					label={`Paper ${
						cardRemaining.player.paper
							? cardRemaining.player.paper
							: 0
					}`}
					type="Paper"
				/>
				<Pill
					label={`Scissors ${
						cardRemaining.player.scissors
							? cardRemaining.player.scissors
							: 0
					}`}
					type="Scissors"
				/>
			</div>
		</div>
	);
};

export default Lobby;
