// src/App.tsx
import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './backend/supabaseClient';
import RouletteBarVirtual from './components/RouletteBarVirtual';
import BetControls from './components/BetControls';
import Modal from './components/modalWindows/Modal';
import CardPackOpener from './components/CardPackOpener';
import casinoChipIcon from './assets/casino_chip.svg';
import profileIcon from './assets/profile_circle.svg';
import Profile from './components/Profile';
import cardIcon from './assets/playing_card.svg';

const getColor = (num: number): 'red' | 'black' | 'green' => {
  if (num === 0) return 'green';
  const reds = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31];
  return reds.includes(num) ? 'red' : 'black';
};

const getTelegramUserId = () => {
  const tg = window.Telegram?.WebApp;
  return tg?.initDataUnsafe?.user?.id?.toString();
};

const getTelegramUsername = () => {
  const tg = window.Telegram?.WebApp;
  return tg?.initDataUnsafe?.user?.first_name || null;
};

const getUserAvatar = () => {
  const tg = window.Telegram?.WebApp;
  return tg?.initDataUnsafe?.user?.photo_url;
};

export default function App() {
  const [username, setUsername] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(1000);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [currentBet, setCurrentBet] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [wasLastGameWin, setWasLastGameWin] = useState(false);
  const [activeTab, setActiveTab] = useState<'game' | 'staking' | 'profile'>('game');
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [spinTrigger, setSpinTrigger] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(false);

  useEffect(() => {
    const initUser = async () => {
      const telegramId = getTelegramUserId();
      const userAvatar = getUserAvatar();
      const userUsername = getTelegramUsername();

      setAvatar(userAvatar);
      setUsername(userUsername);

      if (!telegramId) {
        console.warn("Не удалось получить Telegram ID");
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          const { error: insertError } = await supabase.from('users').insert({
            telegram_id: telegramId,
            username: userUsername,
            balance: 0,
          });
          if (insertError) {
            console.error("Ошибка при создании пользователя:", insertError);
          } else {
            console.log("Новый пользователь добавлен");
            setBalance(0);
          }
        } else {
          console.error("Ошибка при получении пользователя:", error);
        }
      } else {
        setBalance(data.balance);
        console.log("Пользователь найден. Баланс:", data.balance);
      }
    };

    initUser();
  }, []);

  const updateBalanceInDb = async (newBalance: number) => {
    const telegramId = getTelegramUserId();
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
  
    const number = generateNumberWithRerollIfNeeded(currentBet, wasLastGameWin);
    setWinningNumber(number);
    setSpinTrigger(true);
    setResetTrigger(false);
  };
  
  const generateNumberWithRerollIfNeeded = (bet: any, wasPreviousWin: boolean): number => {
    const roll = () => Math.floor(Math.random() * 33);
    const number = roll();
  
    const isWinning = checkIsWinningNumber(number, bet);
  
    // если предыдущая игра была победной и снова выпал победный номер — с шансом 50% рероллим
    if (wasPreviousWin && isWinning && Math.random() < 0.7) {
      return generateValidLosingNumber(bet);
    }
  
    return number;
  };
  
  const checkIsWinningNumber = (number: number, bet: any): boolean => {
    const { type, value } = bet.bet;
    const color = getColor(number);
  
    return (
      (type === 'number' && number === value) ||
      (type === 'color' && color === value) ||
      (type === 'dozen' &&
        ((value === 0 && number >= 1 && number <= 12) ||
         (value === 1 && number >= 13 && number <= 24) ||
         (value === 2 && number >= 25 && number <= 32)))
    );
  };
  
  const generateValidLosingNumber = (bet: any): number => {
    let attempts = 0;
    while (true) {
      const number = Math.floor(Math.random() * 33);
      if (!checkIsWinningNumber(number, bet)) return number;
      if (++attempts > 100) return number;
    }
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
    setWasLastGameWin(isWinResult);
    
    const payoutMultiplier =
      currentBet.bet.type === 'number' ? 32 :
      currentBet.bet.type === 'dozen' ? 3 :
      2;
    const winAmount = isWinResult ? currentBet.amount * payoutMultiplier : 0;

    setBalance(prev => {
      const newBal = prev + winAmount;
      updateBalanceInDb(newBal);
      return newBal;
    });

    setResult(actualNumber);
    setCurrentBet(null);
    setRolling(false);
    setIsModalOpen(true);
    setSpinTrigger(false);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setResetTrigger(true);
    }, 300);
  };

  const handlePlaceBet = (bet: any) => {
    if (bet.amount <= balance) {
      setCurrentBet(bet);
      spin();
    } else {
      setMessage("Недостаточно средств.");
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

      <main className="flex-1 pt-16 pb-20 flex flex-col items-center justify-start w-full">
        {activeTab === 'game' && (
          <>
            <div className="fixed top-16 left-0 right-0 z-30 w-full max-w-3xl overflow-hidden border-y border-gray-500 bg-gray-800">
              <RouletteBarVirtual
                targetNumber={winningNumber ?? 0}
                spinTrigger={spinTrigger}
                resetTrigger={resetTrigger}
                onCenterNumberChange={(num) => setResult(num)}
                onAnimationEnd={(num) => handleRollEnd(num)}
              />
            </div>
            <div className="w-full mt-2 flex justify-center">
              <div className="text-red-500 text-sm font-medium text-center">
                {message}
              </div>
            </div>
            <BetControls balance={balance} onPlaceBet={handlePlaceBet} />
            <Modal
              isOpen={isModalOpen}
              onClose={handleModalClose}
              message={`Выпал номер ${result}`}
              isWin={isWin}
            />
          </>
        )}
        {activeTab === 'staking' && <CardPackOpener balance={balance} setBalance={setBalance} />}
        {activeTab === 'profile' && (
          <Profile username={username} avatar={avatar} />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-md flex border-t border-gray-700 h-12 px-1">
        <button
          onClick={() => setActiveTab('game')}
          className="flex flex-col items-center justify-center text-[9px] text-yellow-400 font-semibold flex-grow"
        >
          <img src={casinoChipIcon} alt="Рулетка" className="w-3 h-3 opacity-60 hover:opacity-100 transition-opacity duration-200" height={28}/>
          <span className="mt-0.5">Рулетка</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className="flex flex-col items-center justify-center text-[9px] text-yellow-400 font-semibold flex-grow"
        >
          <img src={profileIcon} alt="Профиль" className="w-3 h-3 opacity-60 hover:opacity-100 transition-opacity duration-200" height={28}/>
          <span className="mt-0.5">Профиль</span>
        </button>

        <button
          onClick={() => setActiveTab('staking')}
          className="flex flex-col items-center justify-center text-[9px] text-yellow-400 font-semibold flex-grow"
        >
          <img src={cardIcon} alt="Стейкинг" className="w-3 h-3 opacity-60 hover:opacity-100 transition-opacity duration-200" height={28}/>
          <span className="mt-0.5">Коллекция</span>
        </button>
      </nav>
    </div>
  );
}


