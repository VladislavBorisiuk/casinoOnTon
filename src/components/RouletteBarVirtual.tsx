import React, { useEffect, useRef, useState } from 'react';
import './ComponentsStyles.css';

const SLOT_WIDTH = 60;
const numbers = Array.from({ length: 33 }, (_, i) => i);
const extendedNumbers = [...numbers, ...numbers, ...numbers];
const VISIBLE_CELLS = 9;
const CENTER_INDEX = Math.floor(VISIBLE_CELLS / 2);

const getColor = (n: number) => {
  if (n === 0) return 'green';
  const reds = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31];
  return reds.includes(n) ? 'red' : 'black';
};

interface RouletteBarVirtualProps {
  targetNumber: number;
  onCenterNumberChange: (number: number) => void;
  rolling: boolean;
  onAnimationEnd: (number: number) => void;
  triggerSpin: boolean;
}

const RouletteBarVirtual: React.FC<RouletteBarVirtualProps> = ({
  targetNumber,
  onCenterNumberChange,
  rolling,
  onAnimationEnd,
  triggerSpin
}) => {
  const [position, setPosition] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const offsetRef = useRef(0);

  useEffect(() => {
    if (!triggerSpin || !rolling) return;

    const spinCount = 33 * 4 + targetNumber;
    const targetOffset = offsetRef.current + spinCount * SLOT_WIDTH;

    const animate = (currentOffset: number) => {
      if (Math.abs(currentOffset - targetOffset) < SLOT_WIDTH) {
        offsetRef.current = targetOffset;
        const finalPosition = ((targetOffset % (numbers.length * SLOT_WIDTH)) + (numbers.length * SLOT_WIDTH)) % (numbers.length * SLOT_WIDTH);
        setPosition(finalPosition);

        const centerIndex = Math.floor((finalPosition / SLOT_WIDTH) + CENTER_INDEX) % extendedNumbers.length;
        const centerNumber = extendedNumbers[centerIndex];

        onCenterNumberChange(centerNumber);
        onAnimationEnd(centerNumber);
        return;
      }

      const newOffset = currentOffset + (targetOffset - currentOffset) * 0.1;
      offsetRef.current = newOffset;
      const newPosition = ((newOffset % (numbers.length * SLOT_WIDTH)) + (numbers.length * SLOT_WIDTH)) % (numbers.length * SLOT_WIDTH);
      setPosition(newPosition);

      animationFrameRef.current = requestAnimationFrame(() => animate(newOffset));
    };

    animate(offsetRef.current);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [triggerSpin, rolling, targetNumber]);

  const centerIndex = Math.floor((position / SLOT_WIDTH) + CENTER_INDEX) % extendedNumbers.length;
  const startIndex = centerIndex - CENTER_INDEX;

  const visibleNumbers = Array.from({ length: VISIBLE_CELLS }, (_, i) => {
    const index = (startIndex + i + extendedNumbers.length) % extendedNumbers.length;
    return extendedNumbers[index];
  });

  return (
    <div className="roulette-bar-wrapper">
      <div className="roulette-frame" />
      <div className="roulette-bar" style={{ transform: `translateX(-${position % SLOT_WIDTH}px)` }}>
        {visibleNumbers.map((num, idx) => (
          <div
            key={`${num}-${idx}`}
            className={`roulette-cell ${getColor(num)}`}
            style={{ width: SLOT_WIDTH }}
          >
            {num}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RouletteBarVirtual;
