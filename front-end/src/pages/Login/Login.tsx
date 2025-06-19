import { useNavigate } from "react-router-dom";
import "./Login.css";
import NavBar from "../../components/NavBar";
import { useEffect, useState } from "react";
import SelectClass from "../SelectClass";
import { stopBGM } from "../../managers/soundManager";

export default function Login() {

	useEffect(() => {
		stopBGM();
	},[])

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [mode, setMode] = useState<"login" | "register" | "selectClass">("login");

	const navigate = useNavigate();

	const handleLogin = async () => {
		try {
			const res = await fetch("http://localhost:8080/api/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			if (!res.ok) {
				const errorText = await res.text();
				console.error("Login failed:", errorText);
				alert(errorText);
				return;
			}

			const data = await res.json();
			localStorage.setItem("authToken", data.token);
			navigate("/");
		} catch (err) {
			console.error("Unexpected error:", err);
			alert("Something went wrong");
		}
	};

	const handleRegister = async () => {
		if (password !== confirmPassword) {
			alert("Passwords do not match");
			return;
		}

		try {
			const res = await fetch("http://localhost:8080/api/check-email", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			if (!res.ok) {
				const errMsg = await res.text();
				alert("Register failed: " + errMsg);
				return;
			}
			const data = await res.json();
			console.log(data)
			if(data) setMode("selectClass")
		} catch (err) {
			alert("Network error: " + err);
		}
	};


	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (mode === "login") handleLogin();
		else handleRegister();
	};

	const handleSelectClass = async (selectedClass: string) => {
				if (password !== confirmPassword) {
			alert("Passwords do not match");
			return;
		}
		console.log(email, password, selectedClass)
		try {
			const res = await fetch("http://localhost:8080/api/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password, class: selectedClass }),
			});

			if (!res.ok) {
				const errMsg = await res.text();
				alert("Register failed: " + errMsg);
				return;
			}

			const data = await res.json();
			console.log(data)
			localStorage.setItem("authToken", data.token);
			navigate("/");
		} catch (err) {
			alert("Network error: " + err);
		}
	}

	if(mode==="selectClass") return (
		<div>
			<SelectClass onSelectWarrior={() => handleSelectClass("warrior")} onSelectMage={() => handleSelectClass("mage")} onSelectAssassin={() => handleSelectClass("assassin")}/>
		</div>
	)
	return (
		<div className="Login">
			<NavBar />
			<div className="Login__body">
				<section className="Login__body_logo">
					<img src="others/LogoBig.svg" alt="Logo" />
				</section>
				<section className="Login__body_main">
					<div className="Login__body_main_select-mode">
						<button
							style={{ flex: 1 }}
							onClick={() => setMode("login")}
						>
							Login
						</button>
						<button
							style={{ flex: 1 }}
							onClick={() => setMode("register")}
						>
							Register
						</button>
					</div>

					<form
						className="Login__body_main_form"
						onSubmit={handleSubmit}
					>
						<input
							type="email"
							placeholder="EMAIL"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
						<input
							type="password"
							placeholder="PASSWORD"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
						{mode === "register" && (
							<input
								type="password"
								placeholder="CONFIRM PASSWORD"
								value={confirmPassword}
								onChange={(e) =>
									setConfirmPassword(e.target.value)
								}
								required
							/>
						)}

						<button
							type="submit"
							style={{ borderRadius: 16, marginTop: "1rem" }}
						>
							{mode === "login" ? "Login" : "Register"}
						</button>
					</form>
				</section>
			</div>
		</div>
	);
}
