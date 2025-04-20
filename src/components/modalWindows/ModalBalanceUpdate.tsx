// TopUpModal.tsx
import React from 'react';
import './Modal.css';

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
    <div className={isOpen ? "modal active" : "modal"}>
      <div className={isOpen ? "modal-content active" : "modal-content"}>
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
