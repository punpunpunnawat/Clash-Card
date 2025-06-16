import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { CardProps } from "../../types/Card";
import Card from "./../../components/Card/Card";
import "./css/PvP.css";
import "./css/CardAttack.css";
import type {
	CardRemaining,
	PlayerDetail,
	PostGameDetail,
	RoundResult,
	ServerMessage,
} from "../../types/Pvp";
import NavBar from "../../components/NavBar";
import LoadingCard from "../../components/LoadingCard";
import PlayerStatus from "../../components/PlayerStatus";

const Lobby = () => {
	const { id: roomID } = useParams();
	const navigate = useNavigate();
	const ws = useRef<WebSocket | null>(null);

	//Player and Opponent Selected Card
	const [selectedPlayerCard, setSelectedPlayerCard] =
		useState<CardProps | null>(null);
	const [selectedOpponentCard, setSelectedOpponentCard] =
		useState<CardProps | null>(null);

	//Player and Opponent hand
	const [playerHand, setPlayerHand] = useState<CardProps[]>([]);
	const [opponentHandSize, setOpponentHandSize] = useState<number>(0);

	//Player and Opponent current HP
	const [currentPlayerHP, setCurrentPlayerHP] = useState(0);
	const [currentOpponentHP, setCurrentOpponentHP] = useState(0);

	//Player and Opponent current stat
	const [playerDetail, setPlayerDetail] = useState<PlayerDetail>({
		name: "player",
		level: 0,
		stat: { atk: 0, def: 0, spd: 0, hp: 0 },
		class: "none",
		trueSight: 0,
	});
	const [opponentDetail, setOpponentDetail] = useState<PlayerDetail>({
		name: "opponent",
		level: 0,
		stat: { atk: 0, def: 0, spd: 0, hp: 0 },
		class: "none",
		trueSight: 0,
	});

	//match data
	const [winner, setWinner] = useState("");
	const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
	const [cardRemaining, setCardRemaining] = useState<CardRemaining>({
		player: { rock: 0, paper: 0, scissors: 0 },
		opponent: { rock: 0, paper: 0, scissors: 0 },
	});
	const [postGameDetail, setPostGameDetail] = useState<PostGameDetail | null>(
		null
	);

	//hide card bool
	const [hideCard, setHideCard] = useState(true);
	const [hidePlayerCard, setHidePlayerCard] = useState(true);

	//Animate
	const [playerDrawingCard, setPlayerDrawingCard] =
		useState<CardProps | null>(null);
	const [opponentDrawingCard, setOpponentDrawingCard] =
		useState<CardProps | null>(null);
	const [playerDrawStyle, setPlayerDrawStyle] = useState<React.CSSProperties>(
		{}
	);
	const [opponentDrawStyle, setOpponentDrawStyle] =
		useState<React.CSSProperties>({});
	const [playerSelectingCard, setPlayerSelectingCard] = useState(false);
	const [playerSelectStyle, setPlayerSelectStyle] =
		useState<React.CSSProperties>({});

	const [opponentSelectingCard, setOpponentSelectingCard] = useState(false);
	const [opponentSelectStyle, setOpponentSelectStyle] =
		useState<React.CSSProperties>({});
	const [showPlayerDamage, setShowPlayerDamage] = useState(false);
	const [showOpponentDamage, setShowOpponentDamage] = useState(false);

	//overlay
	const [toggleOverlay, setToggleOverlay] = useState(false);
	const [eventMessage, setEventMessage] = useState("");

	//Ref
	const playerDeckRef = useRef<HTMLDivElement>(null);
	const playerHandRef = useRef<HTMLDivElement>(null);
	const playerCardPlacerRef = useRef<HTMLDivElement>(null);
	const opponentDeckRef = useRef<HTMLDivElement>(null);
	const opponentHandRef = useRef<HTMLDivElement>(null);
	const opponentCardPlacerRef = useRef<HTMLDivElement>(null);

	//GAME STATE
	type GameState =
		| "WAIT_OPPONENT"
		| "SELECT_CARD"
		| "CARD_SELECTED"
		| "BOTH_SELECTED"
		| "SHOW_RESULT"
		| "DO_DAMAGE"
		| "DRAW_CARD"
		| "END";
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

		setPlayerDrawingCard(newCard);

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
			setPlayerHand(roundResult?.player.hand ?? []);
			setPlayerDrawingCard(null); // remove floating card
		}, 500); // slightly longer than transition
	};

	//Gamestate and round_result handler
	useEffect(() => {
		console.log(roundResult);
		console.log(gameState);
		if (roundResult) {
			switch (gameState) {
				case "BOTH_SELECTED":
					setSelectedOpponentCard(roundResult.opponent.cardPlayed);
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
						setShowPlayerDamage(true);
						setShowOpponentDamage(true);
						setCurrentPlayerHP(Number(roundResult.player.hp));
						setCurrentOpponentHP(Number(roundResult.opponent.hp));
						setPlayerDetail((prev) => ({
							...prev,
							trueSight: roundResult.player.trueSight,
						}));
						setOpponentDetail((prev) => ({
							...prev,
							trueSight: roundResult.opponent.trueSight,
						}));
						if (
							roundResult.gameStatus === "playerWin" ||
							roundResult.gameStatus === "opponentWin"
						) {
							setGameState("END");
							setPostGameDetail(roundResult.postGameDetail);
						} else setGameState("DRAW_CARD");
					}

					break;

				case "DRAW_CARD":
					setCardRemaining({
						player: roundResult.player.cardRemaining,
						opponent: roundResult.opponent.cardRemaining,
					});

					if (
						cardRemaining.player.rock +
							cardRemaining.player.paper +
							cardRemaining.player.scissors >
						3
					)
						drawPlayerCard(findNewCard(roundResult.player.hand));
					if (
						cardRemaining.opponent.rock +
							cardRemaining.opponent.paper +
							cardRemaining.opponent.scissors >
						3
					)
						drawOpponentCard();

					setRoundResult(null);

					setGameState("SELECT_CARD");
					break;
				default:
					break;
			}
		}
	}, [gameState, roundResult]);

	//Web socket message handler
	useEffect(() => {
		if (!roomID) return;

		const token = localStorage.getItem("authToken")!;

		ws.current = new WebSocket(
			`ws://localhost:8080/ws/pvp?room=${roomID}`,
			[token]
		);
		ws.current.onmessage = (e) => {
			try {
				const msg = JSON.parse(e.data) as ServerMessage;
				console.log(msg);
				switch (msg.type) {
					case "slot_assigned":
						//setPlayerSlot(msg.slot);
						break;

					case "initialData":
						console.log(msg);
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
							class: msg.player.class,
							trueSight: 0,
						});
						setOpponentDetail({
							name: msg.opponent.name,
							level: msg.opponent.level,
							stat: msg.opponent.stat,
							class: msg.opponent.class,
							trueSight: 0,
						});
						setCurrentPlayerHP(msg.player.currentHP);
						setCurrentOpponentHP(msg.opponent.currentHP);
						setGameState("SELECT_CARD");
						break;

					case "selection_status":
						if (msg.opponentSelected) {
							const hand = opponentHandRef.current;
							const cardPlacer = opponentCardPlacerRef.current;

							if (!hand || !cardPlacer) return;
							const handRect = hand.getBoundingClientRect();
							const cardPlacerRect =
								cardPlacer.getBoundingClientRect();

							setOpponentSelectingCard(true);
							// start at deck
							setOpponentSelectStyle({
								position: "fixed",
								left: handRect.left + handRect.width / 3,
								top: handRect.top,
								width: handRect.width,
								height: handRect.height,
								transition: "all 0.5s ease",
								zIndex: 1000,
							});

							setOpponentHandSize((prev) => prev - 1);

							// trigger animation in next tick
							setTimeout(() => {
								setOpponentSelectStyle((prev) => ({
									...prev,
									left: cardPlacerRect.left + 10,
									top: cardPlacerRect.top + 10,
								}));
							}, 50);

							

							// after animation ends
							setTimeout(() => {
								setSelectedOpponentCard({
								id: "temp",
								type: "hidden",
							});
								setOpponentSelectingCard(false);
							}, 500);
						}
						break;

					case "round_result":
						setRoundResult(msg);
						setGameState("BOTH_SELECTED");
						break;

					case "opponent_left":
						setGameState("END");
						setPostGameDetail({
							result: "Win",
							detail: "Opponent leave",
							exp: 0,
							gold: 0,
							levelUp: 0,
							statGain: { atk: 0, def: 0, spd: 0, hp: 0 },
						});
						break;

					case "true_sight_result":
						setToggleOverlay(true);
						setEventMessage(
							"Rock: " +
								msg.opponentHand.rock +
								" Paper: " +
								msg.opponentHand.paper +
								" Scissors: " +
								msg.opponentHand.scissors
						);
						setPlayerDetail((prev) => ({
							...prev,
							trueSight: msg.trueSightLeft,
						}));
						setTimeout(() => {
							setToggleOverlay(false);
							setEventMessage("");
						}, 3000);

						break;

					case "true_sight_alert":
						setToggleOverlay(true);
						setEventMessage("Opponent revealed your cards");
						setOpponentDetail((prev) => ({
							...prev,
							trueSight: prev.trueSight - 1,
						}));
						setTimeout(() => {
							setToggleOverlay(false);
							setEventMessage("");
						}, 3000);
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

	const handleClickBackToMenu = () => {
		navigate("/");
	};

	const handleClickPlayAgain = () => {
		window.location.reload();
	};

	const drawOpponentCard = () => {
		const deck = opponentDeckRef.current;
		const hand = opponentHandRef.current;
		if (!deck || !hand) return;
		const deckRect = deck.getBoundingClientRect();
		const handRect = hand.getBoundingClientRect();
		setOpponentDrawingCard({ id: "temp", type: "hidden" });
		// start at deck
		setOpponentDrawStyle({
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
			setOpponentDrawStyle((prev) => ({
				...prev,
				left: handRect.left + handRect.width - deckRect.width / 2,
				top: handRect.top + handRect.height / 2 - deckRect.height / 2,
			}));
		}, 50);

		// after animation ends
		setTimeout(() => {
			setOpponentHandSize(roundResult?.opponent.handLength ?? 0);
			setOpponentDrawingCard(null);
		}, 500);
	};

	const handlePlayerCardSelect = (cardID: string) => {
		if (gameState !== "SELECT_CARD") return;
		if (ws.current?.readyState !== WebSocket.OPEN) return;

		const hand = playerHandRef.current;
		const cardPlacer = playerCardPlacerRef.current;

		if (!hand || !cardPlacer) return;
		const handRect = hand.getBoundingClientRect();
		const cardPlacerRect = cardPlacer.getBoundingClientRect();

		setPlayerSelectingCard(true);
		// start at deck
		setPlayerSelectStyle({
			position: "fixed",
			left: handRect.left + handRect.width / 3,
			top: handRect.top,
			width: handRect.width,
			height: handRect.height,
			transition: "all 0.5s ease",
			zIndex: 1000,
		});

		setPlayerHand((prevHand) =>
			prevHand.filter((card) => card.id !== cardID)
		);

		// trigger animation in next tick
		setTimeout(() => {
			setPlayerSelectStyle((prev) => ({
				...prev,
				left: cardPlacerRect.left + 10,
				top: cardPlacerRect.top + 10,
			}));
		}, 50);

		// after animation ends
		setTimeout(() => {
			setSelectedPlayerCard(
				playerHand.find((card) => card.id === cardID) || null
			);
			setPlayerSelectingCard(false);
		}, 500);

		ws.current.send(
			JSON.stringify({
				type: "selected_card",
				cardID: cardID,
			})
		);
		setGameState("CARD_SELECTED");
	};

	const handleTrueSightUse = () => {
		if (ws.current?.readyState !== WebSocket.OPEN) return;
		ws.current.send(
			JSON.stringify({
				type: "use_true_sight",
			})
		);
	};

	useEffect(() => {
		console.log(playerSelectingCard);
	}, [playerSelectingCard]);

	//waiting page
	if (gameState === "WAIT_OPPONENT")
		return (
			<div className="PvP-Loading">
				<NavBar BackLabel="Back" />
				<div className="PvP-Loading__body">
					<div className="PvP-Loading__body_text">
						<div className="PvP-Loading__body_text_header">
							<h2>Lobby ID</h2>
							<div className="PvP-Loading__body_text_header_lobby-ID">
								{roomID}
							</div>
						</div>
						<span>waiting for your opponent</span>
					</div>
					<LoadingCard />
				</div>
			</div>
		);

	//game ended page
	if (gameState === "END") {
		return (
			<div className="PvP-win">
				<NavBar />
				<div className="PvP-win__body">
					<div className="PvP-win__body_header">
						<img src="/LogoSmall.svg" width={120} height={24} />
						<header>{postGameDetail?.result}</header>
						<span>{postGameDetail?.detail}</span>
					</div>

					<div className="PvP-win__body_menu">
						<h2>What is your next move ?</h2>
						<div className="PvP-win__body_menu_button">
							<button onClick={handleClickBackToMenu}>
								Back to menu
							</button>
							<button onClick={handleClickPlayAgain}>
								Play Agian
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	//default page
	return (
		<div className="PvP">
			{/* Event Overlay */}
			{toggleOverlay && (
				<div className="Home__overlay">
					<h2>{eventMessage}</h2>
				</div>
			)}

			{/* Player */}
			<div className="PvP__player_status">
				<PlayerStatus
					level={playerDetail.level}
					playerClass={playerDetail.class}
					currentHP={currentPlayerHP}
					stat={playerDetail.stat}
					cardRemaining={cardRemaining.player}
					trueSight={playerDetail.trueSight}
					onClickPassive={handleTrueSightUse}
				/>
			</div>

			<div className="PvP__player_hand" ref={playerHandRef}>
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
									onClick={handlePlayerCardSelect}
								/>
							</div>
						</div>
					);
				})}
			</div>

			<div className="PvP__player_deck" ref={playerDeckRef}>
				{cardRemaining.player.rock +
					cardRemaining.player.paper +
					cardRemaining.player.scissors >
				3 ? (
					<img src="/BackOfCard.svg" width={150} height={250} />
				) : (
					<div style={{ width: 150, height: 250 }} />
				)}
			</div>

			{playerDrawingCard && (
				<div style={playerDrawStyle}>
					<Card
						id={playerDrawingCard.id}
						type={playerDrawingCard.type}
					/>
				</div>
			)}

			{/* Card Placer */}
			<div className="PvP__board">
				<div
					className="PvP__board_card-placer"
					ref={playerCardPlacerRef}
				>
					<img
						src="/CardPlacer-Player.svg"
						width={170}
						height={270}
					/>
					{showPlayerDamage && (
						<div className="floating-damage">
							-{roundResult?.opponent.doDamage}
						</div>
					)}
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
										: winner === "opponent" &&
										  roundResult?.opponent.doDamage === -1
										? "card card-dodge-left"
										: winner === "opponent"
										? "card card-fly-left"
										: "card"
								}
							/>
						</div>
					)}
				</div>

				<div
					className="PvP__board_card-placer"
					ref={opponentCardPlacerRef}
				>
					<img
						src="/CardPlacer-Opponent.svg"
						width={170}
						height={270}
					/>
					{selectedOpponentCard && (
						<Card
							type={selectedOpponentCard.type}
							id={selectedOpponentCard.id}
							isHidden={hideCard}
							className={
								winner === "opponent"
									? "card card-attack-left"
									: winner === "player" &&
									  roundResult?.player.doDamage === -1
									? "card card-dodge-right"
									: winner === "player"
									? "card card-fly-right"
									: "card"
							}
						/>
					)}
				</div>
			</div>

			{playerSelectingCard && (
				<div style={playerSelectStyle}>
					<Card id={"temp"} type={"hidden"} isHidden />
				</div>
			)}

			{opponentSelectingCard && (
				<div style={opponentSelectStyle}>
					<Card id={"temp"} type={"hidden"} isHidden />
				</div>
			)}

			{/* Opponent */}
			<div className="PvP__opponent_status">
				<PlayerStatus
					level={opponentDetail.level}
					playerClass={opponentDetail.class}
					currentHP={currentOpponentHP}
					stat={opponentDetail.stat}
					cardRemaining={cardRemaining.opponent}
					trueSight={opponentDetail.trueSight}
				/>
			</div>

			<div
				className="PvP__opoonent_deck"
				ref={opponentDeckRef}
				style={{ transform: "scaleY(-1)" }}
			>
				{cardRemaining.opponent.rock +
					cardRemaining.opponent.paper +
					cardRemaining.opponent.scissors >
				3 ? (
					<img src="/BackOfCard.svg" width={150} height={250} />
				) : (
					<div style={{ width: 150, height: 250 }} />
				)}
			</div>

			<div className="PvP__opoonent_hand" ref={opponentHandRef}>
				{Array.from({ length: opponentHandSize }).map((_, index) => {
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
				})}
			</div>

			{opponentDrawingCard && (
				<div style={opponentDrawStyle}>
					<Card
						id={opponentDrawingCard.id}
						type={opponentDrawingCard.type}
						isHidden
					/>
				</div>
			)}
		</div>
	);
};

export default Lobby;
