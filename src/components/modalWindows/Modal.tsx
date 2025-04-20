// Обновленный компонент Modal
import React from 'react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  isWin: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, message, isWin }) => {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose(); // Закрываем модальное окно
  };

  return (
    <div className={isOpen ? "modal active" : "modal"} 
      onClick={handleClose} // Закрытие при клике на фон
    >
      <div className={isOpen ? "modal-content active" : "modal-content"}>
        <h2 className="text-2xl font-bold mb-4">{isWin ? 'Победа!' : 'Проигрыш'}</h2>
        <p className="mb-4">{message}</p>
      </div>
    </div>
  );
};

export default Modal;
