import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import type { AppDispatch } from "../../store";

import "./Login.css";

import NavBar from "../../components/NavBar";
import ErrorOverlay from "../../components/ErrorOverlay";
import SelectClass from "./SelectClass";

import { stopBGM } from "../../managers/soundManager";
import { fetchPlayer } from "../../store/slices/playerSlice";
import { checkEmail, login, register } from "../../api/api";

export default function Login() {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register" | "selectClass">("login");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // dispatch(fetchPlayer());
    stopBGM();
  }, []);

  const handleLogin = async () => {
    try {
      const data = await login(email, password);
      localStorage.clear();
      localStorage.setItem("authToken", data.token);
      await dispatch(fetchPlayer());
      navigate("/");
    } catch (err) {
      console.error("Login failed:", err);
      setErrorMessage(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setErrorMessage("Password do not match");
      return;
    }

    try {
      const data = await checkEmail(email);
      if (data.exists === true) {
        setErrorMessage("Email already in use");
      } else {
        setMode("selectClass");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") handleLogin();
    else handleRegister();
  };

  const handleSelectClass = async (selectedClass: string) => {
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }
    try {
      const data = await register(username, email, password, selectedClass);
      localStorage.setItem("authToken", data.token);
      await dispatch(fetchPlayer());
      navigate("/");
    } catch (err) {
      setErrorMessage(
        "Register failed: " + (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  if (mode === "selectClass")
    return (
      <div>
        <SelectClass
          onSelectWarrior={() => handleSelectClass("warrior")}
          onSelectMage={() => handleSelectClass("mage")}
          onSelectAssassin={() => handleSelectClass("assassin")}
        />
      </div>
    );

  return (
    <div className="Login">
      <NavBar showDetail={false} />
      <div className="Login__body">
        <section className="Login__body_logo">
          <img src="others/LogoBig.svg" alt="Logo" />
        </section>
        <section className="Login__body_main">
          <div className="Login__body_main_select-mode">
            <button
              style={{
                flex: 1,
                boxShadow: mode == "login" ? undefined : "none",
                backgroundColor: mode == "login" ? undefined : "transparent",
              }}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              style={{
                flex: 1,
                boxShadow: mode == "register" ? undefined : "none",
                backgroundColor: mode == "register" ? undefined : "transparent",
              }}
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>

          <form className="Login__body_main_form" onSubmit={handleSubmit}>
            {mode === "register" && (
              <input
                type="text"
                placeholder="USERNAME"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            )}
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
              minLength={6}
            />
            {mode === "register" && (
              <input
                type="password"
                placeholder="CONFIRM PASSWORD"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
      {errorMessage && (
        <ErrorOverlay message={errorMessage} onClose={() => setErrorMessage(null)} />
      )}
    </div>
  );
}
