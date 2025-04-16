// src/App.tsx
import React, { useState, useEffect } from 'react';
import './App.css';
import RouletteBarVirtual from './components/RouletteBarVirtual';
import BetControls from './components/BetControls';
import Modal from './components/Modal';
import { supabase } from './backend/supabaseClient';
import TelegramAuth from './components/TelegramAuth';
import Profile from './components/Profile';

const Staking = () => (
  <div className="text-center text-2xl mt-20">📈 Стейкинг скоро будет!</div>
);


const getColor = (num: number): 'red' | 'black' | 'green' => {
  if (num === 0) return 'green';
  const reds = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31];
  return reds.includes(num) ? 'red' : 'black';
};

type BetType =
  | { type: 'number'; value: number }
  | { type: 'color'; value: 'red' | 'black' | 'green' }
  | { type: 'dozen'; value: 0 | 1 | 2 };

interface Bet {
  amount: number;
  bet: BetType;
}

export default function App() {
  const [rolling, setRolling] = useState(false);
  const [balance, setBalance] = useState(1000);
  const [result, setResult] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [currentBet, setCurrentBet] = useState<Bet | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [activeTab, setActiveTab] = useState<'game' | 'staking' | 'profile'>('game');
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const updateBalanceInDb = async (newBalance: number) => {
    const tg = window.Telegram?.WebApp;
    const telegramId = tg?.initDataUnsafe?.user?.id?.toString();

    if (!telegramId) {
      console.warn('Не удалось получить Telegram ID');
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('telegram_id', telegramId);

    if (error) {
      console.error('Ошибка при обновлении баланса:', error);
    } else {
      console.log('Баланс успешно обновлён в БД:', newBalance);
    }
  };

  const spin = () => {
    if (rolling || !currentBet || currentBet.amount > balance) return;
    setBalance(prev => prev - currentBet.amount);
    setRolling(true);
    setMessage('');
    const number = Math.floor(Math.random() * 33);
    setWinningNumber(number);
  };

  const handleRollEnd = (actualNumber: number) => {
    if (!currentBet) return;
    const isWinResult = (() => {
      const { type, value } = currentBet.bet;
      if (type === 'number') return actualNumber === value;
      if (type === 'color') return getColor(actualNumber) === value;
      if (type === 'dozen') {
        if (value === 0) return actualNumber >= 1 && actualNumber <= 12;
        if (value === 1) return actualNumber >= 13 && actualNumber <= 24;
        if (value === 2) return actualNumber >= 25 && actualNumber <= 32;
      }
      return false;
    })();
  
    setIsWin(isWinResult);
  
    const payoutMultiplier =
      currentBet.bet.type === 'number' ? 32 :
      currentBet.bet.type === 'dozen' ? 3 :
      2;
      const winAmount = isWinResult ? currentBet.amount * payoutMultiplier : 0;
  
    setBalance(prev => {
      const newBal = prev + winAmount;
      updateBalanceInDb(newBal);  // Обновление баланса в базе
      return newBal;
    });
  
    setResult(actualNumber);
    setCurrentBet(null);
    setRolling(false);
    setIsModalOpen(true);
  
    // Запись в историю ставки
    saveBetToHistory(currentBet, isWinResult, winAmount);
  };
  
  const saveBetToHistory = async (
    bet: Bet,
    isWin: boolean,
    winAmount: number
  ) => {
    const userId = await getUserIdByTelegramId();
    if (!userId) return;

    const { error } = await supabase.from('bets_history').insert({
      user_id: userId,
      bet_option:
        bet.bet.type === 'number'
          ? bet.bet.value.toString()
          : bet.bet.type === 'color'
          ? bet.bet.value
          : `dozen_${bet.bet.value}`,
      amount: bet.amount,
      result: isWin,
      win_amount: winAmount,
    });

    if (error) {
      console.error('Ошибка при сохранении истории ставки:', error);
    } else {
      console.log('Ставка сохранена в историю');
    }
  };

  const getUserIdByTelegramId = async (): Promise<string | null> => {
    const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString();
    if (!telegramId) return null;
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();
    if (error) {
      console.error('Ошибка при получении user_id:', error);
      return null;
    }
    return data.id;
  };

  const handlePlaceBet = (bet: Bet) => {
    if (bet.amount <= balance) {
      setCurrentBet(bet);
      spin();
    } else {
      setMessage("Недостаточно средств для ставки");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 h-16 bg-gray-800 border-b border-gray-700 flex justify-between px-4 items-center z-10">
        <h1 className="text-lg font-semibold">Казино</h1>
        <div className="text-lg font-semibold">
          Баланс: {balance.toLocaleString()} ₽
        </div>
      </header>

      <main className="flex-1 pt-20 pb-20 flex flex-col items-center justify-start w-full">
        {activeTab === 'game' && (
          <>
            <div className="relative w-full max-w-3xl overflow-hidden border-y border-gray-500 bg-gray-800 py-8">
              <RouletteBarVirtual
                targetNumber={winningNumber ?? 0}
                rolling={rolling}
                onCenterNumberChange={(num) => setResult(num)}
                onAnimationEnd={(num) => handleRollEnd(num)}
                triggerSpin={rolling}
              />
            </div>
            <BetControls onPlaceBet={handlePlaceBet} />
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              message={`Выпал номер ${result}`}
              isWin={isWin}
            />
          </>
        )}
        {activeTab === 'staking' && <Staking />}
        {activeTab === 'profile' && <Profile username={username} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 py-2 flex border-t border-gray-700 px-4">
        <button onClick={() => setActiveTab('game')} className="flex flex-col items-center text-xs text-yellow-400 font-bold flex-grow text-center">
          🎰<span className="mt-1">Игра</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className="flex flex-col items-center text-xs text-yellow-400 font-bold flex-grow text-center">
          👤<span className="mt-1">Профиль</span>
        </button>
        <button onClick={() => setActiveTab('staking')} className="flex flex-col items-center text-xs text-yellow-400 font-bold flex-grow text-center">
          📈<span className="mt-1">Стейкинг</span>
        </button>
      </nav>

      <TelegramAuth setUsername={setUsername} setBalance={setBalance} />
    </div>
  );
}