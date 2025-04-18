import React, { useState } from 'react';
import './BetControls.css';

type BetType =
  | { type: 'number'; value: number }
  | { type: 'color'; value: 'red' | 'black' | 'green' }
  | { type: 'dozen'; value: 0 | 1 | 2 };

interface BetControlsProps {
  onPlaceBet: (bet: { amount: number; bet: BetType }) => void;
  balance: number;
}

const BetControls: React.FC<BetControlsProps> = ({ onPlaceBet, balance }) => {
  const [betType, setBetType] = useState<'number' | 'color' | 'dozen'>('number');
  const [value, setValue] = useState<number | string>(0);
  const [amount, setAmount] = useState(100);
  const [betValueError, setBetValueError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  const handleBetTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as 'number' | 'color' | 'dozen';
    setBetType(newType);
    setBetValueError(null);

    if (newType === 'number') setValue(0);
    else if (newType === 'color') setValue('red');
    else setValue(0);
  };

  const handleSubmit = () => {
    setBetValueError(null);
    setAmountError(null);

    if (amount < 50) {
      setAmountError('Минимальная ставка — 50');
      return;
    }

    if (betType === 'number') {
      const num = Number(value);
      if (isNaN(num) || num < 0 || num > 31) {
        setBetValueError('Введите число от 0 до 31');
        return;
      }
    }

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

  const quickSetAmount = (val: number) => {
    setAmount(val);
    if (val < 50) setAmountError('Минимальная ставка — 50');
    else setAmountError(null);
  };

  const quickSetFraction = (fraction: number) => {
    const numericBalance = Number(balance);
  
    if (isNaN(numericBalance)) {
      setAmountError('Ошибка: некорректный баланс');
      return;
    }
  
    const val = Math.floor(numericBalance * fraction);
    setAmount(val);
    if (val < 50) setAmountError('Минимальная ставка — 50');
    else setAmountError(null);
  };
  

  const isBetDisabled = !!betValueError || !!amountError;

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
              <label className="label">Выберите число (0–31)</label>
              <input
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val)) {
                    const num = Number(val);
                    setValue(val);
                    if (val !== '' && num >= 0 && num <= 31) {
                      setBetValueError(null);
                    } else {
                      setBetValueError('Введите число от 0 до 31');
                    }
                  }
                }}
              />
              {betValueError && <div className="error-text">{betValueError}</div>}
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
              type="text"
              min={1}
              value={amount}
              onChange={(e) => {
                const val = Number(e.target.value);
                setAmount(val);
                if (val < 50) {
                  setAmountError('Минимальная ставка — 50');
                } else {
                  setAmountError(null);
                }
              }}
              placeholder="Сумма"
            />
            {amountError && <div className="error-text">{amountError}</div>}
            <div className="quick-buttons">
              {[50, 100, 250, 500, 1000, 2000, 5000, 10000].map((val) => (
                <button key={val} className="quick-btn small" onClick={() => quickSetAmount(val)}>
                  {val}
                </button>
              ))}
              <button className="quick-btn small" onClick={() => quickSetFraction(0.25)}>¼</button>
              <button className="quick-btn small" onClick={() => quickSetFraction(0.5)}>½</button>
              <button className="quick-btn small" onClick={() => quickSetFraction(0.75)}>¾</button>
              <button className="quick-btn small" onClick={() => quickSetFraction(1)}>ALL</button>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="bet-button"
          disabled={isBetDisabled}
        >
          Сделать ставку
        </button>
      </div>
    </div>
  );
};

export default BetControls;
