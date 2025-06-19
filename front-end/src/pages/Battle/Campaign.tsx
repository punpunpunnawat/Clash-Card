import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { CardProps } from "../../types/Card";
import Card from "../../components/Card/Card";
import "./css/PvP.css";
import "./css/CardAttack.css";
import type {
	CardCount,
	CardRemaining,
	PlayerDetail,
	PostGameDetail,
	RoundResult,
} from "../../types/Pvp";
import NavBar from "../../components/NavBar";
import LoadingCard from "../../components/LoadingCard";
import PlayerStatus from "../../components/PlayerStatus";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { playBGM, sfx } from "../../managers/soundManager";

const Campaign = () => {
	const { levelId } = useParams();
	const [matchID, setMatchID] = useState();
	const navigate = useNavigate();
	useEffect(() => {
		playBGM("battle");
	}, []);
	//const dispatch: AppDispatch = useDispatch();
	const player = useSelector((state: RootState) => state.player);

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

	const [playerBattleAnimation, setPlayerBattleAnimation] = useState("");
	const [opponentBattleAnimation, setOpponentBattleAnimation] = useState("");
	const [playerTakenDamage, setPlayerTakenDamage] = useState<string | null>(
		null
	);
	const [opponentTakenDamage, setOpponentTakenDamage] = useState<
		string | null
	>(null);

	//overlay
	const [toggleTrueSightResult, setToggleTrueSightResult] =
		useState<CardCount | null>(null);
	const [toggleMenu, setToggleMenu] = useState(false);

	//Ref
	const playerDeckRef = useRef<HTMLDivElement>(null);
	const playerHandRef = useRef<HTMLDivElement>(null);
	const playerCardPlacerRef = useRef<HTMLDivElement>(null);
	const opponentDeckRef = useRef<HTMLDivElement>(null);
	const opponentHandRef = useRef<HTMLDivElement>(null);
	const opponentCardPlacerRef = useRef<HTMLDivElement>(null);

	//GAME STATE
	type GameState =
		| "LOADING"
		| "SELECT_CARD"
		| "CARD_SELECTED"
		| "BOTH_SELECTED"
		| "SHOW_RESULT"
		| "DO_DAMAGE"
		| "DRAW_CARD"
		| "END";
	const [gameState, setGameState] = useState<GameState>("LOADING");

	//Gamestate and round_result handler
	useEffect(() => {
		console.log(roundResult);
		console.log(gameState);
		if (roundResult) {
			switch (gameState) {
				case "BOTH_SELECTED":
					console.log(gameState);

					setGameState("SHOW_RESULT");
					break;
				case "SHOW_RESULT":
					console.log(gameState);

					setTimeout(() => {
						setSelectedOpponentCard(
							roundResult.opponent.cardPlayed
						);
						setHideCard(false);
						sfx.card.play();
						setTimeout(() => {
							setGameState("DO_DAMAGE");
						}, 1000);
					}, 3000);
					break;

				case "DO_DAMAGE":
					console.log(gameState);
					if (roundResult) {
						// ทำ animation โจมตีก่อน
						// Player
						if (roundResult.player.specialEvent !== "nothing") {
							const event =
								roundResult.player.specialEvent
									.toLowerCase()
									.replace(" ", "-") + "-left";
							setPlayerBattleAnimation(event);
						} else {
							switch (true) {
								case roundResult.roundWinner === "player":
									setPlayerBattleAnimation("attack-left");
									break;
								case roundResult.roundWinner === "opponent" &&
									roundResult.opponent.doDamage === -1:
									setPlayerBattleAnimation("dodge-left");
									break;
								case roundResult.roundWinner === "opponent":
									setPlayerBattleAnimation("fly-left");
									break;
							}
						}

						// Opponent
						if (roundResult.opponent.specialEvent !== "nothing") {
							const event =
								roundResult.opponent.specialEvent
									.toLowerCase()
									.replace(" ", "-") + "-right";
							setOpponentBattleAnimation(event);
						} else {
							switch (true) {
								case roundResult.roundWinner === "opponent":
									setOpponentBattleAnimation("attack-right");
									break;
								case roundResult.roundWinner === "player" &&
									roundResult.player.doDamage === -1:
									setOpponentBattleAnimation("dodge-right");
									break;
								case roundResult.roundWinner === "player":
									setOpponentBattleAnimation("fly-right");
									break;
							}
						}

						setTimeout(() => {
							// หลัง 0.6s ค่อยโชว์ดาเมจ

							// Damage Texts
							setOpponentTakenDamage(
								roundResult.player.doDamage === -1
									? "Miss"
									: roundResult.player.doDamage !== 0
									? "- " +
									  roundResult.player.doDamage.toString()
									: ""
							);

							setPlayerTakenDamage(
								roundResult.opponent.doDamage === -1
									? "Miss"
									: roundResult.opponent.doDamage !== 0
									? "- " +
									  roundResult.opponent.doDamage.toString()
									: ""
							);
							if (roundResult.player.doDamage >= 1)
								sfx.hit.play();
							else if (roundResult.player.doDamage == -1)
								sfx.evade.play();
							if (roundResult.opponent.doDamage >= 1)
								sfx.hit.play();
							else if (roundResult.opponent.doDamage == -1)
								sfx.evade.play();
							// update HP
							setCurrentPlayerHP(Number(roundResult.player.hp));
							setCurrentOpponentHP(
								Number(roundResult.opponent.hp)
							);

							// trueSight
							setPlayerDetail((prev) => ({
								...prev,
								trueSight: roundResult.player.trueSight,
							}));
							setOpponentDetail((prev) => ({
								...prev,
								trueSight: roundResult.opponent.trueSight,
							}));

							setTimeout(() => {
								if (roundResult.gameStatus === "end") {
									setGameState("END");
									setPostGameDetail(
										roundResult.postGameDetail
									);
									if (
										roundResult.postGameDetail.result ===
										"Win"
									) {
										sfx.win.play();
									} else sfx.lose.play();

									if (roundResult.postGameDetail.lvlUp > 0)
										sfx.levelUp.play();
								} else {
									setGameState("DRAW_CARD");
								}
							}, 1500);
							// เกมจบหรือยัง
						}, 300); // ตรงกับเวลาของ attack animation
					}
					break;

				case "DRAW_CARD":
					console.log(gameState);
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

					setHideCard(true);
					setPlayerBattleAnimation("");
					setOpponentBattleAnimation("");
					setPlayerTakenDamage("");
					setOpponentTakenDamage("");
					setSelectedPlayerCard(null);
					setSelectedOpponentCard(null);
					setRoundResult(null);

					setTimeout(() => {
						setGameState("SELECT_CARD");
					}, 600);
					break;
				default:
					break;
			}
		}
	}, [gameState, roundResult]);

	//Initial
	useEffect(() => {
		fetch("http://localhost:8080/api/battle/start", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("authToken")}`,
			},
			body: JSON.stringify({ levelId: Number(levelId) }),
		})
			.then((res) => res.json())
			.then((data) => {
				//set hand
				setPlayerHand(data.player.hand);
				setOpponentHandSize(data.opponent.handSize);

				//setCardRemaining
				setCardRemaining({
					player: data.player.cardRemaining,
					opponent: data.opponent.cardRemaining,
				});

				//set Stat
				setPlayerDetail({
					name: data.player.name,
					level: data.player.level,
					stat: data.player.stat,
					class: data.player.class,
					trueSight: 0,
				});
				setOpponentDetail({
					name: data.opponent.name,
					level: data.opponent.level,
					stat: data.opponent.stat,
					class: data.opponent.class,
					trueSight: 0,
				});
				setCurrentPlayerHP(data.player.currentHP);
				setCurrentOpponentHP(data.opponent.currentHP);
				setMatchID(data.matchID);
				setGameState("SELECT_CARD");
			})
			.catch((err) => {
				console.error("Error starting battle:", err);
			});
	}, [levelId]);

	const handleClickBackToMenu = () => {
		navigate("/", { replace: true });
	};

	const handleClickPlayAgain = () => {
		window.location.reload();
	};

	const handleClickContinue = () => {
		if (!levelId) return;
		navigate(`/campaign/${Number(levelId) + 1}`, { replace: true });
		window.location.reload();
	};

	const drawOpponentCard = () => {
		const deck = opponentDeckRef.current;
		const hand = opponentHandRef.current;
		if (!deck || !hand) return;
		const deckRect = deck.getBoundingClientRect();
		const handRect = hand.getBoundingClientRect();
		sfx.card.play();
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

	const animateOpponentSelectCard = () => {
		const hand = opponentHandRef.current;
		const cardPlacer = opponentCardPlacerRef.current;

		if (!hand || !cardPlacer) return;
		const handRect = hand.getBoundingClientRect();
		const cardPlacerRect = cardPlacer.getBoundingClientRect();

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
	};

	const handlePlayerCardSelect = (cardID: string) => {
		if (gameState !== "SELECT_CARD") return;

		console.log("card id " + cardID);
		const hand = playerHandRef.current;
		const cardPlacer = playerCardPlacerRef.current;

		if (!hand || !cardPlacer) return;
		const handRect = hand.getBoundingClientRect();
		const cardPlacerRect = cardPlacer.getBoundingClientRect();

		sfx.card.play();
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
		console.log("card id ?" + cardID);
		fetch(`http://localhost:8080/api/battle/${matchID}/play`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("authToken")}`, // ใส่ token ตรงนี้
			},
			body: JSON.stringify({ cardID: cardID }),
		})
			.then((res) => res.json())
			.then((data) => {
				setGameState("CARD_SELECTED");
				setRoundResult(data);
				animateOpponentSelectCard();
				setGameState("BOTH_SELECTED");
			})
			.catch((err) => {
				console.error("Error starting battle:", err);
				console.log("Error");
			});
	};

	const handleTrueSightUse = () => {
		if (gameState !== "SELECT_CARD" || playerDetail.trueSight <= 0) return;

		fetch(`http://localhost:8080/api/battle/${matchID}/play/true-sight`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("authToken")}`, // ถ้าต้องใช้
			},
		})
			.then((res) => {
				if (!res.ok) throw new Error("Network response was not ok");
				return res.json();
			})
			.then((data) => {
				console.log("Response from server:", data);
				setToggleTrueSightResult(data.opponentHand);
				setPlayerDetail((prev) => ({
					...prev,
					trueSight: data.trueSightLeft,
				}));
				setTimeout(() => {
					setToggleTrueSightResult(null);
				}, 3000);
			})
			.catch((err) => {
				console.error("Fetch error:", err);
			});
	};

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
		sfx.card.play();
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

	useEffect(() => {
		console.log("player = " + playerBattleAnimation);
		console.log("opponenet = " + opponentBattleAnimation);
		console.log("player ta = " + playerTakenDamage);
		console.log("opponenet ta = " + opponentTakenDamage);
	}, [
		playerBattleAnimation,
		opponentBattleAnimation,
		playerTakenDamage,
		opponentTakenDamage,
	]);

	//waiting page
	if (gameState === "LOADING")
		return (
			<div className="PvP-Loading">
				<NavBar BackPath="/level" />
				<div className="PvP-Loading__body">
					<div className="PvP-Loading__body_text">
						<div className="PvP-Loading__body_text_header">
							<h2>Loading</h2>
						</div>
						<span>Please Wait</span>
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
					<div className="PvP-win__body_result">
						<div className="PvP-win__body_result_header">
							<img src="/others/LogoSmall.svg" width={120} height={24} />
							<header>{postGameDetail?.result}</header>
							<span>{postGameDetail?.detail}</span>
						</div>

						<div className="PvP-win__body_result_reward">
							<div className="PvP-win__body_result_reward_exp">
								<span style={{ width: 64 }}>EXP</span>
								<div
									className="reward-box"
									style={{
										background: "rgba(140, 140, 70, 0.5)",
									}}
								>
									{postGameDetail?.exp}
								</div>
							</div>
							<div className="PvP-win__body_result_reward_gold">
								<span style={{ width: 64 }}>GOLD</span>
								<div
									className="reward-box"
									style={{
										background: "rgba(140, 70, 140, 0.5)",
									}}
								>
									{postGameDetail?.gold}
								</div>
							</div>
							{postGameDetail?.lvlUp != 0 && (
								<>
									<div className="PvP-win__body_result_reward_level">
										<span style={{ width: 64 }}>Level</span>
										<div className="reward-box">
											{player.level -
												(postGameDetail?.lvlUp ?? 0)}
										</div>
										<span>{">"}</span>
										<div className="reward-box">
											{player.level}
										</div>
									</div>
									<div className="PvP-win__body_result_reward_atk">
										<span style={{ width: 64 }}>ATK</span>
										<div className="reward-box">
											{player.stat.atk -
												(postGameDetail?.statGain.atk ??
													0)}
										</div>
										<span>{">"}</span>
										<div className="reward-box">
											{player.stat.atk}
										</div>
									</div>
									<div className="PvP-win__body_result_reward_def">
										<span style={{ width: 64 }}>DEF</span>
										<div className="reward-box">
											{player.stat.def -
												(postGameDetail?.statGain.def ??
													0)}
										</div>
										<span>{">"}</span>
										<div className="reward-box">
											{player.stat.def}
										</div>
									</div>
									<div className="PvP-win__body_result_reward_spd">
										<span style={{ width: 64 }}>SPD</span>
										<div className="reward-box">
											{player.stat.spd -
												(postGameDetail?.statGain.spd ??
													0)}
										</div>
										<span>{">"}</span>
										<div className="reward-box">
											{player.stat.spd}
										</div>
									</div>
									<div className="PvP-win__body_result_reward_hp">
										<span style={{ width: 64 }}>HP</span>
										<div className="reward-box">
											{player.stat.hp -
												(postGameDetail?.statGain.hp ??
													0)}
										</div>
										<span>{">"}</span>
										<div className="reward-box">
											{player.stat.hp}
										</div>
									</div>
								</>
							)}
						</div>
					</div>

					<div className="PvP-win__body_menu">
						<h2>What is your next move ?</h2>

						<div className="PvP-win__body_menu_button">
							<button onClick={handleClickContinue}>
								Continue
							</button>
							<button onClick={handleClickPlayAgain}>
								Rematch
							</button>
							<button onClick={handleClickBackToMenu}>
								Back to menu
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
			{toggleTrueSightResult && (
				<div className="PvP__overlay">
					{Object.entries(toggleTrueSightResult).flatMap(
						([type, count]) =>
							Array.from({ length: count }).map((_, i) => (
								<Card
									id={`${type}-${i}`}
									type={type as "rock" | "paper" | "scissors"}
								/>
							))
					)}
				</div>
			)}

			{toggleMenu && (
				<div className="PvP__overlay">
					<img
						className="Home__overlay__close"
						src="/icons/close.svg"
						onClick={() => setToggleMenu(false)}
					/>
					<div className="PvP__overlay_class-explain">
						<img src="/cards/WarriorCard.svg" />
						<h3>Warrior - Warrior's Blood</h3>
						<p>
							When drawing with Rock,
							<br />
							deal half of your normal damage to the enemy.
							<br />
							(always hit)
						</p>
					</div>
					<div className="PvP__overlay_class-explain">
						<img src="/cards/MageCard.svg" />
						<h3>Mage - True Sight</h3>
						<p>
							When winning with Paper,
							<br />
							gain 1 True Sight token.
							<br />
							Use it to reveal your opponent's hand.
							<br />
						</p>
					</div>
					<div className="PvP__overlay_class-explain">
						<img src="/cards/AssassinCard.svg" />

						<h3>Assassin - True Strike</h3>
						<p>
							When winning with Scissors,
							<br />
							ignore the opponent’s defense when dealing damage.
							<br />
							(always hit)
						</p>
					</div>
					<div className="PvP__overlay_leave">
						Scared ? you can leave anytime
						<button
							onClick={() => navigate("/level")}
							style={{ background: "rgba(255,0,0,0.5)" }}
						>
							Leave
						</button>
					</div>
				</div>
			)}

			<button
				className="PvP__menu-button"
				onClick={() => setToggleMenu(true)}
			>
				Menu
			</button>

			{/* Event Overlay */}
			{/* {toggleOverlay && (
				<div className="Home__overlay">
					<h2>{eventMessage}</h2>
				</div>
			)} */}

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
					<img src="/cards/BackOfCard.svg" width={150} height={250} />
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
						src="/cards/CardPlacer-Player.svg"
						width={170}
						height={270}
					/>
					{playerTakenDamage && (
						<div className="floating-damage">
							{playerTakenDamage}
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
								className={`card ${playerBattleAnimation}`}
							/>
						</div>
					)}
				</div>

				<div
					className="PvP__board_card-placer"
					ref={opponentCardPlacerRef}
				>
					<img
						src="/cards/CardPlacer-Opponent.svg"
						width={170}
						height={270}
					/>
					{opponentTakenDamage && (
						<div className="floating-damage">
							{opponentTakenDamage}
						</div>
					)}
					{selectedOpponentCard && (
						<Card
							type={selectedOpponentCard.type}
							id={selectedOpponentCard.id}
							isHidden={hideCard}
							className={`card ${opponentBattleAnimation}`}
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
				className="PvP__opponent_deck"
				ref={opponentDeckRef}
				style={{ transform: "scaleY(-1)" }}
			>
				{cardRemaining.opponent.rock +
					cardRemaining.opponent.paper +
					cardRemaining.opponent.scissors >
				3 ? (
					<img src="/cards/BackOfCard.svg" width={150} height={250} />
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

export default Campaign;
