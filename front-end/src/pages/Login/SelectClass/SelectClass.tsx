import { useEffect, useState } from "react";
import NavBar from "../../../components/NavBar";
import "./SelectClass.css";
import { playBGM } from "../../../managers/soundManager";

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
			image: "cards/WarriorCard.svg",
			skill: "When drawing with Rock, deal half of your damage. (always hit)",
		},
		Mage: {
			statPerLevel: { atk: 2, def: 1, spd: 2, hp: 20 },
			deck: { rock: 5, paper: 10, scissors: 5 },
			image: "cards/MageCard.svg",
			skill: "When winning with Paper, gain 1 True Sight token. Use to reveal opponent's hand.",
		},
		Assassin: {
			statPerLevel: { atk: 2, def: 1, spd: 3, hp: 10 },
			deck: { rock: 5, paper: 5, scissors: 10 },
			image: "cards/AssassinCard.svg",
			skill: "When winning with Scissors, ignore the opponent’s defense. (always hit)",
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
			<NavBar showDetail={false}/>
			<div className="select-class__body">
				<h1>Select your starter class</h1>
				<div className="select-class__body_class-card">
					<div className="select-class__body_class-card_warrior">
						<label style={{ fontSize: 24 }}>Warrior</label>
						<img
							src="cards/WarriorCard.svg"
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
							src="cards/MageCard.svg"
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
							src="cards/AssassinCard.svg"
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
					<div className="select-class__body_detail_active-class">
						<img src={classData[selectedClass].image} />
					</div>

					<div className="select-class__body_detail_skill">
						<h4>Deck</h4>
						<div className="select-class__body_detail_skill_explain">
							<span>{classData[selectedClass].skill}</span>
						</div>
					</div>

					<div className="select-class__body_detail_stat">
						<h4>Stat</h4>
						<div className="select-class__body_detail_stat_quantity">
							<div className="select-class__body_detail_stat_quantity_atk">
								<span
									style={{
										fontSize: 16,
										width: 32,
										textAlign: "start",
									}}
								>
									ATK
								</span>
								<span className="number-box">20</span>
								<span
									style={{
										fontSize: 16,
										width: 96,
										textAlign: "end",
									}}
								>
									+{" "}
									{classData[selectedClass].statPerLevel.atk}
									/lvl
								</span>
							</div>
							<div className="select-class__body_detail_stat_quantity_def">
								<span
									style={{
										fontSize: 16,
										width: 32,
										textAlign: "start",
									}}
								>
									DEF
								</span>
								<span className="number-box">10</span>
								<span
									style={{
										fontSize: 16,
										width: 96,
										textAlign: "end",
									}}
								>
									+{" "}
									{classData[selectedClass].statPerLevel.def}
									/lvl
								</span>
							</div>
							<div className="select-class__body_detail_stat_quantity_spd">
								<span
									style={{
										fontSize: 16,
										width: 32,
										textAlign: "start",
									}}
								>
									SPD
								</span>
								<span className="number-box">10</span>
								<span
									style={{
										fontSize: 16,
										width: 96,
										textAlign: "end",
									}}
								>
									+{" "}
									{classData[selectedClass].statPerLevel.spd}
									/lvl
								</span>
							</div>
							<div className="select-class__body_detail_stat_quantity_hp">
								<span
									style={{
										fontSize: 16,
										width: 32,
										textAlign: "start",
									}}
								>
									HP
								</span>
								<span className="number-box">50</span>
								<span
									style={{
										fontSize: 16,
										width: 96,
										textAlign: "end",
									}}
								>
									+ {classData[selectedClass].statPerLevel.hp}
									/lvl
								</span>
							</div>
						</div>
					</div>

					<div className="select-class__body_detail_card">
						<h4>Deck</h4>
						<div className="select-class__body_detail_card_quantity">
							<div className="select-class__body_detail_card_quantity_rock">
								<span
									style={{
										fontSize: 16,
										width: 128,
										textAlign: "start",
									}}
								>
									Rock Card
								</span>
								<span
									className="number-box"
									style={{ width: 16 }}
								>
									{classData[selectedClass].deck.rock}
								</span>
							</div>
							<div className="select-class__body_detail_card_quantity_paper">
								<span
									style={{
										fontSize: 16,
										width: 128,
										textAlign: "start",
									}}
								>
									Paper Card
								</span>
								<span
									className="number-box"
									style={{ width: 16 }}
								>
									{classData[selectedClass].deck.paper}
								</span>
							</div>
							<div className="select-class__body_detail_card_quantity_scissors">
								<span
									style={{
										fontSize: 16,
										width: 128,
										textAlign: "start",
									}}
								>
									Scissors Card
								</span>
								<span
									className="number-box"
									style={{ width: 16 }}
								>
									{classData[selectedClass].deck.scissors}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SelectClass;
