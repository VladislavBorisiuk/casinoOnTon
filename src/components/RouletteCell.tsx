import React from 'react';

interface RouletteCellProps {
  number: number;
  color: string;
  width: number;
}

const RouletteCell: React.FC<RouletteCellProps> = ({ number, color, width }) => {
  return (
    <div className={`roulette-cell ${color}`} style={{ width }}>
      {number}
    </div>
  );
};

export default RouletteCell;
