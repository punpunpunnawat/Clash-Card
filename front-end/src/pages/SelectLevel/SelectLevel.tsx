import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { fetchPlayer } from "../../store/slices/playerSlice";
import NavBar from "../../components/NavBar";
import "./SelectLevel.css";
import { playBGM } from "../../managers/soundManager";

const SelectLevel = () => {
	const dispatch: AppDispatch = useDispatch();
	useEffect(() => {
		dispatch(fetchPlayer());
	}, [dispatch]);

	const player = useSelector((state: RootState) => state.player);

	const navigate = useNavigate();

	useEffect(() => {
		playBGM("menu");
	}, []);
	console.log(player);

	const handleSelectLevel = (levelId: number) => {
		navigate(`/campaign/${levelId}`);
	};

	useEffect(() => {
		console.log(player);
	}, [player]);

	return (
		<div className="SelectLevel">
			<NavBar BackPath="/" />

			<div className="SelectLevel__body">
				<header className="SelectLevel__body_header">
					Campaign Level Select
				</header>

				<li className="SelectLevel__body_level-list">
					{player &&
						Array.from({ length: player.currentCampaignLevel }).map(
							(_, index) => {
								return (
									<button
										onClick={() =>
											handleSelectLevel(index + 1)
										}
									>
										Level {index + 1}
									</button>
								);
							}
						)}
				</li>
			</div>
		</div>
	);
};
export default SelectLevel;
