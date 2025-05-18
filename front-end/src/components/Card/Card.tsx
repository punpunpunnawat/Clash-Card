// Card.tsx
import React from 'react';
import { type CardProps } from '../../types/Card';

const Card: React.FC<CardProps> = ({ name, emoji }) => {
  return (
    <div
      style={{
        border: '2px solid #333',
        borderRadius: '8px',
        padding: '12px',
        margin: '8px',
        textAlign: 'center',
        width: '80px',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div style={{ fontSize: '36px' }}>{emoji}</div>
      <div>{name}</div>
    </div>
  );
};

export default Card;
