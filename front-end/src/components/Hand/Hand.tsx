// src/components/Hand/Hand.tsx
import React from 'react';
import Card from '../Card';
import type { CardProps } from '../../types/Card';

interface HandProps {
  cards: CardProps[];              // การ์ดในมือ (ไม่เกิน 5 ใบ)
  onSelectCard: (card: CardProps) => void;  // ฟังก์ชันเรียกเมื่อเลือกการ์ด
}

const Hand: React.FC<HandProps> = ({ cards, onSelectCard }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
      {cards.map((card) => (
        <div key={card.id} onClick={() => onSelectCard(card)} style={{ cursor: 'pointer' }}>
          <Card {...card} />
        </div>
      ))}
    </div>
  );
};

export default Hand;
