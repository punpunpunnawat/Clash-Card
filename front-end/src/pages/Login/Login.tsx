import { useNavigate } from "react-router-dom";
import "./Login.css";
import NavBar from "../../components/NavBar";
import { useState } from "react";
export default function Login() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [mode, setMode] = useState("login");

	const navigate = useNavigate();

	const handleLogin = () => {
		navigate("/");
	};

	return (
		<div className="Login">
			<NavBar />
			<div className="Login__body">
				<section className="Login__body_logo">
					<img src="LogoBig.svg"></img>
				</section>
				<section className="Login__body_main">
					<div className="Login__body_main_select-mode">
						<button style={{ flex: 1 }} onClick={() => setMode("login")}>Login</button>
						<button style={{ flex: 1 }} onClick={() => setMode("register")}>Register</button>
					</div>
					<form className="Login__body_main_form">
						<input
							type="email"
							placeholder="EMAIL"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
						<input
							type="password"
							placeholder="PASSWORD"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
						{mode === "register" && (
							<input
								type="password"
								placeholder="CONFIRM PASSWORD"
								value={confirmPassword}
								onChange={(e) =>
									setConfirmPassword(e.target.value)
								}
							/>
						)}
					</form>
					<button onClick={handleLogin} style={{ borderRadius: 16 }}>
						Login
					</button>
				</section>
			</div>
		</div>
	);
}
