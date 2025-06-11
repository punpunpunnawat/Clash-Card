import { useEffect } from "react";
import NavBar from "../../components/NavBar";
import "./Upgrade.css";
import { useDispatch, useSelector } from "react-redux";
import { fetchPlayer } from "../../store/slices/playerSlice";
import type { AppDispatch, RootState } from "../../store";

const Upgrade = () => {
	const dispatch: AppDispatch = useDispatch();
	useEffect(() => {
		dispatch(fetchPlayer());
	}, [dispatch]);

	const player = useSelector((state: RootState) => state.player.player);
	console.log(player);

	return (
		<div className="Upgrade">
			<NavBar />
			<div className="Upgrade__body">
				<h1>Upgrade and buy card</h1>
				<div className="Upgrade__body_class-card">
					{player?.class === "warrior" ? (
						<div className="Upgrade__body_class-card_warrior">
							<label style={{ fontSize: 24 }}>Warrior</label>
							<img src="WarriorCard.svg" />
							<button style={{ width: "100%" }} disabled>Active</button>
						</div>
					) : (
						<div className="Upgrade__body_class-card_warrior">
							<label style={{ fontSize: 24 }}>Warrior</label>
							<img
								src="WarriorCard.svg"
								style={{ opacity: 0.5 }}
							/>
							<button style={{ width: "100%" }}>
								1000 G
							</button>
						</div>
					)}

					{player?.class === "mage" ? (
						<div className="Upgrade__body_class-card_warrior">
							<label style={{ fontSize: 24 }}>Mage</label>
							<img src="MageCard.svg" />
							<button style={{ width: "100%" }} disabled>Active</button>
						</div>
					) : (
						<div className="Upgrade__body_class-card_warrior">
							<label style={{ fontSize: 24 }}>Mage</label>
							<img
								src="MageCard.svg"
								style={{ opacity: 0.5 }}
							/>
							<button style={{ width: "100%" }}>
								1000 G
							</button>
						</div>
					)}

					{player?.class === "assassin" ? (
						<div className="Upgrade__body_class-card_warrior">
							<label style={{ fontSize: 24 }}>Assassin</label>
							<img src="AssassinCard.svg" />
							<button style={{ width: "100%" }} disabled>Active</button>
						</div>
					) : (
						<div className="Upgrade__body_class-card_warrior">
							<label style={{ fontSize: 24 }}>Assassin</label>
							<img
								src="AssassinCard.svg"
								style={{ opacity: 0.5 }}
							/>
							<button style={{ width: "100%" }}>
								1000 G
							</button>
						</div>
					)}
				</div>
				<div className="Upgrade__body_detail">
					<div className="Upgrade__body_detail_stat">
						<div className="Upgrade__body_detail_stat_atk">
							<span style={{ fontSize: 24, width: 60 }}>ATK</span>
							<span style={{ fontSize: 24, width: 60 }}>{player?.stat.atk}</span>
							<button>1 P</button>
						</div>
						<div className="Upgrade__body_detail_stat_def">
							<span style={{ fontSize: 24, width: 60 }}>DEF</span>
							<span style={{ fontSize: 24, width: 60 }}>{player?.stat.def}</span>
							<button>1 P</button>
						</div>
						<div className="Upgrade__body_detail_stat_spd">
							<span style={{ fontSize: 24, width: 60 }}>SPD</span>
							<span style={{ fontSize: 24, width: 60 }}>{player?.stat.spd}</span>
							<button>1 P</button>
						</div>
						<div className="Upgrade__body_detail_stat_hp">
							<span style={{ fontSize: 24, width: 60 }}>HP</span>
							<span style={{ fontSize: 24, width: 60 }}>{player?.stat.hp}</span>
							<button>1 P</button>
						</div>
					</div>
					<div className="Upgrade__body_detail_active-class">
						<span
							className="side-text-left"
							style={{ fontSize: 24 }}
						>
							STAT
						</span>
						<img src="WarriorCard.svg" />
						<span
							className="side-text-right"
							style={{ fontSize: 24 }}
						>
							DECK
						</span>
					</div>
					<div className="Upgrade__body_detail_card">
						<div className="Upgrade__body_detail_card_rock">
							<span style={{ fontSize: 24, width: 128 }}>
								Rock
							</span>
							<span style={{ fontSize: 24, width: 60 }}>x 0</span>
							<button>500 G</button>
						</div>
						<div className="Upgrade__body_detail_card_paper">
							<span style={{ fontSize: 24, width: 128 }}>
								Paper
							</span>
							<span style={{ fontSize: 24, width: 60 }}>x 0</span>
							<button>500 G</button>
						</div>
						<div className="Upgrade__body_detail_card_scissors">
							<span style={{ fontSize: 24, width: 128 }}>
								Scissors
							</span>
							<span style={{ fontSize: 24, width: 60 }}>x 0</span>
							<button>500 G</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Upgrade;
