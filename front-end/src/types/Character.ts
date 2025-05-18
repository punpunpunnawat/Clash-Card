export interface CharacterStatsProps {
  atk: number;
  hp: number;
  def: number;
  spd: number;
}

export interface CharacterProps {
  id: number;
  name: string;
  emoji: string;
  stats: CharacterStatsProps;
}
