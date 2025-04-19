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
  const wallet = useTonWallet();

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
      await tonConnectUI.openModal(); // используем openModal для подключения кошелька
    } catch (err) {
      console.error('Ошибка при подключении TON:', err);
    }
  };

  const disconnectWallet = () => {
    tonConnectUI.disconnect();
  };

  // Функция для обрезки кошелька до первых 4 и последних 4 символов
  const shortenAddress = (address: string) => {
    if (address && address.length > 8) {
      return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }
    return address; // Возвращаем адрес как есть, если он слишком короткий
  };

  return (
    <div className="profile flex flex-col items-center text-center">
      <div className="flex items-center">
        {avatar && <img src={avatar} alt="Аватар" className="avatar-img" />}
        <p>{username ? username : 'Загрузка...'}</p>
      </div>
      <div className="wallet-section mt-4 flex flex-col items-center w-full">
  {wallet?.account?.address ? (
    <>
      <p className="text-sm text-gray-500 mb-2 text-center">Подключенный кошелёк:</p>
      <div className="flex justify-center w-full">
  <div className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-lg">
    <span className="font-mono">{shortenAddress(wallet.account.address)}</span>
    <button
      onClick={disconnectWallet}
      className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs flex items-center justify-center"
      title="Отключить или сменить"
    >
      ×
    </button>
  </div>
</div>

    </>
  ) : (
    <button onClick={connectWallet} className="connect-wallet-btn">
      Подключить TON кошелёк
    </button>
  )}
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
