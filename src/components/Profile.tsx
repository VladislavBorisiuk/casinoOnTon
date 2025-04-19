import React, { useEffect, useState } from 'react';
import { supabase } from '../backend/supabaseClient';
import './Profile.css';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';

interface ProfileProps {
  username: string | null;
  avatar: string | null;
}

const Profile = ({ username, avatar }: ProfileProps) => {
  const [history, setHistory] = useState<any[]>([]);
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet(); // автоматически подтянет, если кошелёк уже подключён

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

  const connectWallet = async () => {
    try {
      await tonConnectUI.connectWallet(); // откроет модалку выбора кошелька
    } catch (err) {
      console.error('Ошибка при подключении TON:', err);
    }
  };

  return (
    <div className="profile">
      <div className="flex items-center">
        {avatar && <img src={avatar} alt="Аватар" className="avatar-img" />}
        <p>{username ? username : 'Загрузка...'}</p>
      </div>

      <div className="wallet-section">
        <p className="mt-4">
          {wallet?.account?.address ? (
            <>
              Кошелёк подключён: <strong>{wallet.account.address}</strong>
            </>
          ) : (
            <button onClick={connectWallet} className="connect-wallet-btn">
              Подключить TON кошелёк
            </button>
          )}
        </p>
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
