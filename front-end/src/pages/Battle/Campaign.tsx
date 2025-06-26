import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { CardProps } from "../../types/Card";
import "./css/Battle.css";
import "./css/CardAttack.css";
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
import { playBGM, sfx } from "../../managers/soundManager";
import GameEnd from "./Overlay/GameEnd/GameEnd";
import { playCard, startBattle, trueSight } from "../../api/api";
import BattleUI from "./BattleUI";
import { useBattle } from "../../hooks/useBattle";

const Campaign = () => {
	const { levelId } = useParams();
	const [matchID, setMatchID] = useState<string>("");

	const navigate = useNavigate();

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

	// Game State
	const [gameState, setGameState] = useState<GameState>("LOADING");

	// Player & Opponent Detail
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

	//Initial
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
				console.error("Error starting battle:", err);
			}
		}

		initBattle();
	}, [levelId]);

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
					battleFunc.drawCard("player", battleFunc.findNewCard(roundResult.player.hand));
				}
				if (
					roundResult.opponent.cardRemaining.rock +
						roundResult.opponent.cardRemaining.paper +
						roundResult.opponent.cardRemaining.scissors >
					3
				) {
					battleFunc.drawCard("opponent", { id: "hidden", type: "hidden" });
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

	//handle function
	const handlePlayerCardSelect = async (cardID: string) => {
		if (gameState !== "SELECT_CARD") return;

		battleFunc.cardSelect("player", cardID);
		battleFunc.cardSelect("opponent", "hidden");

		setTimeout(async () => {
			try {
				const token = localStorage.getItem("authToken") || "";
				const data = await playCard(matchID, cardID, token); // แปลงเป็น number ถ้า cardID เป็น string

				setGameState("CARD_SELECTED");
				setRoundResult(data);

				setGameState("BOTH_SELECTED");
			} catch (err) {
				console.error("Error playing card:", err);
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
			console.error("Fetch error:", err);
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

	//waiting page
	if (gameState === "LOADING")
		return (
			<div className="battle-Loading">
				<NavBar backPath="/level" />
				<div className="battle-Loading__body">
					<div className="battle-Loading__body_text">
						<div className="battle-Loading__body_text_header">
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
		//game ended page
		if (gameState === "END" && postGameDetail) {
			return (
				<GameEnd
					postGameDetail={postGameDetail}
					type="campaign"
					onClickPlayAgain={handleClickPlayAgain}
					onClickkBackToMenu={handleClickBackToMenu}
					onClickContinue={handleClickContinue}
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
			onClickLeave={() => navigate("/level")}
			setUiState={setUiState}
		/>
	);
};

export default Campaign;
