
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { USER_ID } from '../constants';
import { Transaction } from '../types';

interface ContactDetailProps {
  contactId: string;
}

export const ContactDetail: React.FC<ContactDetailProps> = ({ contactId }) => {
  const { getContactName, calculateBalance, settleUp, getTransactionsForContact } = useAppContext();

  const contactName = getContactName(contactId);
  const balance = calculateBalance(contactId);
  const transactions = getTransactionsForContact(contactId);

  const handleSettleUp = () => {
    if (window.confirm(`Are you sure you want to settle up with ${contactName}?`)) {
      settleUp(contactId);
    }
  };
  
  const TransactionItem: React.FC<{ tx: Transaction }> = ({ tx }) => {
    const paidBy = getContactName(tx.paidById);
    const userShare = tx.participants.find(p => p.contactId === USER_ID)?.amount || 0;
    const contactShare = tx.participants.find(p => p.contactId === contactId)?.amount || 0;
    
    let detailText = '';
    let amountText = '';
    let amountColor = 'text-gray-500 dark:text-gray-400';
    
    if (tx.description.startsWith('Settle up')) {
      if (tx.paidById === USER_ID) {
        detailText = `You paid ${contactName}`;
        amountText = `₹${tx.amount.toFixed(2)}`;
        amountColor = 'text-negative';
      } else {
        detailText = `${contactName} paid you`;
        amountText = `₹${tx.amount.toFixed(2)}`;
        amountColor = 'text-positive';
      }
    } else if (tx.paidById === USER_ID) {
        detailText = `You paid and your share was ₹${userShare.toFixed(2)}`;
        amountText = `+ ₹${(tx.amount - userShare).toFixed(2)}`;
        amountColor = 'text-positive';
    } else if (tx.paidById === contactId) {
        detailText = `${contactName} paid and your share was ₹${userShare.toFixed(2)}`;
        amountText = `- ₹${userShare.toFixed(2)}`;
        amountColor = 'text-negative';
    }

    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg flex justify-between items-center">
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-200">{tx.description}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(tx.date).toLocaleDateString()}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{detailText}</p>
        </div>
        <p className={`font-bold text-lg ${amountColor}`}>{amountText}</p>
      </div>
    );
  };
  
  return (
    <div className="p-4 md:p-6 flex flex-col h-full">
      <div className="flex-grow overflow-y-auto pb-24">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">{contactName}</h2>
          {balance > 0 && <p className="text-positive">Owes you <span className="font-bold">₹{balance.toFixed(2)}</span></p>}
          {balance < 0 && <p className="text-negative">You owe <span className="font-bold">₹{(-balance).toFixed(2)}</span></p>}
          {balance === 0 && <p className="text-gray-500 dark:text-gray-400">You are settled up</p>}
        </div>

        <div className="space-y-3">
          {transactions.length > 0 ? (
             transactions.map(tx => <TransactionItem key={tx.id} tx={tx} />)
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No transactions with {contactName} yet.</p>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4 shadow-lg">
        <button
          onClick={handleSettleUp}
          disabled={balance === 0}
          className="w-full bg-accent text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-secondary transition-colors duration-200"
        >
          Settle Up
        </button>
      </div>
    </div>
  );
};
