import type { CardProps } from "./Card";
import type { PlayerClass, UnitStat } from "./UnitStat";

// Basic types
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
	currentHP: number;
	trueSight: number;
};

export type PostGameDetail = {
	result: "Win" | "Lose" | "Draw";
	detail:
		| "You out of HP"
		| "You out of Card"
		| "Opponent out of HP"
		| "Opponent out of Card"
		| "Opponent leave"
		| "Both out of HP"
		| "Both out of Card";
	exp: number;
	gold: number;
	lvlUp: number;
	statGain: UnitStat;
};

// Main ServerMessage union type
export type ServerMessage =
	| { type: "slot_assigned"; slot: "A" | "B" }
	| {
			type: "selection_status";
			playerSelected: boolean;
			opponentSelected: boolean;
	  }
	| InitialData
	| RoundResult
	| TrueSightResult
	| { type: "true_sight_alert" }
	| { type: "opponent_left" };

// TrueSightResult type
export type TrueSightResult = {
	type: "true_sight_result";
	opponentHand: CardCount;
	trueSightLeft: number;
};

// InitialData type
export type InitialData = {
	type: "initialData";
	matchID?: string;
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
};

// RoundResult type
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
		specialEvent:
			| "Warrior Blood"
			| "True Strike"
			| "True Sight"
			| "nothing";
	};
	opponent: {
		hp: number;
		handLength: number;
		cardPlayed: CardProps;
		doDamage: number;
		cardRemaining: CardCount;
		trueSight: number;
		specialEvent:
			| "Warrior Blood"
			| "True Strike"
			| "True Sight"
			| "nothing";
	};
	postGameDetail: PostGameDetail;
};

export type AnimationPerSide = {
  drawingCard: CardProps | null;
  drawStyle: React.CSSProperties;
  selectingCard: boolean;
  selectStyle: React.CSSProperties;
  battleAnimation: string;
  takenDamage: string | null;
};

export type AnimationState = {
  player: AnimationPerSide;
  opponent: AnimationPerSide;
};

export type BattleRefsPerSide = {
    deck: React.RefObject<HTMLDivElement|null>;
    hand: React.RefObject<HTMLDivElement|null>;
    cardPlacer: React.RefObject<HTMLDivElement|null>;
};

export type BattleRefs = {
    player: BattleRefsPerSide;
	opponent: BattleRefsPerSide;
};

