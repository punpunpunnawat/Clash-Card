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
        };
      }
    | {
        type: "round_result";
        gameStatus: string;
        roundWinner: string;
        opponentPlayed: CardProps;
        playerPlayed: CardProps;
        playerHand: CardProps[];
        damage: {
          enemyToPlayer: number;
          playerToEnemy: number;
        };
        hp: {
          opponent: number;
          player: number;
        };
        cardRemaining: {
          player: {
            paper: number;
            rock: number;
            scissors: number;
          };
          opponent: {
            paper: number;
            rock: number;
            scissors: number;
          };
        };
      };

  export type RoundResult = {
    type: "round_result";
    gameStatus: string;
    roundWinner: string;
    opponentPlayed: CardProps;
    playerPlayed: CardProps;
    playerHand: CardProps[];
    damage: {
      enemyToPlayer: number;
      playerToEnemy: number;
    };
    hp: {
      opponent: number;
      player: number;
    };
    cardRemaining: {
      player: {
        paper: number;
        rock: number;
        scissors: number;
      };
      opponent: {
        paper: number;
        rock: number;
        scissors: number;
      };
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