import React, { useEffect, useState } from 'react';
import { supabase } from '../backend/supabaseClient';
import './CardPackOpener.css';
import ModalCardDrop from './ModalCardDrop';
import ProfitToast from './ProfitToast';

interface Card {
  id?: number;
  suit: string | null;
  rank: string;
  currency_income: number;
  last_collection?: string;
}

interface Props {
  balance: number;
  setBalance: (newBalance: number) => void;
}

const suits = ['червы', 'пики', 'бубны', 'трефы'];

const suitEmojis: Record<string, string> = {
  червы: '♥️',
  пики: '♠️',
  бубны: '♦️',
  трефы: '♣️',
};

const rankProbabilities: { rank: string; weight: number; income: number }[] = [
  { rank: '2', weight: 10, income: 50 },
  { rank: '3', weight: 10, income: 60 },
  { rank: '4', weight: 9, income: 70 },
  { rank: '5', weight: 9, income: 80 },
  { rank: '6', weight: 8, income: 90 },
  { rank: '7', weight: 7, income: 100 },
  { rank: '8', weight: 6, income: 110 },
  { rank: '9', weight: 5, income: 120 },
  { rank: '10', weight: 4, income: 140 },
  { rank: 'валет', weight: 3, income: 180 },
  { rank: 'дама', weight: 2.5, income: 200 },
  { rank: 'король', weight: 2, income: 250 },
  { rank: 'туз', weight: 1.5, income: 300 },
  { rank: 'джокер', weight: 0.5, income: 500 },
];

function getRandomCard(): Card {
  const totalWeight = rankProbabilities.reduce((sum, r) => sum + r.weight, 0);
  const rand = Math.random() * totalWeight;

  let cumulative = 0;
  let selected = rankProbabilities[0];

  for (const r of rankProbabilities) {
    cumulative += r.weight;
    if (rand <= cumulative) {
      selected = r;
      break;
    }
  }

  const suit =
    selected.rank === 'джокер'
      ? null
      : suits[Math.floor(Math.random() * suits.length)];

  return {
    suit,
    rank: selected.rank,
    currency_income: selected.income,
  };
}

const CardPackOpener: React.FC<Props> = ({ balance, setBalance }) => {
  const [openedCards, setOpenedCards] = useState<Card[]>([]);
  const [userCards, setUserCards] = useState<Card[]>([]);
  const [isOpening, setIsOpening] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [collectedProfit, setCollectedProfit] = useState<number | null>(null); // ✅ добавлено
  const [canOpenPack, setCanOpenPack] = useState(true); // Флаг для проверки, можно ли открыть пак

  useEffect(() => {
    const init = async () => {
      const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString();
      if (!telegramId) return;

      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();

      if (error || !data?.id) {
        console.error('Ошибка при получении user_id:', error);
        return;
      }

      setUserId(data.id);
      fetchUserCards(data.id);
    };

    init();
  }, []);

  const fetchUserCards = async (userId: string) => {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Ошибка при загрузке карт пользователя:', error);
      return;
    }

    setUserCards(data || []);

    // Проверка на количество карт
    if (data && data.length >= 8) {
      setCanOpenPack(false); // Блокируем возможность открытия паков, если 8 карт
    }
  };

  const updateBalanceInDb = async (newBalance: number) => {
    const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString();
    if (!telegramId) return;

    const { error } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('telegram_id', telegramId);

    if (error) console.error('Ошибка при обновлении баланса:', error);
  };

  const openPack = async () => {
    const packCost = 200;
    if (isOpening || balance < packCost || !userId || !canOpenPack) return; // Блокируем открытие, если лимит карт достигнут

    setIsOpening(true);

    const card = getRandomCard();

    setSelectedCard(card);
    setIsModalOpen(true);
  };
  const handleRemoveCard = async () => {
    if (!selectedCard || !userId) return;
    
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', selectedCard.id);
  
    if (error) {
      console.error('Ошибка при удалении карты:', error);
      return;
    }
  
    const refundAmount = selectedCard.currency_income;
    const newBalance = balance + refundAmount;
  
    setBalance(newBalance);
    updateBalanceInDb(newBalance);
  
    await fetchUserCards(userId);
  
    setIsModalOpen(false);
    setSelectedCard(null);  // Обнуляем selectedCard после удаления
  };
  
  const handleModalClose = async () => {
    setIsModalOpen(false);
  
    if (selectedCard && userId) {
      const { error } = await supabase.from('cards').insert([{
        ...selectedCard,
        user_id: userId,
      }]);
  
      if (error) {
        console.error('Ошибка при сохранении карты:', error);
        setIsOpening(false);
        return;
      }
  
      const newBalance = balance - 200;
      setBalance(newBalance);
      updateBalanceInDb(newBalance);
  
      await fetchUserCards(userId);
      setOpenedCards([selectedCard]);
      setSelectedCard(null);  // Обнуляем selectedCard после сохранения
    }
  
    setIsOpening(false);
  };

  const collectProfit = async () => {
    if (!userId) return;

    const { data: cards, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Ошибка при получении карт:', error);
      return;
    }

    let totalProfit = 0;
    const now = new Date();
    const updates = [];

    for (const card of cards || []) {
      const last = card.last_collection ? new Date(card.last_collection) : null;
      const hoursPassed = last ? (now.getTime() - last.getTime()) / (1000 * 60 * 60) : Infinity;

      if (hoursPassed >= 1) {
        totalProfit += card.currency_income;
        updates.push(
          supabase
            .from('cards')
            .update({ last_collection: now.toISOString() })
            .eq('id', card.id)
        );
      }
    }

    if (totalProfit > 0) {
      const newBalance = balance + totalProfit;
      setBalance(newBalance);
      await updateBalanceInDb(newBalance);
      await Promise.all(updates);
      await fetchUserCards(userId);
      setCollectedProfit(totalProfit);
      setTimeout(() => setCollectedProfit(null), 3000);
    } else {
      alert("Нет прибыли для сбора. Попробуйте позже ⏱️");
    }
  };

  const renderCard = (card: Card, idx: number) => (
    <div
      key={idx}
      className="card"
      onClick={() => {
        setSelectedCard(card);
        setIsModalOpen(true);
      }}
    >
      <span className="rank">{card.rank}</span>
      {card.suit && (
        <span className="suit">
          {suitEmojis[card.suit]} {card.suit}
        </span>
      )}
      <span className="currency">+{card.currency_income}₽</span>
    </div>
  );
  

  return (
    <div className="card-pack-container">
      <h2>🃏 Открыть пак карт</h2>
      <p>Стоимость пака: <strong>200 ₽</strong></p>
      
      {/* Отображаем количество карт из максимального */}
      <p>У вас {userCards.length} из 8 карт</p>

      <button
        onClick={openPack}
        disabled={isOpening || balance < 100 || !canOpenPack} // Блокируем кнопку, если лимит карт достигнут
        className="card-pack-button"
      >
        {isOpening ? "Открываем..." : "Открыть пак"}
      </button>

      <button
        onClick={collectProfit}
        className="collect-profit-button"
      >
        Собрать прибыль 💸
      </button>

      {userCards.length > 0 && (
        <div className="user-cards">
          <h3>📜 Ваши карты</h3>
          <div className="card-grid">
            {userCards.map(renderCard)}
          </div>
        </div>
      )}

<ModalCardDrop
  isOpen={isModalOpen}
  onClose={handleModalClose}
  card={selectedCard}
  onRemoveCard={handleRemoveCard} 
/>


      {collectedProfit !== null && (
        <ProfitToast amount={collectedProfit} />
      )}
    </div>
  );
};

export default CardPackOpener;


