import { useNavigate } from "react-router-dom";
import "./NavBar.css";
import type { AppDispatch, RootState } from "../../store";
import { useEffect } from "react";
import { fetchPlayer } from "../../store/slices/playerSlice";
import { useDispatch, useSelector } from "react-redux";
import LevelBar from "./LevelBar";

type NavBarProps = {
	BackPath?: string;
};
const NavBar = ({ BackPath }: NavBarProps) => {
	const navigate = useNavigate();
	const dispatch: AppDispatch = useDispatch();

	useEffect(() => {
		const token = localStorage.getItem("authToken");
		if (token) {
			dispatch(fetchPlayer());
		}
	}, [dispatch]);

	const player = useSelector((state: RootState) => state.player);

	const handleClickBack = () => {
		navigate(BackPath??"/");
	};

	const handleClickLogout = () => {
		navigate("/login");
		localStorage.clear();
	};

	const isLoggedIn = player.id !== "";

	if (isLoggedIn) {
		return (
			<div className="NavBar">
				<div className="NavBar__left-side">
					{BackPath ? (
						<button onClick={handleClickBack}>Back</button>
					) : (
						<img src="/others/LogoSmall.svg" />
					)}
				</div>
				<div className="NavBar__right-side">
					<LevelBar
						level={player.level}
						currentExp={player.exp}
						nextLevelExp={50 + player.level * 50}
						playerClass={player.class}
					/>
					<div className="NavBar__right-side_point">
						{player.statPoint} P
					</div>
					<div className="NavBar__right-side_gold">
						{player.gold} G
					</div>
					<div className="NavBar__right-side_username">
						{player.username}
					</div>
					<button onClick={handleClickLogout}>Logout</button>
				</div>
			</div>
		);
	}

	return (
		<div className="NavBar">
			<img src="/others/LogoSmall.svg" />
		</div>
	);
};
export default NavBar;
