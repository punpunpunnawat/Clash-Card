import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

import type { CardProps } from "../../types/Card";
import type {
	AnimationState,
	BattleRefs,
	CardCount,
	CardRemaining,
	PlayerDetail,
	PostGameDetail,
	RoundResult,
} from "../../types/Battle";

import NavBar from "../../components/NavBar";
import LoadingCard from "../../components/LoadingCard";
import ErrorOverlay from "../../components/ErrorOverlay";

import { playBGM, sfx } from "../../managers/soundManager";
import { playCard, startBattle, trueSight } from "../../api/api";

import Battle from "./subPages/Battle";
import GameEnd from "./subPages/GameEnd";

import { useBattle } from "../../hooks/useBattle";

import "./Loading.css";

const Campaign = () => {
	// Router hooks
	const { levelId } = useParams();
	const navigate = useNavigate();

	// Match ID from backend
	const [matchID, setMatchID] = useState<string>("");

	// --- Game state enum ---
	type GameState =
		| "LOADING"
		| "SELECT_CARD"
		| "CARD_SELECTED"
		| "BOTH_SELECTED"
		| "SHOW_RESULT"
		| "DO_DAMAGE"
		| "DRAW_CARD"
		| "END";

	// --- State ---
	const [gameState, setGameState] = useState<GameState>("LOADING");

	const [playerDetail, setPlayerDetail] = useState<PlayerDetail>({
		name: "player",
		level: 0,
		stat: { atk: 0, def: 0, spd: 0, hp: 0 },
		class: "none",
		currentHP: 0,
		trueSight: 0,
	});
	const [opponentDetail, setOpponentDetail] = useState<PlayerDetail>({
		name: "opponent",
		level: 0,
		stat: { atk: 0, def: 0, spd: 0, hp: 0 },
		class: "none",
		currentHP: 0,
		trueSight: 0,
	});

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

	const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
	const [postGameDetail, setPostGameDetail] = useState<PostGameDetail | null>(
		null
	);

	const [uiState, setUiState] = useState({
		hideCard: true,
		hidePlayerCard: true,
		showTrueSightAlert: false,
		trueSightResult: null as CardCount | null,
		showClassSkill: false,
	});

	const [animationState, setAnimationState] = useState<AnimationState>({
		player: {
			drawingCard: null,
			drawStyle: {} as React.CSSProperties,
			selectingCard: false,
			selectStyle: {} as React.CSSProperties,
			battleAnimation: "",
			takenDamage: null,
		},
		opponent: {
			drawingCard: null,
			drawStyle: {} as React.CSSProperties,
			selectingCard: false,
			selectStyle: {} as React.CSSProperties,
			battleAnimation: "",
			takenDamage: null,
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

	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	// Custom hook with battle logic
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

	// --- Effects ---

	// Play BGM once
	useEffect(() => {
		playBGM("battle");
	}, []);

	// Initialize battle on levelId change
	useEffect(() => {
		const token = localStorage.getItem("authToken") || "";

		async function initBattle() {
			try {
				const data = await startBattle(Number(levelId), token);

				setPlayerHand(data.player.hand);
				setOpponentHandSize(data.opponent.handSize);

				setCardRemaining({
					player: data.player.cardRemaining,
					opponent: data.opponent.cardRemaining,
				});

				setPlayerDetail({
					name: data.player.name,
					level: data.player.level,
					stat: data.player.stat,
					class: data.player.class,
					currentHP: data.player.stat.hp,
					trueSight: 0,
				});

				setOpponentDetail({
					name: data.opponent.name,
					level: data.opponent.level,
					stat: data.opponent.stat,
					class: data.opponent.class,
					currentHP: data.opponent.stat.hp,
					trueSight: 0,
				});
				setMatchID(data.matchID ?? "none");
				setGameState("SELECT_CARD");
			} catch (err) {
				setErrorMessage(
					err instanceof Error ? err.message : "Unknown error"
				);
			}
		}

		initBattle();
	}, [levelId]);

	// Handle game state & round results
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
				// Animate player
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

				// Animate opponent
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

					if (roundResult.player.doDamage >= 1) sfx.hit.play();
					else if (roundResult.player.doDamage === -1)
						sfx.evade.play();

					if (roundResult.opponent.doDamage >= 1) sfx.hit.play();
					else if (roundResult.opponent.doDamage === -1)
						sfx.evade.play();

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
							setPostGameDetail(roundResult.postGameDetail);
							setGameState("END");
							if (roundResult.postGameDetail.result === "Win")
								sfx.win.play();
							else sfx.lose.play();
						} else {
							setGameState("DRAW_CARD");
						}
					}, 1500);
				}, 300);

				break;

			case "DRAW_CARD":
				setCardRemaining({
					player: roundResult.player.cardRemaining,
					opponent: roundResult.opponent.cardRemaining,
				});

				if (
					roundResult.player.cardRemaining.rock +
						roundResult.player.cardRemaining.paper +
						roundResult.player.cardRemaining.scissors >=
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
						roundResult.opponent.cardRemaining.scissors >=
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

	// --- Event Handlers ---

	const handlePlayerCardSelect = async (cardID: string) => {
		if (gameState !== "SELECT_CARD") return;

		battleFunc.cardSelect("player", cardID);
		battleFunc.cardSelect("opponent", "hidden");

		setTimeout(async () => {
			try {
				const token = localStorage.getItem("authToken") || "";
				const data = await playCard(matchID, cardID, token);

				setGameState("CARD_SELECTED");
				setRoundResult(data);
				setGameState("BOTH_SELECTED");
			} catch (err) {
				setErrorMessage(
					err instanceof Error ? err.message : "Unknown error"
				);
			}
		}, 500);
	};

	const handleTrueSightUse = async () => {
		if (gameState !== "SELECT_CARD" || playerDetail.trueSight <= 0) return;

		const token = localStorage.getItem("authToken") || "";
		try {
			const data = await trueSight(matchID, token);

			setUiState((prev) => ({
				...prev,
				trueSightResult: data.opponentHand,
			}));

			setPlayerDetail((prev) => ({
				...prev,
				trueSight: data.trueSightLeft,
			}));

			setTimeout(() => {
				setUiState((prev) => ({
					...prev,
					trueSightResult: null,
				}));
			}, 3000);
		} catch (err) {
			setErrorMessage(
				err instanceof Error ? err.message : "Unknown error"
			);
		}
	};

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

	// --- Render ---

	if (gameState === "LOADING")
		return (
			<div className="battle-loading">
				<NavBar backPath="/level" />
				<div className="battle-loading__body">
					<div className="battle-loading__body_text">
						<div className="battle-loading__body_text_header">
							<h2>Loading</h2>
						</div>
						<span>Please Wait</span>
					</div>
					<LoadingCard />
				</div>
			</div>
		);

	if (gameState === "END" && postGameDetail)
		return (
			<GameEnd
				postGameDetail={postGameDetail}
				type="campaign"
				onClickPlayAgain={handleClickPlayAgain}
				onClickBackToMenu={handleClickBackToMenu}
				onClickContinue={handleClickContinue}
			/>
		);

	return (
		<>
			<Battle
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
				onClickLeave={() => navigate("/level")}
				setUiState={setUiState}
			/>
			{errorMessage && (
				<ErrorOverlay
					message={errorMessage}
					onClose={() => setErrorMessage(null)}
				/>
			)}
		</>
	);
};

export default Campaign;
