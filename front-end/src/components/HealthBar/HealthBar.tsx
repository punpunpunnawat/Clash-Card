interface HealthBarProps {
  currentHP: number;
  maxHP: number;
}

const HealthBar: React.FC<HealthBarProps> = ({ currentHP, maxHP }) => {
  const percentage = (currentHP / maxHP) * 100;

  return (
    <div
      style={{
        width: '150px',
        height: '20px',
        border: '1px solid #333',
        borderRadius: '10px',
        backgroundColor: '#ddd',
        overflow: 'hidden',
        position: 'relative', // ให้ text ซ้อน
        marginBottom: '8px'
      }}
      className="HealthBar"
    >
      {/* Bar filled */}
      <div
        style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor:
            percentage > 50 ? 'green' : percentage > 20 ? 'orange' : 'red',
          transition: 'width 0.3s ease-in-out',
        }}
      />

      {/* Overlayed Text */}
      <div
        className="HealthBar__text"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          color: 'white', // จะมองเห็นบน bar
          textShadow: '0 0 3px black',
          pointerEvents: 'none', // กันไม่ให้ text ไปบัง event mouse
        }}
      >
        {currentHP}
      </div>
    </div>
  );
};

export default HealthBar