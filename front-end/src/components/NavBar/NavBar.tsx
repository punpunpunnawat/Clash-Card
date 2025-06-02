import { useNavigate } from "react-router-dom";
import "./NavBar.css";

type NavBarProps = {
	BackLabel?: string;
};
const NavBar = ({ BackLabel }: NavBarProps) => {
	const navigate = useNavigate();
	const onClickBack = () => {
		navigate(-1);
	};
	return (
		<div className="NavBar">
			<div className="NavBar__left-side">
				{BackLabel ? (
					<button onClick={onClickBack}>{BackLabel}</button>
				) : (
					<img src="/LogoSmall.svg" />
				)}
			</div>
			<div className="NavBar__right-side">
				<div>exp</div>
				<div>gold</div>
				<div>name</div>
				<button>logout</button>
			</div>
		</div>
	);
};

export default NavBar;
