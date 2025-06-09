import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import BotBattle from "./pages/BotBattle";
import { useSelector } from "react-redux";
import type { RootState } from "./store";
import SelectLevel from "./pages/SelectLevel";
import Lobby from "./pages/PVPLobby/Lobby";
import Login from "./pages/Login/Login";
import NewHome from "./pages/NewHome";
import NewLogin from "./pages/Login copy";
import Upgrade from "./pages/Upgrade";

function App() {
  const userId = useSelector((state: RootState) => state.player.player?.id);
  console.log(userId);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<NewHome />} />
        <Route path="/test" element={<Home />} />
        <Route path="/bot-battle/:levelId" element={<BotBattle />} />
        <Route path="/level" element={<SelectLevel />} />
        <Route path="/lobby/:id" element={<Lobby />} />
        <Route path="/login" element={<NewLogin />} />
        <Route path="/login-test" element={<Login />} />
        <Route path="/test" element={<NewHome />} />
        <Route path="/upgrade" element={<Upgrade />} />
        {/* <Route path="/bot-battle" element={userId ? <BotBattle userId={userId} /> : <div>กรุณาเข้าสู่ระบบก่อน</div>} /> */}
      </Routes>
    </Router>
  );
}
export default App;
