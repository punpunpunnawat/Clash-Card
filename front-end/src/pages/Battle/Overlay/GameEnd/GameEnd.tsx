import { useSelector } from "react-redux";
import NavBar from "../../../../components/NavBar";
import type { RootState } from "../../../../store";
import type { PostGameDetail } from "../../../../types/Battle";
import "./GameEnd.css"

type GameEndProps = {
	postGameDetail: PostGameDetail;
	type: "campaign" | "pvp";
	onClickContinue?: () => void;
	onClickPlayAgain?: () => void;
	onClickkBackToMenu?: () => void;
};
const GameEnd = ({
	postGameDetail,
	type,
	onClickContinue,
	onClickPlayAgain,
	onClickkBackToMenu,
}: GameEndProps) => {

    const player = useSelector((state: RootState) => state.player);
    
	const handleClickContinue = () => {
		onClickContinue?.();
	};

	const handleClickPlayAgain = () => {
		onClickPlayAgain?.();
	};

	const handleClickBackToMenu = () => {
		onClickkBackToMenu?.();
	};
	return (
		<div className="game-end">
			<NavBar />
			<div className="game-end__body">
				<div className="game-end__body_result">
					<div className="game-end__body_result_header">
						<img
							src="/others/LogoSmall.svg"
							width={120}
							height={24}
						/>
						<header>{postGameDetail?.result}</header>
						<span>{postGameDetail?.detail}</span>
					</div>

					<div className="game-end__body_result_reward">
						<div className="game-end__body_result_reward_exp">
							<span style={{ width: 64 }}>EXP</span>
							<div
								className="number-box"
								style={{
									background: "rgba(140, 140, 70, 0.5)",
								}}
							>
								{postGameDetail?.exp}
							</div>
						</div>
						<div className="game-end__body_result_reward_gold">
							<span style={{ width: 64 }}>GOLD</span>
							<div
								className="number-box"
								style={{
									background: "rgba(140, 70, 140, 0.5)",
								}}
							>
								{postGameDetail?.gold}
							</div>
						</div>
						{postGameDetail?.lvlUp != 0 && (
							<>
								<div className="game-end__body_result_reward_level">
									<span style={{ width: 64 }}>Level</span>
									<div className="number-box">
										{player.level -
											(postGameDetail?.lvlUp ?? 0)}
									</div>
									<span>{">"}</span>
									<div className="number-box">
										{player.level}
									</div>
								</div>
								<div className="game-end__body_result_reward_atk">
									<span style={{ width: 64 }}>ATK</span>
									<div className="number-box">
										{player.stat.atk -
											(postGameDetail?.statGain.atk ?? 0)}
									</div>
									<span>{">"}</span>
									<div className="number-box">
										{player.stat.atk}
									</div>
								</div>
								<div className="game-end__body_result_reward_def">
									<span style={{ width: 64 }}>DEF</span>
									<div className="number-box">
										{player.stat.def -
											(postGameDetail?.statGain.def ?? 0)}
									</div>
									<span>{">"}</span>
									<div className="number-box">
										{player.stat.def}
									</div>
								</div>
								<div className="game-end__body_result_reward_spd">
									<span style={{ width: 64 }}>SPD</span>
									<div className="number-box">
										{player.stat.spd -
											(postGameDetail?.statGain.spd ?? 0)}
									</div>
									<span>{">"}</span>
									<div className="number-box">
										{player.stat.spd}
									</div>
								</div>
								<div className="game-end__body_result_reward_hp">
									<span style={{ width: 64 }}>HP</span>
									<div className="number-box">
										{player.stat.hp -
											(postGameDetail?.statGain.hp ?? 0)}
									</div>
									<span>{">"}</span>
									<div className="number-box">
										{player.stat.hp}
									</div>
								</div>
							</>
						)}
					</div>
				</div>

				<div className="game-end__body_menu">
					<h2>What is your next move ?</h2>

					<div className="game-end__body_menu_button">
						{type === "campaign" && (
							<button onClick={handleClickContinue}>
								Continue
							</button>
						)}
						<button onClick={handleClickPlayAgain}>Rematch</button>
						<button onClick={handleClickBackToMenu}>
							Back to menu
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default GameEnd;
