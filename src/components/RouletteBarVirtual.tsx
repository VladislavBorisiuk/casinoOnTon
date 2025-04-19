import React, { useEffect, useRef, useState } from 'react';
import './ComponentsStyles.css';

const numbers = Array.from({ length: 33 }, (_, i) => i);
const extendedNumbers = [...numbers, ...numbers, ...numbers];
const DEFAULT_VISIBLE_CELLS = 9;

const getColor = (n: number) => {
  if (n === 0) return 'green';
  const reds = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31];
  return reds.includes(n) ? 'red' : 'black';
};

interface RouletteBarVirtualProps {
  targetNumber: number;
  onCenterNumberChange: (number: number) => void;
  onAnimationEnd: (number: number) => void;
  spinTrigger: boolean;
  resetTrigger: boolean;
}

const RouletteBarVirtual: React.FC<RouletteBarVirtualProps> = ({
  targetNumber,
  onCenterNumberChange,
  onAnimationEnd,
  spinTrigger,
  resetTrigger,
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [visibleCells, setVisibleCells] = useState(DEFAULT_VISIBLE_CELLS);
  const [position, setPosition] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const cellWidth = Math.round(containerWidth / visibleCells); // округляем для стабильности

  useEffect(() => {
    const updateDimensions = () => setContainerWidth(window.innerWidth);
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (resetTrigger) {
      offsetRef.current = 0;
      setPosition(0);
    }
  }, [resetTrigger]);

  useEffect(() => {
    if (!spinTrigger) return;
    const spinCount = 33 * 4 + targetNumber;
    const targetOffset = offsetRef.current + spinCount * cellWidth;

    const animate = (currentOffset: number) => {
      if (Math.abs(currentOffset - targetOffset) < cellWidth) {
        offsetRef.current = targetOffset;
        const finalPos = ((targetOffset % (numbers.length * cellWidth)) + (numbers.length * cellWidth)) % (numbers.length * cellWidth);
        setPosition(finalPos);
        const centerIndex = Math.round((finalPos / cellWidth) + Math.floor(visibleCells / 2)) % extendedNumbers.length;
        const centerNumber = extendedNumbers[centerIndex];
        onCenterNumberChange(centerNumber);
        onAnimationEnd(centerNumber);
        return;
      }

      const newOffset = currentOffset + (targetOffset - currentOffset) * 0.1;
      offsetRef.current = newOffset;
      const newPosition = ((newOffset % (numbers.length * cellWidth)) + (numbers.length * cellWidth)) % (numbers.length * cellWidth);
      setPosition(newPosition);
      animationFrameRef.current = requestAnimationFrame(() => animate(newOffset));
    };

    animate(offsetRef.current);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [spinTrigger, targetNumber, cellWidth]);

  const centerIndex = Math.round((position / cellWidth) + Math.floor(visibleCells / 2)) % extendedNumbers.length;
  const startIndex = centerIndex - Math.floor(visibleCells / 2);

  const visibleNumbers = Array.from({ length: visibleCells }, (_, i) => {
    const index = (startIndex + i + extendedNumbers.length) % extendedNumbers.length;
    return extendedNumbers[index];
  });

  return (
    <div className="roulette-bar-wrapper" ref={containerRef}>
      <div className="roulette-frame" style={{ width: `${cellWidth}px` }} />
      <div
        className="roulette-bar"
        style={{ transform: `translateX(-${position % cellWidth}px)` }}
      >
        {visibleNumbers.map((num, idx) => (
          <div
            key={`${num}-${idx}`}
            className={`roulette-cell ${getColor(num)}`}
            style={{ width: `${cellWidth}px` }}
          >
            {num}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RouletteBarVirtual;
