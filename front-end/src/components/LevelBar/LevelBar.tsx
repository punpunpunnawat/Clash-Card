import React from "react";
import "./LevelBar.css";

type LevelBarProps = {
  level: number;
  currentExp: number;
  nextLevelExp: number;
  playerClass: "none"|"warrior"|"mage"|"assassin";
};

const LevelBar: React.FC<LevelBarProps> = ({ level, currentExp, nextLevelExp, playerClass }) => {
  const percent = Math.min(100, Math.floor((currentExp / nextLevelExp) * 100));

  return (
    <div className="LevelBar">
      <div className="LevelBar__info">
        <span className="LevelBar__level">Lv. {level} {playerClass}</span>
        <span className="LevelBar__exp">
          {currentExp} / {nextLevelExp} EXP
        </span>
      </div>
      <div className="LevelBar__bar">
        <div className="LevelBar__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

export default LevelBar;
