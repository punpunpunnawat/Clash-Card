import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = async (userID: number) => {
    const res = await fetch("http://localhost:8080/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userID }),
    });

    const data = await res.json();
    localStorage.setItem("authToken", data.token);
    navigate("/");
  };

  return (
    <div>
      <h1>เลือก User เพื่อเข้าสู่ระบบ</h1>
      <button onClick={() => handleLogin(1)}>เข้าสู่ระบบด้วย User 1</button>
      <button onClick={() => handleLogin(2)}>เข้าสู่ระบบด้วย User 2</button>
    </div>
  );
}
