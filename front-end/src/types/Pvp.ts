import type { CardProps } from "./Card";
import type { PlayerClass, UnitStat } from "./UnitStat";

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
				class: PlayerClass;
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
				class: PlayerClass;
			};
	  }
	| {
			type: "opponent_left";
	  }
	| RoundResult;

export type RoundResult = {
	type: "round_result";
	gameStatus: string;
	roundWinner: string;
	player: {
		hp: number;
		hand: CardProps[];
		cardPlayed: CardProps;
		doDamage: number;
		cardRemaining: CardCount;
		trueSight: number;
		skillActivation: number;
	};
	opponent: {
		hp: number;
		handLength: number;
		cardPlayed: CardProps;
		doDamage: number;
		cardRemaining: CardCount;
		trueSight: number;
		specialEvent: number;
	};
	postGameDetail: PostGameDetail;
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
	class: PlayerClass;
};

export type PostGameDetail = {
	result: "Win" | "Lose" | "Draw";
	detail: "You out of HP" | "You out of Card" | "Opponent out of HP" | "Opponent out of Card" | "Opponent leave" | "Both out of HP" | "Both out of Card";
	exp: number;
	gold: number;
	levelUp: number;
	statGain: UnitStat;
}