import React from 'react';
import Card from '../Card';
import type { CardProps } from '../../types/Card';

interface DeckProps {
  cards: CardProps[];
  onSelectCard: (card: CardProps) => void;
}

const Deck: React.FC<DeckProps> = ({ cards, onSelectCard }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
      {cards.map((card) => (
        <div key={card.id} onClick={() => onSelectCard(card)}>
          <Card {...card} />
        </div>
      ))}
    </div>
  );
};

export default Deck;
