import type { CardProps } from "./Card";
import type { UnitStat } from "./UnitStat";

export type ServerMessage =
	| { type: "slot_assigned"; slot: "A" | "B" }
	| {
			type: "selection_status";
			playerSelected: boolean;
			opponentSelected: boolean;
	  }
	| {
			type: "initialData";
			player: {
				name: string;
				level: number;
				currentHP: number;
				cardRemaining: CardCount;
				hand: CardProps[];
				stat: {
					atk: number;
					def: number;
					spd: number;
					hp: number;
				};
				class: string;
			};
			opponent: {
				name: string;
				level: number;
				currentHP: number;
				cardRemaining: CardCount;
				handSize: number;
				stat: {
					atk: number;
					def: number;
					spd: number;
					hp: number;
				};
				class: string;
			};
	  }
	| {
			type: "round_result";
			gameStatus: string;
			roundWinner: string;
			player: {
				hp: number;
				hand: CardProps[];
				cardPlayed: CardProps;
				damageTaken: number;
				isEvade: boolean;
				cardRemaining: CardCount;
				trueSight: number;
				skillActivation: number;
			};
			opponent: {
				hp: number;
				handLength: number;
				cardPlayed: CardProps;
				damageTaken: number;
				isEvade: boolean;
				cardRemaining: CardCount;
				trueSight: number;
				specialEvent: number;
			};
	  };

export type RoundResult = {
	type: "round_result";
	gameStatus: string;
	roundWinner: string;
	player: {
		hp: number;
		hand: CardProps[];
		cardPlayed: CardProps;
		damageTaken: number;
		isEvade: boolean;
		cardRemaining: CardCount;
		trueSight: number;
		skillActivation: number;
	};
	opponent: {
		hp: number;
		handLength: number;
		cardPlayed: CardProps;
		damageTaken: number;
		isEvade: boolean;
		cardRemaining: CardCount;
		trueSight: number;
		specialEvent: number;
	};
};

export type CardCount = {
	rock: number;
	paper: number;
	scissors: number;
};

export type CardRemaining = {
	player: CardCount;
	opponent: CardCount;
};

export type PlayerDetail = {
	stat: UnitStat;
	name: string;
	level: number;
};
