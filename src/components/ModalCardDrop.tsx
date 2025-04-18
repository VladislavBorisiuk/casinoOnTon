import React from 'react';
import './Modal.css';

interface Card {
  suit: string | null;
  rank: string;
  currency_income: number;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card | null;
  onRemoveCard: () => void;  
}


const ModalCardDrop: React.FC<ModalProps> = ({ isOpen, onClose, card, onRemoveCard }) => {
  if (!isOpen || !card) return null;

  const handleClose = () => {
    onClose(); 
  };

  return (
    <div className={isOpen ? "modal active" : "modal"} onClick={handleClose}>
      <div className={isOpen ? "modal-content active" : "modal-content"} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">{card.rank} {card.suit ? card.suit : ''}</h2>
        <p className="mb-4">Карта стейкинга!</p>
        <div className="card">
          <span className="rank">{card.rank}</span>
          {card.suit && <span className="suit">{card.suit}</span>}
          <span className="currency">Приносит {card.currency_income}₽ в час</span>
        </div>
        <button className="btn-close" onClick={handleClose}>Закрыть</button>
        <button className="btn-remove" onClick={onRemoveCard}>Продать карту {card.currency_income}₽</button>
      </div>
    </div>
  );
};


export default ModalCardDrop;
