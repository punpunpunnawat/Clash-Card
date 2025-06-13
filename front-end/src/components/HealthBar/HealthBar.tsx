import React from "react";
import "./HealthBar.css";

type HealthBarProps = {
  level: number;
  currentHP: number;
  maxHP: number;
  playerClass: "none" | "warrior" | "mage" | "assassin";
};

const HealthBar: React.FC<HealthBarProps> = ({ level, currentHP, maxHP, playerClass }) => {
  const percent = Math.min(100, Math.floor((currentHP / maxHP) * 100));

  const getHealthColor = (percent: number) => {
  if (percent > 60) return "#4caf50"; // เขียว
  if (percent > 30) return "#ff9800"; // ส้ม
  return "#f44336"; // แดง
};


  return (
    <div className="HealthBar">
      <div className="HealthBar__info">
        <span className="HealthBar__Health">
          Lv. {level} {playerClass}
        </span>
        <span className="HealthBar__exp">
          {currentHP} / {maxHP} HP
        </span>
      </div>
      <div className="HealthBar__bar">
        <div
          className="HealthBar__fill"
          style={{ width: `${percent}%`, backgroundColor: getHealthColor(percent) }}
        />
      </div>
    </div>
  );
};

export default HealthBar;
