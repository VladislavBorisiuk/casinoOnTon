import React, { useState } from 'react';
import './BetControls.css';

type BetType =
  | { type: 'number'; value: number }
  | { type: 'color'; value: 'red' | 'black' | 'green' }
  | { type: 'dozen'; value: 0 | 1 | 2 };

interface BetControlsProps {
  onPlaceBet: (bet: { amount: number; bet: BetType }) => void;
}

const BetControls: React.FC<BetControlsProps> = ({ onPlaceBet }) => {
  const [betType, setBetType] = useState<'number' | 'color' | 'dozen'>('number');
  const [value, setValue] = useState<number | string>(0);
  const [amount, setAmount] = useState(100);

  const handleBetTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as 'number' | 'color' | 'dozen';
    setBetType(newType);
    if (newType === 'number') setValue(0);
    else if (newType === 'color') setValue('red');
    else setValue(0); // dozen
  };

  const handleSubmit = () => {
    let betValue: BetType;

    if (betType === 'number') {
      betValue = { type: 'number', value: Number(value) };
    } else if (betType === 'color') {
      betValue = { type: 'color', value: value as 'red' | 'black' | 'green' };
    } else {
      betValue = { type: 'dozen', value: Number(value) as 0 | 1 | 2 };
    }

    onPlaceBet({ amount, bet: betValue });
  };

  return (
    <div className="bet-controls-wrapper">
    <div className="bet-controls-container">
      <div className="bet-controls-header">Сделайте ставку</div>
      <div className="bet-controls">
        <div className="bet-controls-item">
          <label className="label">Тип ставки</label>
          <select value={betType} onChange={handleBetTypeChange}>
            <option value="number">Число</option>
            <option value="color">Цвет</option>
            <option value="dozen">Дюжина</option>
          </select>
        </div>

        {betType === 'number' && (
          <div className="bet-controls-item">
            <label className="label">Выберите число</label>
            <input
              type="number"
              min={0}
              max={32}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
            />
          </div>
        )}

        {betType === 'color' && (
          <div className="bet-controls-item">
            <label className="label">Выберите цвет</label>
            <select value={value} onChange={(e) => setValue(e.target.value)}>
              <option value="red">Красное</option>
              <option value="black">Чёрное</option>
              <option value="green">Зелёное</option>
            </select>
          </div>
        )}

        {betType === 'dozen' && (
          <div className="bet-controls-item">
            <label className="label">Выберите дюжину</label>
            <select value={value} onChange={(e) => setValue(Number(e.target.value))}>
              <option value={0}>1–12</option>
              <option value={1}>13–24</option>
              <option value={2}>25–32</option>
            </select>
          </div>
        )}

        <div className="bet-controls-item">
          <label className="label">Сумма ставки</label>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="Сумма"
          />
        </div>
      </div>

      <button onClick={handleSubmit} className="bet-button">
        Сделать ставку
      </button>
    </div>
  </div>
  );
};

export default BetControls;
