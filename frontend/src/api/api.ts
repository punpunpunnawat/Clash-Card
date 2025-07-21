import type {
	InitialData,
	RoundResult,
	TrueSightResult,
} from "../types/Battle";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const request = async (
	endpoint: string,
	method: "GET" | "POST" | "PUT",
	data?: unknown,
	token?: string
) => {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	try {
		const res = await fetch(`${API_BASE_URL}${endpoint}`, {
			method,
			headers,
			body: data ? JSON.stringify(data) : undefined,
		});

		if (!res.ok) {
			const error = await res.json().catch(() => ({}));
			throw new Error(error.message || `Error ${res.status}`);
		}

		return res.json();
	} catch (err) {
		throw new Error((err as Error)?.message || "Unknown error occurred");
	}
};

// ==================== User ====================
export const login = (email: string, password: string) =>
	request("/login", "POST", { email, password });

export const checkEmail = (email: string) =>
	request("/check-email", "POST", { email });

export const register = (
	username: string,
	email: string,
	password: string,
	playerClass: string
) =>
	request("/register", "POST", {
		username,
		email,
		password,
		class: playerClass,
	});

export const getUser = (token: string) =>
	request("/user", "GET", undefined, token);

export const getUserDeck = (token: string) =>
	request("/deck", "GET", undefined, token);

// ==================== Battle ====================
export const startBattle = async (
	levelId: number,
	token: string
): Promise<InitialData> => {
	return request("/battle/start", "POST", { levelId }, token);
};

export const playCard = (
	matchId: string,
	cardId: string,
	token: string
): Promise<RoundResult> => {
	return request(`/battle/${matchId}/play`, "PUT", { cardId }, token);
};

export const trueSight = (
	matchId: string,
	token: string
): Promise<TrueSightResult> => {
	return request(
		`/battle/${matchId}/play/true-sight`,
		"PUT",
		undefined,
		token
	);
};

// ==================== Upgrade ====================
export const changeClass = (newClass: string, token: string) =>
	request("/change-class", "PUT", { class: newClass }, token);

export const upgradeStat = (statType: string, token: string) =>
	request("/upgrade-stat", "PUT", { type: statType }, token);

export const buyCard = (cardType: string, token: string) =>
	request("/buy-card", "POST", { type: cardType }, token);
