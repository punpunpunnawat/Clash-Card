interface HealthBarProps {
  currentHP: number;
  maxHP: number;
}

const HealthBar: React.FC<HealthBarProps> = ({ currentHP, maxHP }) => {
  const percentage = (currentHP / maxHP) * 100;

  return (
    <div style={{
      width: '150px',
      height: '20px',
      border: '1px solid #333',
      borderRadius: '10px',
      backgroundColor: '#ddd',
      overflow: 'hidden',
      marginBottom: '8px'
    }}>
      <div style={{
        width: `${percentage}%`,
        height: '100%',
        backgroundColor: percentage > 50 ? 'green' : (percentage > 20 ? 'orange' : 'red'),
        transition: 'width 0.3s ease-in-out'
      }} />
    </div>
  );
};

export default HealthBar