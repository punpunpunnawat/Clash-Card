export type CardType = 'rock' | 'paper' | 'scissors' | 'hidden';

export interface CardProps {
  id: string;
  type: CardType;
  onClick?: (id:string) => void;
}
