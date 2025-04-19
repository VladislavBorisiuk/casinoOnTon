import React, { useState, useEffect } from 'react';
import { supabase } from '../backend/supabaseClient';
import './Profile.css';

interface ProfileProps {
  username: string | null;
  avatar: string | null;
}

const Profile = ({ username, avatar }: ProfileProps) => {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString();
      if (!telegramId) return;
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();
      if (userError || !user) return;
      const { data: bets, error: betsError } = await supabase
        .from('bets_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (betsError) return;
      setHistory(bets);
    };

    fetchHistory();
  }, []);

  return (
    <div className="profile">
      <div className="flex items-center">
        {avatar && <img src={avatar} alt="Аватар" className="avatar-img" />      }
        <p>{username ? `${username}` : 'Загрузка...'}</p>
      </div>
      <div className="history">
      <p>История ставок</p>
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Ставка</th>
              <th>Сумма</th>
              <th>Результат</th>
              <th>Выигрыш</th>
            </tr>
          </thead>
          <tbody>
            {history.map((bet, index) => (
              <tr key={index}>
                <td>{new Date(bet.created_at).toLocaleString()}</td>
                <td>{bet.bet_option}</td>
                <td>{bet.amount} ₽</td>
                <td className={bet.result ? 'win' : ''}>{bet.result ? '✅' : '❌'}</td>
                <td>{bet.win_amount} ₽</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Profile;
