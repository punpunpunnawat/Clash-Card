import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "./store";
import Home from "./pages/Home";
import SelectLevel from './pages/SelectLevel';
import Login from "./pages/Login";
import OldLogin from "./pages/OldLogin";
import Upgrade from "./pages/Upgrade";
import SelectClass from "./pages/SelectClass";
import { Campaign, PvP } from "./pages/Battle";

function App() {
  const userId = useSelector((state: RootState) => state.player?.id);
  console.log(userId);
  return (
    <>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/campaign/:levelId" element={<Campaign />} />
        <Route path="/level" element={<SelectLevel />} />
        <Route path="/lobby/:id" element={<PvP />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login-test" element={<OldLogin />} />
        <Route path="/upgrade" element={<Upgrade />} />
        <Route path="/select-class" element={<SelectClass />} />
        {/* <Route path="/bot-battle" element={userId ? <BotBattle userId={userId} /> : <div>กรุณาเข้าสู่ระบบก่อน</div>} /> */}
      </Routes>
    </Router>
    </>
    
  );
}
export default App;
