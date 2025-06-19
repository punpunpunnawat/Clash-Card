import type { CardCount } from "../../types/Pvp";
import type { PlayerClass, UnitStat } from "../../types/UnitStat";
import HealthBar from "../HealthBar";
import "./PlayerStatus.css";

type PlayerStatusProps = {
	currentHP: number;
	level: number;
	playerClass: PlayerClass;
	cardRemaining: CardCount;
	stat: UnitStat;
	trueSight: number;
	onClickPassive?: () => void;
};

const PlayerStatus = ({
	currentHP,
	level,
	playerClass,
	cardRemaining,
	stat,
	trueSight,
	onClickPassive,
}: PlayerStatusProps) => {
	const handleClickPassive = () => {
		onClickPassive?.();
	};

	return (
		<div className="player-status">
			<div className="player-status__hp">
				<HealthBar
					level={level}
					playerClass={playerClass}
					maxHP={stat.hp}
					currentHP={currentHP}
				/>
			</div>
			<div className="player-status__detail">
				<div className="player-status__detail_stat">
					<div className="player-status__detail_stat_atk">
						<img src="/icons/atk.svg" />
						<span style={{ flex: 1, textAlign: "center" }}>
							{stat.atk}
						</span>
					</div>
					<div className="player-status__detail_stat_def">
						<img src="/icons/def.svg" />
						<span style={{ flex: 1, textAlign: "center" }}>
							{stat.def}
						</span>
					</div>
					<div className="player-status__detail_stat_spd">
						<img src="/icons/spd.svg" />
						<span style={{ flex: 1, textAlign: "center" }}>
							{stat.spd}
						</span>
					</div>
				</div>
				<div className="player-status__detail_card">
					<div
						className="player-status__detail_card_rock"
						style={{
							background:
								cardRemaining.rock > 0
									? "rgb(70, 0, 0)"
									: "rgb(70, 70, 70)",
						}}
					>
						<img
							src={
								cardRemaining.rock > 0
									? "/icons/rock.svg"
									: "/icons/rock2.svg"
							}
						/>
						<span style={{ flex: 1, textAlign: "center" }}>
							{cardRemaining.rock}
						</span>
					</div>

					<div
						className="player-status__detail_card_paper"
						style={{
							background:
								cardRemaining.paper > 0
									? "rgb(0, 0, 70)"
									: "rgb(70, 70, 70)",
						}}
					>
						<img
							src={
								cardRemaining.paper > 0
									? "/icons/paper.svg"
									: "/icons/paper2.svg"
							}
						/>
						<span style={{ flex: 1, textAlign: "center" }}>
							{cardRemaining.paper}
						</span>
					</div>

					<div
						className="player-status__detail_card_scissors"
						style={{
							background:
								cardRemaining.scissors > 0
									? "rgb(70, 70, 0)"
									: "rgb(70, 70, 70)",
						}}
					>
						<img
							src={
								cardRemaining.scissors > 0
									? "/icons/scissors.svg"
									: "/icons/scissors2.svg"
							}
						/>
						<span style={{ flex: 1, textAlign: "center" }}>
							{cardRemaining.scissors}
						</span>
					</div>
				</div>
			</div>

			<div className="player-status__passive">
				<span className="player-status__passive_label">
					True Sight{" "}
				</span>
				<button
					onClick={handleClickPassive}
					disabled={trueSight <= 0 || !onClickPassive}
				>
					{trueSight}
				</button>
			</div>
		</div>
	);
};

export default PlayerStatus;
