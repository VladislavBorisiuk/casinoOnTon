// ProfitToast.tsx
import React from 'react';

interface ProfitToastProps {
  amount: number;
}

const ProfitToast: React.FC<ProfitToastProps> = ({ amount }) => {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
      💰 Вы собрали {amount} ₽ прибыли!
    </div>
  );
};

export default ProfitToast;
