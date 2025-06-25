import { useEffect } from "react";
import NavBar from "../../components/NavBar";
import "./Upgrade.css";
import { useDispatch, useSelector } from "react-redux";
import { fetchPlayer } from "../../store/slices/playerSlice";
import type { AppDispatch, RootState } from "../../store";
import { fetchDeck } from "../../store/slices/deckSlice";
import { buyCard, changeClass, upgradeStat } from "../../api/api";

const Upgrade = () => {
  const dispatch: AppDispatch = useDispatch();
  const player = useSelector((state: RootState) => state.player);
  const deck = useSelector((state: RootState) => state.deck);

  useEffect(() => {
    dispatch(fetchPlayer());
    dispatch(fetchDeck());
  }, [dispatch]);

  const token = localStorage.getItem("authToken") || "";

  const handleClickChangeClass = async (newClass: string) => {
    try {
      await changeClass(newClass, token);
      await dispatch(fetchPlayer());
    } catch (err) {
      console.error("Change class failed", err);
    }
  };

  const handleClickUpgradeStat = async (statType: string) => {
    try {
      await upgradeStat(statType, token);
      await dispatch(fetchPlayer());
    } catch (err) {
      console.error("Upgrade stat failed", err);
    }
  };

  const handleClickBuyCard = async (cardType: string) => {
    try {
      await buyCard(cardType, token);
      await dispatch(fetchDeck());
      await dispatch(fetchPlayer());
    } catch (err) {
      console.error("Buy card failed", err);
    }
  };
	return (
		<div className="upgrade">
			<NavBar backPath="/" />
			<div className="upgrade__body">
				<h1>Upgrade and buy card</h1>
				<div className="upgrade__body_class-card">
					{player?.class === "warrior" ? (
						<div className="upgrade__body_class-card_warrior">
							<label style={{ fontSize: 24 }}>Warrior</label>
							<img src="cards/WarriorCard.svg" />
							<button style={{ width: "100%" }} disabled>
								Active
							</button>
						</div>
					) : (
						<div className="upgrade__body_class-card_warrior">
							<label style={{ fontSize: 24 }}>Warrior</label>
							<img
								src="cards/WarriorCard.svg"
								style={{ opacity: 0.5 }}
							/>
							<button style={{ width: "100%" }} onClick={() => handleClickChangeClass("warrior")}>1000 G</button>
						</div>
					)}

					{player?.class === "mage" ? (
						<div className="upgrade__body_class-card_mage">
							<label style={{ fontSize: 24 }}>Mage</label>
							<img src="cards/MageCard.svg" />
							<button style={{ width: "100%" }} disabled>
								Active
							</button>
						</div>
					) : (
						<div className="upgrade__body_class-card_mage">
							<label style={{ fontSize: 24 }}>Mage</label>
							<img
								src="cards/MageCard.svg"
								style={{ opacity: 0.5 }}
							/>
							<button style={{ width: "100%" }} onClick={() => handleClickChangeClass("mage")}>1000 G</button>
						</div>
					)}

					{player?.class === "assassin" ? (
						<div className="upgrade__body_class-card_assassin">
							<label style={{ fontSize: 24 }}>Assassin</label>
							<img src="cards/AssassinCard.svg" />
							<button style={{ width: "100%" }} disabled>
								Active
							</button>
						</div>
					) : (
						<div className="upgrade__body_class-card_assassin">
							<label style={{ fontSize: 24 }}>Assassin</label>
							<img
								src="cards/AssassinCard.svg"
								style={{ opacity: 0.5 }}
							/>
							<button style={{ width: "100%" }} onClick={() => handleClickChangeClass("assassin")}>1000 G</button>
						</div>
					)}
				</div>

				<div className="select-class__body_detail">
					<div className="select-class__body_detail_skill">
						<h4>Skill</h4>
						<div className="select-class__body_detail_skill_explain">
							<span>
								{player.class === "warrior"
									? "When drawing with Rock, deal half of your damage. (always hit)"
									: player.class === "mage"
									? "When winning with Paper, gain 1 True Sight token. Use to reveal opponent's hand."
									: "When winning with Scissors, ignore the opponent’s defense. (always hit)"}
							</span>
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
								<span className="number-box">
									{player.stat.atk}
								</span>
								<span
									style={{
										fontSize: 16,
										width: 96,
										textAlign: "end",
									}}
								>
									<button
										onClick={() =>
											handleClickUpgradeStat("atk")
										}
									>
										1 P
									</button>
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
								<span className="number-box">
									{player.stat.def}
								</span>
								<span
									style={{
										fontSize: 16,
										width: 96,
										textAlign: "end",
									}}
								>
									<button
										onClick={() =>
											handleClickUpgradeStat("def")
										}
									>
										1 P
									</button>
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
								<span className="number-box">
									{player.stat.spd}
								</span>
								<span
									style={{
										fontSize: 16,
										width: 96,
										textAlign: "end",
									}}
								>
									<button
										onClick={() =>
											handleClickUpgradeStat("spd")
										}
									>
										1 P
									</button>
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
								<span className="number-box">
									{player.stat.hp}
								</span>
								<span
									style={{
										fontSize: 16,
										width: 96,
										textAlign: "end",
									}}
								>
									<button
										onClick={() =>
											handleClickUpgradeStat("hp")
										}
									>
										1 P
									</button>
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
									{deck.rock}
								</span>
								<button
									onClick={() => handleClickBuyCard("rock")}
								>
									500 G
								</button>
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
									{deck.paper}
								</span>
								<button
									onClick={() => handleClickBuyCard("paper")}
								>
									500 G
								</button>
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
									{deck.scissors}
								</span>
								<button
									onClick={() =>
										handleClickBuyCard("scissors")
									}
								>
									500 G
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Upgrade;
