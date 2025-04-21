import React from 'react';
import './Modal.css';

interface BalanceActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: string;
  setAmount: (value: string) => void;
  onConfirm: () => void;
  loading: boolean;
  title: string;
  placeholder: string;
  confirmLabel?: string;
}

const BalanceActionModal: React.FC<BalanceActionModalProps> = ({
  isOpen,
  onClose,
  amount,
  setAmount,
  onConfirm,
  loading,
  title,
  placeholder,
  confirmLabel = 'Подтвердить',
}) => {
  if (!isOpen) return null;

  return (
    <div className={isOpen ? 'modal active' : 'modal'}>
      <div className={isOpen ? 'modal-content active' : 'modal-content'}>
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <input
  type="number"
  min="0.2"
  value={amount}
  onChange={(e) => {
    const newValue = parseFloat(e.target.value);
    if (newValue >= 0.2 || e.target.value === "") { // Если новое значение >= 0.2 или поле пустое
      setAmount(e.target.value);
    }
  }}
  placeholder={placeholder}
  className="w-full mb-4 p-2 border rounded"
/>

<div className="flex justify-end button-container"> {/* Используем новый класс button-container */} 
  <button
    onClick={onClose}
    className="px-3 py-1 bg-gray-300 rounded"
  >
    Отмена
  </button>
  <button
    onClick={onConfirm}
    className="px-3 py-1 bg-green-500 text-white rounded"
    disabled={loading}
  >
    {loading ? 'Обработка...' : confirmLabel}
  </button>
</div>

      </div>
    </div>
  );
};

export default BalanceActionModal;
