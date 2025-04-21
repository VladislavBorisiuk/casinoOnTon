// Profile.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../backend/supabaseClient';
import './Profile.css';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import TopUpModal from './modalWindows/ModalBalanceUpdate'; // Подключаем новый компонент

interface ProfileProps {
  username: string | null;
  avatar: string | null;
}

const Profile = ({ username, avatar }: ProfileProps) => {
  const [history, setHistory] = useState<any[]>([]);
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [loadingTopUp, setLoadingTopUp] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // Добавляем состояние для успешного пополнения
  const [modalMessage, setModalMessage] = useState(''); // Сообщение для модального окна

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
      await tonConnectUI.openModal();
    } catch (err) {
      console.error('Ошибка при подключении TON:', err);
    }
  };

  const disconnectWallet = () => {
    tonConnectUI.disconnect();
  };

  const shortenAddress = (address: string) => {
    if (address && address.length > 8) {
      return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }
    return address;
  };

  const handleTopUp = async () => {
    setLoadingTopUp(true);
    try {
      if (!wallet?.account?.address || !topUpAmount) return;

      const tonAmount = parseFloat(topUpAmount);
      const amountNano = BigInt(tonAmount * 1e9);
      const destination = 'UQC1dz85b5O8PuD_fh9Axpub0VaDHQNxviAKER6rbmG4KUyC';

      await tonConnectUI.sendTransaction({
        messages: [
          {
            address: destination,
            amount: amountNano.toString(),
          },
        ],
        validUntil: Math.floor(Date.now() / 1000) + 600,
      });

      const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString();
      if (!telegramId) return;

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, balance')
        .eq('telegram_id', telegramId)
        .single();

      if (userError || !user) return;

      const newBalance = (user.balance || 0) + tonAmount * 1000;

      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', user.id);

      if (updateError) {
        console.error('Ошибка при обновлении баланса:', updateError);
        return;
      }

      setIsSuccess(true);
      setModalMessage(`Ваш баланс был успешно пополнен на ${tonAmount} TON!`);
    } catch (err) {
      console.error(err);
      setIsSuccess(false);
      setModalMessage('Произошла ошибка при пополнении баланса. Попробуйте снова.');
    } finally {
      setLoadingTopUp(false);
      setShowTopUpModal(false); 
    }
  };

  return (
    <div className="profile flex flex-col items-center text-center">
      <div className="flex items-center">
        {avatar && <img src={avatar} alt="Аватар" className="avatar-img" />}
        <p>{username ? username : 'Загрузка...'}</p>
      </div>

      <div className="wallet-section mt-4 w-full flex justify-center">
        <div className="flex flex-col items-center">
          {wallet?.account?.address ? (
            <>
              <p className="text-sm text-gray-500 mb-2 text-center">Подключенный кошелёк:</p>
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

              <div className="mt-4">
                <button
                  onClick={() => setShowTopUpModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                >
                  Пополнить баланс
                </button>
              </div>
            </>
          ) : (
            <button onClick={connectWallet} className="connect-wallet-btn mx-auto">
              Подключить TON кошелёк
            </button>
          )}
        </div>
      </div>

      <div className="history mt-6 w-full max-w-3xl">
        <p className="text-lg font-semibold mb-2">История ставок</p>
        <table className="w-full table-auto border-collapse">
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

      <TopUpModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        topUpAmount={topUpAmount}
        setTopUpAmount={setTopUpAmount}
        handleTopUp={handleTopUp}
        loadingTopUp={loadingTopUp}
      />
    </div>
  );
};

export default Profile;
