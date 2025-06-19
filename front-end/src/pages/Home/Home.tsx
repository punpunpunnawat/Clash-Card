import { useNavigate } from "react-router-dom";
import MenuCard from "../../components/MenuCard/MenuCard";
import NavBar from "../../components/NavBar";
import "./Home.css";
import type { AppDispatch } from "../../store";
import { useEffect, useState } from "react";
import { fetchPlayer } from "../../store/slices/playerSlice";
import { useDispatch } from "react-redux";
import { playBGM } from "../../managers/soundManager";

const Home = () => {
	const dispatch: AppDispatch = useDispatch();

	const [toggleOverlay, setToggleOverlay] = useState(false);
	const [lobbyID, setLobbyID] = useState("");

	useEffect(() => {
		playBGM("menu");
	}, []);

	useEffect(() => {
		const token = localStorage.getItem("authToken");
		if (token) {
			dispatch(fetchPlayer());
		}
	}, [dispatch]);

	const navigate = useNavigate();

	const handleClickCampaign = () => {
		navigate("/level");
	};

	const handleClickPvP = () => {
		setToggleOverlay(true);
	};

	const handleClickUpgrade = () => {
		navigate("/upgrade");
	};

	const handleClickConfirmPvP = () => {
		if (lobbyID.trim()) {
			navigate(`/lobby/${lobbyID.trim()}`);
		}
	};

	const handleClickCloseOverlay = () => {
		setToggleOverlay(false);
		setLobbyID("");
	};

	return (
		<div className="Home">
	
			{toggleOverlay && (
				<div className="Home__overlay">
					<img
						className="Home__overlay__close"
						src="icons/close.svg"
						onClick={handleClickCloseOverlay}
					/>
					<input
						type="text"
						placeholder="LOBBY ID"
						value={lobbyID}
						onChange={(e) => setLobbyID(e.target.value)}
						required
					/>
					<button onClick={handleClickConfirmPvP}>confirm</button>
				</div>
			)}
			<NavBar />
			<div className="Home__body">
				<div className="Home__body_Logo">
					<img src="others/LogoBig.svg" />
				</div>
				<div className="Home__body_MenuCard">
					<MenuCard type={"Campaign"} onClick={handleClickCampaign} />
					<MenuCard type={"PvP"} onClick={handleClickPvP} />
					<MenuCard type={"Upgrade"} onClick={handleClickUpgrade} />
				</div>
			</div>
		</div>
	);
};
export default Home;
