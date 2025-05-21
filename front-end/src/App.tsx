import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import BotBattle from "./pages/BotBattle/BotBattle";
import { useSelector } from "react-redux";
import type { RootState } from "./store";

function App() {
  const userId = useSelector((state: RootState) => state.player.player?.id);
  console.log(userId);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bot-battle" element={<BotBattle />} />

        {/* <Route path="/bot-battle" element={userId ? <BotBattle userId={userId} /> : <div>กรุณาเข้าสู่ระบบก่อน</div>} /> */}
      </Routes>
    </Router>
  );
}
export default App;
