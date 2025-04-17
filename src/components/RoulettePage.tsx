import { useState, useRef, useEffect } from 'react';
import RouletteBarVirtual from './RouletteBarVirtual';
import BetControls from './BetControls';
import React from 'react';
import Modal from './Modal.tsx'; // Вынеси его в отдельный файл при необходимости

const numbers = Array.from({ length: 33 }, (_, i) => i);
const SLOT_WIDTH = 60;
const INITIAL_OFFSET = numbers.length * SLOT_WIDTH * 50;

export default function RoulettePage() {
  const [offset, setOffset] = useState(INITIAL_OFFSET);
  const [balance, setBalance] = useState(1000);
  const [rolling, setRolling] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [isWin, setIsWin] = useState(false);
  const [currentBet, setCurrentBet] = useState<any>(null);
  const animationFrameRef = useRef<number | null>(null);

  const getColor = (num: number) => {
    if (num === 0) return 'green';
    const reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32];
    return reds.includes(num) ? 'red' : 'black';
  };

  const spin = () => {
    if (rolling || !currentBet || currentBet.amount > balance) return;

    setRolling(true);
    const winningNumber = Math.floor(Math.random() * 33);
    const extraSpins = 33 * 4 + winningNumber;
    const newTargetOffset = offset + extraSpins * SLOT_WIDTH;

    animate(offset, newTargetOffset, winningNumber);
  };

  const animate = (currentOffset: number, targetOffset: number, winningNumber: number) => {
    if (Math.abs(currentOffset - targetOffset) < SLOT_WIDTH) {
      setRolling(false);
      const actualNumber = winningNumber;

      const win = (() => {
        const { type, value } = currentBet.bet;
        if (type === 'number') return actualNumber === value;
        if (type === 'color') return getColor(actualNumber) === value;
        if (type === 'dozen') {
          if (value === 1) return actualNumber >= 1 && actualNumber <= 12;
          if (value === 2) return actualNumber >= 13 && actualNumber <= 24;
          if (value === 3) return actualNumber >= 25 && actualNumber <= 32;
        }
        return false;
      })();

      setIsWin(win);
      const payout = win ? currentBet.amount * (currentBet.bet.type === 'number' ? 32 : currentBet.bet.type === 'dozen' ? 3 : 2) : 0;
      setBalance((prev) => prev - currentBet.amount + payout);
      setResult(actualNumber);
      setIsModalOpen(true);
      setCurrentBet(null);
      return;
    }

    const newOffset = currentOffset + (targetOffset - currentOffset) * 0.1;
    setOffset(newOffset);

    animationFrameRef.current = requestAnimationFrame(() =>
      animate(newOffset, targetOffset, winningNumber)
    );
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full max-w-3xl overflow-hidden border-y border-gray-500 bg-gray-800 py-8">
       
      </div>

      <BetControls
        onPlaceBet={(bet) => {
          setCurrentBet(bet);
          spin();
        }}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        message={`Результат: ${result}`}
        isWin={isWin}
      />
    </div>
  );
}
