export type CardType = 'rock' | 'paper' | 'scissors';

export interface CardProps {
  id: string;
  type: CardType;
  onClick?: (id:string) => void;
}
