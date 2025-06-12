import { useNavigate } from "react-router-dom";
import MenuCard from "../../components/MenuCard/MenuCard";
import NavBar from "../../components/NavBar";
import "./Home.css";
import type { AppDispatch, RootState } from "../../store";
import { useEffect } from "react";
import { fetchPlayer } from "../../store/slices/playerSlice";
import { useDispatch, useSelector } from "react-redux";
const Home = () => {
	const dispatch: AppDispatch = useDispatch();

	useEffect(() => {
		dispatch(fetchPlayer());
	}, [dispatch]);
	const player = useSelector((state: RootState) => state.player);

	const navigate = useNavigate();
	const handleOnClickCampaign = () => {
		if (player.class === "none") {
			navigate("/level");
		} else {
			navigate("select-class");
		}
	};

	const handleOnClickPvP = () => {
		const lobbyID = "lobby1";
		if (lobbyID.trim()) {
			navigate(`/lobby/${lobbyID.trim()}`);
		}
	};

	const handleOnClickUpgrade = () => {
		navigate("/upgrade");
	};

	return (
		<div className="Home">
			<NavBar />
			<div className="Home__body">
				<div className="Home__body_Logo">
					<img src="/LogoBig.svg" />
				</div>
				<div className="Home__body_MenuCard">
					<MenuCard
						type={"Campaign"}
						onClick={handleOnClickCampaign}
					/>
					<MenuCard type={"PvP"} onClick={handleOnClickPvP} />
					<MenuCard type={"Upgrade"} onClick={handleOnClickUpgrade} />
				</div>
			</div>
		</div>
	);
};
export default Home;
