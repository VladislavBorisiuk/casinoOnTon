interface RouletteCellProps {
    number: number;
    color: string;
  }
  
  const RouletteCell: React.FC<RouletteCellProps> = ({ number, color }) => {
    return (
      <div className={`roulette-cell ${color}`}>
        {number}
      </div>
    );
  };
  