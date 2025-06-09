import { useNavigate } from "react-router-dom";
import MenuCard from "../../components/MenuCard/MenuCard";
import NavBar from "../../components/NavBar";
import "./Home.css";
const NewHome = () => {
    
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
        navigate("/select-level");
    };


    return (
        <div className="NewHome">
            <NavBar />
            <div className="NewHome__body">
                <div className="NewHome__body_Logo">
                    <img src="/LogoBig.svg" />
                </div>
                <div className="NewHome__body_MenuCard">
                    <MenuCard type={"Campaign"} onClick={handleOnClickCampaign}/>
                    <MenuCard type={"PvP"} onClick={handleOnClickPvP}/>
                    <MenuCard type={"Upgrade"} onClick={handleOnClickUpgrade}/>
                </div>
            </div>
        </div>
    );
};
export default NewHome;
