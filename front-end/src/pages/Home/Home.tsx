import { useNavigate } from "react-router-dom";
import MenuCard from "../../components/MenuCard/MenuCard";
import NavBar from "../../components/NavBar";
import "./Home.css";
import type { AppDispatch } from "../../store";
import { useEffect } from "react";
import { fetchPlayer } from "../../store/slices/playerSlice";
import { useDispatch } from "react-redux";
const Home = () => {
	const dispatch: AppDispatch = useDispatch();

	useEffect(() => {
		const token = localStorage.getItem("authToken");
		if (token) {
			dispatch(fetchPlayer());
		}
	}, [dispatch]);

	const navigate = useNavigate();
	const handleOnClickCampaign = () => {
		navigate("/level");
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
