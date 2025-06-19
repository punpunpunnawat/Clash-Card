import { useEffect, useState } from "react";
import NavBar from "../../components/NavBar";
import "./SelectClass.css";
import { playBGM } from "../../managers/soundManager";

type SelectClassProps = {
	onSelectWarrior?: () => void;
	onSelectMage?: () => void;
	onSelectAssassin?: () => void;
};

const SelectClass = ({
	onSelectWarrior,
	onSelectMage,
	onSelectAssassin,
}: SelectClassProps) => {
	type ClassType = "Warrior" | "Mage" | "Assassin";

	const [selectedClass, setSelectedClass] = useState<ClassType>("Warrior");

	const classData = {
		Warrior: {
			statPerLevel: { atk: 2, def: 2, spd: 1, hp: 20 },
			deck: { rock: 10, paper: 5, scissors: 5 },
			image: "WarriorCard.svg",
		},
		Mage: {
			statPerLevel: { atk: 2, def: 1, spd: 2, hp: 20 },
			deck: { rock: 5, paper: 10, scissors: 5 },
			image: "MageCard.svg",
		},
		Assassin: {
			statPerLevel: { atk: 2, def: 1, spd: 3, hp: 10 },
			deck: { rock: 5, paper: 5, scissors: 10 },
			image: "AssassinCard.svg",
		},
	};

	useEffect(() => {
		playBGM("menu");
	}, []);

	const handleSelectWarrior = () => {
		onSelectWarrior?.();
	};

	const handleSelectMage = () => {
		onSelectMage?.();
	};

	const handleSelectAssassin = () => {
		onSelectAssassin?.();
	};
	return (
		<div className="select-class">
			<NavBar />
			<div className="select-class__body">
				<h1>Select your starter class</h1>
				<div className="select-class__body_class-card">
					<div className="select-class__body_class-card_warrior">
						<label style={{ fontSize: 24 }}>Warrior</label>
						<img
							src="WarriorCard.svg"
							onClick={() => setSelectedClass("Warrior")}
						/>
						<button
							style={{ width: "100%" }}
							onClick={handleSelectWarrior}
						>
							SELECT
						</button>
					</div>
					<div className="select-class__body_class-card_mage">
						<label style={{ fontSize: 24 }}>Mage</label>
						<img
							src="MageCard.svg"
							onClick={() => setSelectedClass("Mage")}
						/>
						<button
							style={{ width: "100%" }}
							onClick={handleSelectMage}
						>
							SELECT
						</button>
					</div>
					<div className="select-class__body_class-card_assassin">
						<label style={{ fontSize: 24 }}>Assassin</label>
						<img
							src="AssassinCard.svg"
							onClick={() => setSelectedClass("Assassin")}
						/>
						<button
							style={{ width: "100%" }}
							onClick={handleSelectAssassin}
						>
							SELECT
						</button>
					</div>
				</div>
				<div className="select-class__body_detail">
					<div className="select-class__body_detail_stat">
						<div className="select-class__body_detail_stat_atk">
							<span style={{ fontSize: 24, width: 60 }}>ATK</span>
							<span style={{ fontSize: 24, width: 60 }}>20</span>
							<span style={{ fontSize: 24, width: 144 }}>
								+ {classData[selectedClass].statPerLevel.atk}
								/lvl
							</span>
						</div>
						<div className="select-class__body_detail_stat_def">
							<span style={{ fontSize: 24, width: 60 }}>DEF</span>
							<span style={{ fontSize: 24, width: 60 }}>10</span>
							<span style={{ fontSize: 24, width: 144 }}>
								+ {classData[selectedClass].statPerLevel.def}
								/lvl
							</span>
						</div>
						<div className="select-class__body_detail_stat_spd">
							<span style={{ fontSize: 24, width: 60 }}>SPD</span>
							<span style={{ fontSize: 24, width: 60 }}>10</span>
							<span style={{ fontSize: 24, width: 144 }}>
								+ {classData[selectedClass].statPerLevel.spd}
								/lvl
							</span>
						</div>
						<div className="select-class__body_detail_stat_hp">
							<span style={{ fontSize: 24, width: 60 }}>HP</span>
							<span style={{ fontSize: 24, width: 60 }}>50</span>
							<span style={{ fontSize: 24, width: 144 }}>
								+ {classData[selectedClass].statPerLevel.hp}/lvl
							</span>
						</div>
					</div>
					<div className="select-class__body_detail_active-class">
						<span
							className="side-text-left"
							style={{ fontSize: 24 }}
						>
							STAT
						</span>
						<img src={classData[selectedClass].image} />
						<span
							className="side-text-right"
							style={{ fontSize: 24 }}
						>
							DECK
						</span>
					</div>
					<div className="select-class__body_detail_card">
						<div className="select-class__body_detail_card_rock">
							<span style={{ fontSize: 24, width: 128 }}>
								Rock
							</span>
							<span style={{ fontSize: 24, width: 60 }}>
								x {classData[selectedClass].deck.rock}
							</span>
						</div>
						<div className="select-class__body_detail_card_paper">
							<span style={{ fontSize: 24, width: 128 }}>
								Paper
							</span>
							<span style={{ fontSize: 24, width: 60 }}>
								x {classData[selectedClass].deck.paper}
							</span>
						</div>
						<div className="select-class__body_detail_card_scissors">
							<span style={{ fontSize: 24, width: 128 }}>
								Scissors
							</span>
							<span style={{ fontSize: 24, width: 60 }}>
								x {classData[selectedClass].deck.scissors}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SelectClass;
