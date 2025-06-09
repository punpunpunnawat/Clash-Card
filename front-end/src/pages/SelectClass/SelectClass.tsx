import NavBar from "../../components/NavBar";
import "./SelectClass.css";

const SelectClass = () => {
	return (
		<div className="select-class">
			<NavBar />
			<div className="select-class__body">
				<h1>Select your starter class</h1>
				<div className="select-class__body_class-card">
					<div className="select-class__body_class-card_warrior">
						<label style={{ fontSize: 24 }}>Warrior</label>
						<img src="WarriorCard.svg" />
						<button style={{ width: "100%" }}>SELECT</button>
					</div>
					<div className="select-class__body_class-card_mage">
						<label style={{ fontSize: 24 }}>Mage</label>
						<img src="MageCard.svg" />
						<button style={{ width: "100%" }}>SELECT</button>
					</div>
					<div className="select-class__body_class-card_assassin">
						<label style={{ fontSize: 24 }}>Assassin</label>
						<img src="AssassinCard.svg" />
						<button style={{ width: "100%" }}>SELECT</button>
					</div>
				</div>
				<div className="select-class__body_detail">
					<div className="select-class__body_detail_stat">
						<div className="select-class__body_detail_stat_atk">
							<span style={{ fontSize: 24, width: 60 }}>ATK</span>
							<span style={{ fontSize: 24, width: 60 }}>20</span>
							<span style={{ fontSize: 24, width: 144 }}>+2/lvl</span>
						</div>
						<div className="select-class__body_detail_stat_def">
							<span style={{ fontSize: 24, width: 60 }}>DEF</span>
							<span style={{ fontSize: 24, width: 60 }}>10</span>
							<span style={{ fontSize: 24, width: 144 }}>+2/lvl</span>
						</div>
						<div className="select-class__body_detail_stat_spd">
							<span style={{ fontSize: 24, width: 60 }}>SPD</span>
							<span style={{ fontSize: 24, width: 60 }}>10</span>
							<span style={{ fontSize: 24, width: 144 }}>+1/lvl</span>
						</div>
						<div className="select-class__body_detail_stat_hp">
							<span style={{ fontSize: 24, width: 60 }}>HP</span>
							<span style={{ fontSize: 24, width: 60 }}>00</span>
							<span style={{ fontSize: 24, width: 144 }}>+20/lvl</span>
						</div>
					</div>
					<div className="select-class__body_detail_active-class">
						<span className="side-text-left" style={{ fontSize: 24}}>STAT</span>
						<img src="WarriorCard.svg" />
						<span className="side-text-right" style={{ fontSize: 24}}>DECK</span>
					</div>
					<div className="select-class__body_detail_card">
						<div className="select-class__body_detail_card_rock">
							<span style={{ fontSize: 24, width: 128 }}>
								Rock
							</span>
							<span style={{ fontSize: 24, width: 60 }}>x 10</span>
						</div>
						<div className="select-class__body_detail_card_paper">
							<span style={{ fontSize: 24, width: 128 }}>
								Paper
							</span>
							<span style={{ fontSize: 24, width: 60 }}>x 5</span>
						</div>
						<div className="select-class__body_detail_card_scissors">
							<span style={{ fontSize: 24, width: 128 }}>
								Scissors
							</span>
							<span style={{ fontSize: 24, width: 60 }}>x 5</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SelectClass;
