import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { CardProps } from "../../types/Card";
import "./css/Battle.css";
import "./css/CardAttack.css";
import {
	type AnimationState,
	type BattleRefs,
	type CardCount,
	type CardRemaining,
	type PlayerDetail,
	type PostGameDetail,
	type RoundResult,
	type ServerMessage,
} from "../../types/Battle";
import NavBar from "../../components/NavBar";
import LoadingCard from "../../components/LoadingCard";
import { playBGM, sfx } from "../../managers/soundManager";
import GameEnd from "./Overlay/GameEnd/GameEnd";
import BattleUI from "./BattleUI";
import { useBattle } from "../../hooks/useBattle";

const PvP = () => {
	const { id: roomID } = useParams();
	const navigate = useNavigate();
	const ws = useRef<WebSocket | null>(null);
	const WS_BASE_URL = import.meta.env.VITE_WS_URL;
	//GAME STATE
	type GameState =
		| "LOADING"
		| "WAIT_OPPONENT"
		| "SELECT_CARD"
		| "CARD_SELECTED"
		| "BOTH_SELECTED"
		| "SHOW_RESULT"
		| "DO_DAMAGE"
		| "DRAW_CARD"
		| "END";

	// Game State
	const [gameState, setGameState] = useState<GameState>("WAIT_OPPONENT");

	const [playerDetail, setPlayerDetail] = useState<
		PlayerDetail & { currentHP: number }
	>({
		name: "player",
		level: 0,
		stat: { atk: 0, def: 0, spd: 0, hp: 0 },
		class: "none",
		trueSight: 0,
		currentHP: 0,
	});

	const [opponentDetail, setOpponentDetail] = useState<
		PlayerDetail & { currentHP: number }
	>({
		name: "opponent",
		level: 0,
		stat: { atk: 0, def: 0, spd: 0, hp: 0 },
		class: "none",
		trueSight: 0,
		currentHP: 0,
	});

	// Card & Hand Management
	const [playerHand, setPlayerHand] = useState<CardProps[]>([]);
	const [opponentHandSize, setOpponentHandSize] = useState<number>(0);
	const [cardRemaining, setCardRemaining] = useState<CardRemaining>({
		player: { rock: 0, paper: 0, scissors: 0 },
		opponent: { rock: 0, paper: 0, scissors: 0 },
	});
	const [selectedPlayerCard, setSelectedPlayerCard] =
		useState<CardProps | null>(null);
	const [selectedOpponentCard, setSelectedOpponentCard] =
		useState<CardProps | null>(null);

	// Round Result / Postgame
	const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
	const [postGameDetail, setPostGameDetail] = useState<PostGameDetail | null>(
		null
	);

	// UI States
	const [uiState, setUiState] = useState({
		hideCard: true,
		hidePlayerCard: true,
		showTrueSightAlert: false,
		trueSightResult: null as CardCount | null,
		showClassSkill: false,
	});

	const [animationState, setAnimationState] = useState<AnimationState>({
		player: {
			drawingCard: null as CardProps | null,
			drawStyle: {} as React.CSSProperties,
			selectingCard: false,
			selectStyle: {} as React.CSSProperties,
			battleAnimation: "",
			takenDamage: null as string | null,
		},
		opponent: {
			drawingCard: null as CardProps | null,
			drawStyle: {} as React.CSSProperties,
			selectingCard: false,
			selectStyle: {} as React.CSSProperties,
			battleAnimation: "",
			takenDamage: null as string | null,
		},
	});

	const refs: BattleRefs = {
		player: {
			deck: useRef<HTMLDivElement>(null),
			hand: useRef<HTMLDivElement>(null),
			cardPlacer: useRef<HTMLDivElement>(null),
		},
		opponent: {
			deck: useRef<HTMLDivElement>(null),
			hand: useRef<HTMLDivElement>(null),
			cardPlacer: useRef<HTMLDivElement>(null),
		},
	};

	const battleFunc = useBattle(
		playerHand,
		setPlayerHand,
		setOpponentHandSize,
		setAnimationState,
		setSelectedPlayerCard,
		setSelectedOpponentCard,
		roundResult,
		refs
	);

	useEffect(() => {
		playBGM("battle");
	}, []);

	//Web socket message handler
	useEffect(() => {
		if (!roomID) return;

		const token = localStorage.getItem("authToken")!;

		ws.current = new WebSocket(
			//`ws://localhost:8080/ws/pvp?room=${roomID}`,
			`${WS_BASE_URL}/pvp?room=${roomID}`,
			[token]
		);
		ws.current.onmessage = (e) => {
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
							class: msg.player.class,
							currentHP: msg.player.stat.hp,
							trueSight: 0,
						});
						setOpponentDetail({
							name: msg.opponent.name,
							level: msg.opponent.level,
							stat: msg.opponent.stat,
							class: msg.opponent.class,
							currentHP: msg.opponent.stat.hp,
							trueSight: 0,
						});
						sfx.card.play();
						setGameState("SELECT_CARD");
						break;

					case "selection_status":
						if (msg.opponentSelected) {
							battleFunc.cardSelect("opponent", "hidden");
						}
						break;

					case "round_result":
						setTimeout(() => {
							setRoundResult(msg);

							//trigger show result event
							setGameState("BOTH_SELECTED");
						}, 600);

						break;

					case "opponent_left":
						console.log("opponent_left");
						setGameState("END");
						setPostGameDetail({
							result: "Win",
							detail: "Opponent leave",
							exp: 0,
							gold: 0,
							lvlUp: 0,
							statGain: {
								atk: 0,
								def: 0,
								spd: 0,
								hp: 0,
							},
						});
						break;

					case "true_sight_result":
						setUiState((prev) => ({
							...prev,
							trueSightResult: msg.opponentHand,
						}));
						setPlayerDetail((prev) => ({
							...prev,
							trueSight: msg.trueSightLeft,
						}));
						setTimeout(() => {
							setUiState((prev) => ({
								...prev,
								trueSightResult: null,
							}));
						}, 3000);
						break;

					case "true_sight_alert":
						setUiState((prev) => ({
							...prev,
							trueSightAlert: true,
						}));
						setOpponentDetail((prev) => ({
							...prev,
							trueSight: prev.trueSight - 1,
						}));
						setTimeout(() => {
							setUiState((prev) => ({
								...prev,
								trueSightAlert: false,
							}));
						}, 3000);
						break;

					default:
						console.warn("Unknown message type:", msg);
						break;
				}
			} catch (err) {
				console.error("Invalid message", err);
			}
		};

		ws.current.onclose = () => null;

		return () => ws.current?.close();
	}, [roomID]);

	//Gamestate and round_result handler
	useEffect(() => {
		if (!roundResult) return;

		switch (gameState) {
			case "BOTH_SELECTED":
				setSelectedOpponentCard(roundResult.opponent.cardPlayed);
				setGameState("SHOW_RESULT");
				break;

			case "SHOW_RESULT":
				setTimeout(() => {
					setUiState((prev) => ({ ...prev, hideCard: false }));
					sfx.card.play();
					setTimeout(() => {
						setGameState("DO_DAMAGE");
					}, 1000);
				}, 1000);
				break;

			case "DO_DAMAGE":
				// Animation Player
				if (roundResult.player.specialEvent !== "nothing") {
					const event =
						roundResult.player.specialEvent
							.toLowerCase()
							.replace(" ", "-") + "-left";
					setAnimationState((prev) => ({
						...prev,
						player: { ...prev.player, battleAnimation: event },
					}));
				} else {
					let anim = "";
					if (roundResult.roundWinner === "player")
						anim = "attack-left";
					else if (
						roundResult.roundWinner === "opponent" &&
						roundResult.opponent.doDamage === -1
					)
						anim = "dodge-left";
					else if (roundResult.roundWinner === "opponent")
						anim = "fly-left";
					setAnimationState((prev) => ({
						...prev,
						player: { ...prev.player, battleAnimation: anim },
					}));
				}

				// Animation Opponent
				if (roundResult.opponent.specialEvent !== "nothing") {
					const event =
						roundResult.opponent.specialEvent
							.toLowerCase()
							.replace(" ", "-") + "-right";
					setAnimationState((prev) => ({
						...prev,
						opponent: { ...prev.opponent, battleAnimation: event },
					}));
				} else {
					let anim = "";
					if (roundResult.roundWinner === "opponent")
						anim = "attack-right";
					else if (
						roundResult.roundWinner === "player" &&
						roundResult.player.doDamage === -1
					)
						anim = "dodge-right";
					else if (roundResult.roundWinner === "player")
						anim = "fly-right";
					setAnimationState((prev) => ({
						...prev,
						opponent: { ...prev.opponent, battleAnimation: anim },
					}));
				}

				setTimeout(() => {
					// Show damage text
					setAnimationState((prev) => ({
						...prev,
						opponent: {
							...prev.opponent,
							takenDamage:
								roundResult.player.doDamage === -1
									? "Miss"
									: roundResult.player.doDamage !== 0
									? "- " +
									  roundResult.player.doDamage.toString()
									: null,
						},
						player: {
							...prev.player,
							takenDamage:
								roundResult.opponent.doDamage === -1
									? "Miss"
									: roundResult.opponent.doDamage !== 0
									? "- " +
									  roundResult.opponent.doDamage.toString()
									: null,
						},
					}));

					// Play sounds
					if (roundResult.player.doDamage >= 1) sfx.hit.play();
					else if (roundResult.player.doDamage === -1)
						sfx.evade.play();

					if (roundResult.opponent.doDamage >= 1) sfx.hit.play();
					else if (roundResult.opponent.doDamage === -1)
						sfx.evade.play();

					// Update HP inside playerDetail and opponentDetail
					setPlayerDetail((prev) => ({
						...prev,
						currentHP: Number(roundResult.player.hp),
						trueSight: roundResult.player.trueSight,
					}));
					setOpponentDetail((prev) => ({
						...prev,
						currentHP: Number(roundResult.opponent.hp),
						trueSight: roundResult.opponent.trueSight,
					}));

					setTimeout(() => {
						if (roundResult.gameStatus === "end") {
							setGameState("END");
							setPostGameDetail(roundResult.postGameDetail);
							if (roundResult.postGameDetail.result === "Win")
								sfx.win.play();
							else sfx.lose.play();
						} else {
							setGameState("DRAW_CARD");
						}
					}, 1500);
				}, 300); // animation time

				break;

			case "DRAW_CARD":
				setCardRemaining({
					player: roundResult.player.cardRemaining,
					opponent: roundResult.opponent.cardRemaining,
				});

				if (
					roundResult.player.cardRemaining.rock +
						roundResult.player.cardRemaining.paper +
						roundResult.player.cardRemaining.scissors >
					3
				) {
					battleFunc.drawCard(
						"player",
						battleFunc.findNewCard(roundResult.player.hand)
					);
				}
				if (
					roundResult.opponent.cardRemaining.rock +
						roundResult.opponent.cardRemaining.paper +
						roundResult.opponent.cardRemaining.scissors >
					3
				) {
					battleFunc.drawCard("opponent", {
						id: "hidden",
						type: "hidden",
					});
				}

				setUiState((prev) => ({ ...prev, hideCard: true }));
				setSelectedPlayerCard(null);
				setSelectedOpponentCard(null);
				setRoundResult(null);
				setAnimationState((prev) => ({
					player: {
						...prev.player,
						battleAnimation: "",
						takenDamage: null,
					},
					opponent: {
						...prev.opponent,
						battleAnimation: "",
						takenDamage: null,
					},
				}));

				setTimeout(() => {
					setGameState("SELECT_CARD");
				}, 600);

				break;

			default:
				break;
		}
	}, [gameState, roundResult]);

	const handleClickBackToMenu = () => {
		navigate("/");
	};

	const handleClickPlayAgain = () => {
		window.location.reload();
	};

	const handlePlayerCardSelect = (cardID: string) => {
		if (gameState !== "SELECT_CARD") return;
		if (ws.current?.readyState !== WebSocket.OPEN) return;

		battleFunc.cardSelect("player", cardID);

		ws.current.send(
			JSON.stringify({
				type: "selected_card",
				cardID: cardID,
			})
		);
		setGameState("CARD_SELECTED");
	};

	const handleTrueSightUse = () => {
		if (gameState !== "SELECT_CARD" || playerDetail.trueSight <= 0) return;

		if (ws.current?.readyState !== WebSocket.OPEN) return;
		ws.current.send(
			JSON.stringify({
				type: "use_true_sight",
			})
		);
	};

	//waiting page
	if (gameState === "WAIT_OPPONENT")
		return (
			<div className="battle-Loading">
				<NavBar backPath="/" />
				<div className="battle-Loading__body">
					<div className="battle-Loading__body_text">
						<div className="battle-Loading__body_text_header">
							<h2>Lobby ID</h2>
							<div className="battle-Loading__body_text_header_lobby-ID">
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
		//game ended page
		if (gameState === "END" && postGameDetail) {
			return (
				<GameEnd
					postGameDetail={postGameDetail}
					type="pvp"
					onClickPlayAgain={handleClickPlayAgain}
					onClickkBackToMenu={handleClickBackToMenu}
				/>
			);
		}
	}

	//default page
	return (
		<BattleUI
			gameState={gameState}
			refs={refs}
			uiState={uiState}
			animationState={animationState}
			playerHand={playerHand}
			opponentHandSize={opponentHandSize}
			cardRemaining={cardRemaining}
			selectedPlayerCard={selectedPlayerCard}
			selectedOpponentCard={selectedOpponentCard}
			playerDetail={playerDetail}
			opponentDetail={opponentDetail}
			onClickSelectCard={handlePlayerCardSelect}
			onClickTrueSight={handleTrueSightUse}
			setUiState={setUiState}
		/>
	);
};

export default PvP;
