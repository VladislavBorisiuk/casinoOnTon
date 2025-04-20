// TopUpModal.tsx
import React from 'react';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  topUpAmount: string;
  setTopUpAmount: (value: string) => void;
  handleTopUp: () => void;
  loadingTopUp: boolean;
}

const ModalBalanceUpdate: React.FC<TopUpModalProps> = ({
  isOpen,
  onClose,
  topUpAmount,
  setTopUpAmount,
  handleTopUp,
  loadingTopUp,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[300px] shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Пополнить баланс</h2>
        <input
          type="number"
          min="0"
          value={topUpAmount}
          onChange={(e) => setTopUpAmount(e.target.value)}
          placeholder="Введите сумму в TON"
          className="w-full mb-4 p-2 border rounded"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-300 rounded"
          >
            Отмена
          </button>
          <button
            onClick={handleTopUp}
            className="px-3 py-1 bg-green-500 text-white rounded"
            disabled={loadingTopUp}
          >
            {loadingTopUp ? 'Отправка...' : 'Подтвердить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalBalanceUpdate;
