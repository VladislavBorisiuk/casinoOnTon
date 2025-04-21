import React, { useEffect, useState } from 'react';
import { supabase } from '../backend/supabaseClient';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import BalanceActionModal from './modalWindows/BalanceActionModal';
import './Profile.css';

interface ProfileProps {
  username: string | null;
  avatar: string | null;
}

const Profile = ({ username, avatar }: ProfileProps) => {
  const [history, setHistory] = useState<any[]>([]);
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loadingTopUp, setLoadingTopUp] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const fetchUserData = async () => {
    const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString();
    if (!telegramId) return null;

    const { data, error } = await supabase
      .from('users')
      .select('id, balance')
      .eq('telegram_id', telegramId)
      .single();

    if (error || !data) {
      console.error('Ошибка получения пользователя:', error);
      return null;
    }

    return data;
  };

  const saveTransaction = async (userId: string, amount: number, type: 'topup' | 'withdraw', tonAddress: string) => {
    await supabase.from('transactions').insert([
      {
        user_id: userId,
        amount,
        type,
        ton_address: tonAddress,
      },
    ]);
  };

  const handleTopUp = async () => {
    setLoadingTopUp(true);
    try {
      const user = await fetchUserData();
      if (!user || !wallet?.account?.address || !topUpAmount) {
        throw new Error('Не удалось получить данные пользователя или кошелька');
      }
  
      const tonAmount = parseFloat(topUpAmount);
      if (isNaN(tonAmount) || tonAmount <= 0) {
        throw new Error('Некорректная сумма');
      }
  
      const amountNano = BigInt(String(tonAmount * 1e9));
      const destination = 'UQC1dz85b5O8PuD_fh9Axpub0VaDHQNxviAKER6rbmG4KUyC';
  
      // Отправка TON транзакции
      const result = await tonConnectUI.sendTransaction({
        messages: [{ address: destination, amount: amountNano.toString() }],
        validUntil: Math.floor(Date.now() / 1000) + 600,
      });
  
      if (!result?.boc) {
        throw new Error('Транзакция не была выполнена. Повторите попытку позже.');
      }
  
      const newBalance = (parseFloat(user.balance) || 0) + tonAmount * 1000;
  
      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', user.id);
  
      if (updateError) {
        throw new Error('Не удалось обновить баланс пользователя');
      }
  
      const { error: insertError } = await supabase
  .from('transactions')
  .insert([
    {
      user_id: user.id,
      amount: tonAmount,
      type: 'topup',
      ton_address: wallet.account.address,
    },
  ]);

if (insertError) {
  throw new Error('Ошибка записи транзакции в базу данных: ' + insertError.message + user.id);
}

  
      setIsSuccess(true);
      setModalMessage(`Баланс пополнен на ${tonAmount} TON`);
    } catch (err: any) {
      console.error('Ошибка пополнения:', err);
      setIsSuccess(false);
      setModalMessage(err.message || 'Ошибка при пополнении. Попробуйте позже.');
    } finally {
      setLoadingTopUp(false);
      setShowTopUpModal(false);
    }
  };
  

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      const user = await fetchUserData();
      if (!user || !wallet?.account?.address || !withdrawAmount) return;
  
      const tonAmount = parseFloat(withdrawAmount);
      if (isNaN(tonAmount) || tonAmount <= 0) throw new Error('Некорректная сумма');
  
      const currentBalance = parseFloat(user.balance);
      const amountInInternalUnits = tonAmount * 1000;
  
      if (currentBalance < amountInInternalUnits) {
        throw new Error('Недостаточно средств на балансе');
      }
  
      const newBalance = currentBalance - amountInInternalUnits;
  
      // Обновляем баланс
      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', user.id);
  
      if (updateError) {
        throw new Error('Не удалось обновить баланс');
      }
  
      // Записываем транзакцию
      const { error: insertError } = await supabase.from('transactions').insert([
        {
          user_id: user.id,
          amount: tonAmount,
          type: 'withdraw',
          ton_address: wallet.account.address,
        },
      ]);
  
      if (insertError) {
        throw new Error('Ошибка записи транзакции в базу данных '+insertError.message+ user.id);
      }
  
      alert(
        'Транзакция в обработке, это может занять несколько минут.\n\n' +
        'Если средства не поступили в течение 10 минут, обратитесь к @ArtemSverdlovtg для устранения проблемы.'
      );
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Ошибка при оформлении заявки на вывод.');
    } finally {
      setWithdrawing(false);
      setWithdrawAmount('');
      setShowWithdrawModal(false);
    }
  };
  
  

  useEffect(() => {
    const fetchHistory = async () => {
      const user = await fetchUserData();
      if (!user) return;

      const { data, error } = await supabase
        .from('bets_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) return;
      setHistory(data);
    };

    fetchHistory();
  }, []);

  const shortenAddress = (address: string) =>
    address.length > 8 ? `${address.slice(0, 4)}...${address.slice(-4)}` : address;

  const connectWallet = async () => {
    try {
      await tonConnectUI.openModal();
    } catch (err) {
      console.error('Ошибка подключения TON:', err);
    }
  };

  const disconnectWallet = () => tonConnectUI.disconnect();

  return (
    <div className="profile flex flex-col items-center text-center">
      <div className="flex items-center">
        {avatar && <img src={avatar} alt="Аватар" className="avatar-img" />}
        <p>{username || 'Загрузка...'}</p>
      </div>

      <div className="wallet-section mt-4 w-full flex justify-center">
        <div className="flex flex-col items-center">
          {wallet?.account?.address ? (
            <>
              <p className="text-sm text-gray-500 mb-2 text-center">Подключённый кошелёк:</p>
              <div className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-lg">
                <span className="font-mono">{shortenAddress(wallet.account.address)}</span>
                <button
                  onClick={disconnectWallet}
                  className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs flex items-center justify-center"
                  title="Отключить"
                >
                  ×
                </button>
              </div>
              <button onClick={() => setShowTopUpModal(true)} className="btn">
  Пополнить
</button>
<button
  onClick={() => setShowWithdrawModal(true)}
  disabled={withdrawing}
  className="btn withdraw"
>
  {withdrawing ? 'Вывод...' : 'Вывести'}
</button>

            </>
          ) : (
            <button onClick={connectWallet} className="connect-wallet-btn">
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

      <BalanceActionModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        amount={topUpAmount}
        setAmount={setTopUpAmount}
        onConfirm={handleTopUp}
        loading={loadingTopUp}
        title="Пополнить баланс"
        placeholder="Введите сумму для пополнения"
      />

      <BalanceActionModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        amount={withdrawAmount}
        setAmount={setWithdrawAmount}
        onConfirm={handleWithdraw}
        loading={withdrawing}
        title="Вывести TON"
        placeholder="Введите сумму для вывода"
        confirmLabel="Вывести"
      />
    </div>
  );
};

export default Profile;
