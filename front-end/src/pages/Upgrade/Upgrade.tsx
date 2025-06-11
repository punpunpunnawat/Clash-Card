import { useEffect } from "react";
import NavBar from "../../components/NavBar";
import "./Upgrade.css";
import { useDispatch, useSelector } from "react-redux";
import { fetchPlayer } from "../../store/slices/playerSlice";
import type { AppDispatch, RootState } from "../../store";
import { fetchDeck } from "../../store/slices/deckSlice";

const Upgrade = () => {
	const dispatch: AppDispatch = useDispatch();
	useEffect(() => {
		dispatch(fetchPlayer());
		dispatch(fetchDeck());
	}, [dispatch]);

	const player = useSelector((state: RootState) => state.player);
	const deck = useSelector((state: RootState) => state.deck)
	console.log(player);
	console.log(deck);

	const handleClickUpgradeStat = async (statType: string) => {
  try {
    const res = await fetch("http://localhost:8080/api/upgrade-stat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({ type: statType }), // เช่น { type: "atk" }
    });

    if (!res.ok) throw new Error("Upgrade failed");

    await dispatch(fetchPlayer()); // ดึง stat ใหม่มาโชว์
  } catch (err) {
    console.error(err);
  }
};

const handleClickBuyCard = async (cardType: string) => {
  try {
    const res = await fetch("http://localhost:8080/api/buy-card", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({ type: cardType }), // เช่น { type: "rock" }
    });

    if (!res.ok) throw new Error("Buy failed");

    await dispatch(fetchDeck()); // ดึง deck ใหม่
    await dispatch(fetchPlayer()); // เผื่อมีหัก gold ด้วย
  } catch (err) {
    console.error(err);
  }
};

	return (
		<div className="Upgrade">
			<NavBar BackLabel="Back"/>
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
							<button onClick={() => handleClickUpgradeStat("atk")}>1 P</button>
						</div>
						<div className="Upgrade__body_detail_stat_def">
							<span style={{ fontSize: 24, width: 60 }}>DEF</span>
							<span style={{ fontSize: 24, width: 60 }}>{player?.stat.def}</span>
							<button onClick={() => handleClickUpgradeStat("def")}>1 P</button>
						</div>
						<div className="Upgrade__body_detail_stat_spd">
							<span style={{ fontSize: 24, width: 60 }}>SPD</span>
							<span style={{ fontSize: 24, width: 60 }}>{player?.stat.spd}</span>
							<button onClick={() => handleClickUpgradeStat("spd")}>1 P</button>
						</div>
						<div className="Upgrade__body_detail_stat_hp">
							<span style={{ fontSize: 24, width: 60 }}>HP</span>
							<span style={{ fontSize: 24, width: 60 }}>{player?.stat.hp}</span>
							<button onClick={() => handleClickUpgradeStat("hp")}>1 P</button>
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
							<span style={{ fontSize: 24, width: 60 }}>x {deck.rock}</span>
							<button onClick={() => handleClickBuyCard("rock")}>500 G</button>
						</div>
						<div className="Upgrade__body_detail_card_paper">
							<span style={{ fontSize: 24, width: 128 }}>
								Paper
							</span>
							<span style={{ fontSize: 24, width: 60 }}>x {deck.paper}</span>
							<button onClick={() => handleClickBuyCard("paper")}>500 G</button>
						</div>
						<div className="Upgrade__body_detail_card_scissors">
							<span style={{ fontSize: 24, width: 128 }}>
								Scissors
							</span>
							<span style={{ fontSize: 24, width: 60 }}>x {deck.scissors}</span>
							<button onClick={() => handleClickBuyCard("scissors")}>500 G</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Upgrade;
