import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";

import Home from "./pages/Home";
import SelectLevel from "./pages/SelectLevel";
import Login from "./pages/Login";
import Upgrade from "./pages/Upgrade";
import SelectClass from "./pages/Login/SelectClass";
import { Campaign, PvP } from "./pages/Battle";
import { useEffect, useState, type JSX } from "react";
import { fetchPlayer } from "./store/slices/playerSlice";
import LoadingCard from "./components/LoadingCard";

import "./App.css"

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
	const userId = useSelector((state: RootState) => state.player.id);
	if (userId) {
		return children;
	} else {
		console.log("not logged in moving to login page");
		return <Navigate to="/login" replace />;
	}
	return userId ? children : <Navigate to="/login" replace />;
};

function App() {
	const dispatch: AppDispatch = useDispatch();
	const [authLoaded, setAuthLoaded] = useState(false);

	useEffect(() => {
		const token = localStorage.getItem("authToken");
		if (token) {
			dispatch(fetchPlayer()).finally(() => setAuthLoaded(true));
		} else {
			setAuthLoaded(true);
		}
	}, [dispatch]);

	if (!authLoaded) {
		return <div className="loading">
			<LoadingCard/>
		</div>;
	}

	return (
		<Router>
			<Routes>
				<Route path="/login" element={<Login />} />

				<Route
					path="/"
					element={
						<PrivateRoute>
							<Home />
						</PrivateRoute>
					}
				/>
				<Route
					path="/campaign/:levelId"
					element={
						<PrivateRoute>
							<Campaign />
						</PrivateRoute>
					}
				/>
				<Route
					path="/level"
					element={
						<PrivateRoute>
							<SelectLevel />
						</PrivateRoute>
					}
				/>
				<Route
					path="/lobby/:id"
					element={
						<PrivateRoute>
							<PvP />
						</PrivateRoute>
					}
				/>
				<Route
					path="/upgrade"
					element={
						<PrivateRoute>
							<Upgrade />
						</PrivateRoute>
					}
				/>
				<Route
					path="/select-class"
					element={
						<PrivateRoute>
							<SelectClass />
						</PrivateRoute>
					}
				/>
			</Routes>
		</Router>
	);
}

export default App;
