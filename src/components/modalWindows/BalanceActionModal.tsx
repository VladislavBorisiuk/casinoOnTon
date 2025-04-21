import React, { useState } from 'react';
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
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value); 
  
    const numericValue = parseFloat(value);
    if (!value || numericValue < 0.2) {
      setError('Минимальная сумма — 0.2');
    } else {
      setError('');
    }
  };
  

  return (
    <div className={isOpen ? 'modal active' : 'modal'}>
      <div className={isOpen ? 'modal-content active' : 'modal-content'}>
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        
        <input
          type="number"
          min="0.2"
          value={amount}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full mb-2 p-2 border rounded"
        />

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <div className="flex justify-end button-container">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-300 rounded"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1 bg-green-500 text-white rounded"
            disabled={loading || !!error}
          >
            {loading ? 'Обработка...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BalanceActionModal;
