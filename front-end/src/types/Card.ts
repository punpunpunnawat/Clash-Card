export type CardType = 'rock' | 'paper' | 'scissors';

export interface CardProps {
  id: number;
  type: CardType;
  name: string;
  emoji: string;
}
