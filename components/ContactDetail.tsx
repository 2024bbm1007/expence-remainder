import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { MoreVerticalIcon } from './icons/MoreVerticalIcon';
import { Transaction } from '../types';

interface ContactDetailProps {
  contactId: string;
  onBack: () => void;
  onAddTransaction: (contactId: string) => void;
  onEditTransaction: (transaction: Transaction) => void;
}

export const ContactDetail: React.FC<ContactDetailProps> = ({ contactId, onBack, onAddTransaction, onEditTransaction }) => {
  const { contacts, transactions, calculateBalance, getContactName, settleUp, deleteTransaction } = useAppContext();
  const contact = contacts.find(c => c.id === contactId);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  if (!contact) { return null; }

  const contactTransactions = transactions.filter(t => !t.groupId && t.splitBetween.includes('you') && t.splitBetween.includes(contact.id));
  const balance = calculateBalance(contact.id);
  
  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      deleteTransaction(id);
    }
    setActiveMenu(null);
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900/50">
      <header className="flex items-center p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
        <button onClick={onBack} className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
            <span className="font-bold text-lg text-primary dark:text-accent">{contact.name.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <h2 className="text-xl font-bold">{contact.name}</h2>
          {balance > 0 && <p className="text-sm text-positive">Owes you ₹{balance.toFixed(2)}</p>}
          {balance < 0 && <p className="text-sm text-negative">You owe ₹{(-balance).toFixed(2)}</p>}
          {balance === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">You are settled up</p>}
        </div>
      </header>
      
      <main className="flex-grow overflow-y-auto p-4 md:p-6">
        {contactTransactions.length > 0 ? (
          <ul className="space-y-4">
            {contactTransactions.map(t => {
              const youPaid = t.paidById === 'you';
              let yourShare = 0;
              if (t.customSplits) {
                yourShare = t.customSplits['you'] ?? 0;
              } else {
                yourShare = t.amount / t.splitBetween.length;
              }
              const yourLentOrBorrowed = youPaid ? yourShare : -yourShare;

              return (
                <li key={t.id} className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm relative">
                  <div className="mr-4 text-center">
                    <p className="text-xs text-gray-500 uppercase">{new Date(t.date).toLocaleString('default', { month: 'short' })}</p>
                    <p className="text-lg font-bold">{new Date(t.date).getDate()}</p>
                  </div>
                   {t.receiptImage ? <img src={t.receiptImage} className="w-10 h-10 object-cover rounded-md mr-4" alt="receipt"/> : <DocumentTextIcon className="w-8 h-8 mr-4 text-gray-400"/>}
                  <div className="flex-grow">
                    <p className="font-semibold">{t.description}</p>
                    <p className="text-sm text-gray-500">{getContactName(t.paidById)} paid ₹{t.amount.toFixed(2)}</p>
                    {t.category && <p className="text-xs text-blue-500 bg-blue-100 dark:bg-blue-900/50 inline-block px-2 py-0.5 rounded-full mt-1">{t.category}</p>}
                  </div>
                  <div className={`text-right ${yourLentOrBorrowed > 0 ? 'text-positive' : 'text-negative'}`}>
                    <p className="font-semibold">{yourLentOrBorrowed > 0 ? `you lent` : `you borrowed`}</p>
                    <p className="text-lg font-bold">₹{Math.abs(yourLentOrBorrowed).toFixed(2)}</p>
                  </div>
                  <div className="ml-2">
                    <button onClick={() => setActiveMenu(activeMenu === t.id ? null : t.id)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                      <MoreVerticalIcon className="w-5 h-5"/>
                    </button>
                    {activeMenu === t.id && (
                       <div className="absolute right-4 top-12 mt-2 w-32 bg-white dark:bg-gray-700 rounded-md shadow-lg z-20 border dark:border-gray-600">
                          <button onClick={() => { onEditTransaction(t); setActiveMenu(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">Edit</button>
                          <button onClick={() => handleDelete(t.id)} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600">Delete</button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center py-16">
            <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500" />
            <h3 className="mt-4 text-lg font-semibold">No transactions yet</h3>
            <p className="mt-1 text-sm text-gray-500">Add an expense to get started.</p>
          </div>
        )}
      </main>
      
      <footer className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex space-x-2">
        {balance !== 0 && (
          <button onClick={() => settleUp(contact.id)} className="w-full bg-positive text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors">
            Settle Up
          </button>
        )}
        <button onClick={() => onAddTransaction(contact.id)} className="w-full bg-accent text-white font-bold py-3 px-4 rounded-lg hover:bg-secondary transition-colors">
          Add Expense
        </button>
      </footer>
    </div>
  );
};