// src/components/TelegramAuth.tsx
import { useEffect } from 'react'
import { supabase } from '../backend/supabaseClient'

type Props = {
  setUsername: (username: string) => void
  setBalance: (balance: number) => void
}

declare global {
    interface Window {
      Telegram: any;
    }
  }

const TelegramAuth = ({ setUsername, setBalance }: Props) => {
  useEffect(() => {
    const initTelegram = async () => {
      const tg = window.Telegram?.WebApp;
      const telegramId = tg?.initDataUnsafe?.user?.id?.toString();
      const username = tg?.initDataUnsafe?.user?.username;

      if (!telegramId || !username) {
        console.warn('Telegram данные не найдены');
        return;
      }

      checkUserExistence(telegramId, username);
    };

    initTelegram();
  }, []);

  const checkUserExistence = async (telegramId: string, username: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .maybeSingle();

    if (error) {
      console.error('Ошибка при получении пользователя:', error);
      return;
    }

    if (!data) {
      createUser(telegramId, username);
    } else {
      console.log('Пользователь найден:', data);
      setUsername(data.username);
      setBalance(data.balance); 
    }
  };

  const createUser = async (telegramId: string, username: string) => {
    const { data, error } = await supabase.from('users').insert([{
      telegram_id: telegramId,
      username,
      balance: 1000, 
    }]).select().single();

    if (error) {
      console.error('Ошибка при создании пользователя:', error);
    } else {
      console.log('Пользователь создан:', data);
      setUsername(data.username);
      setBalance(data.balance); 
    }
  };

  return null;
};

export default TelegramAuth;
