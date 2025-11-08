import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { MoreVerticalIcon } from './icons/MoreVerticalIcon';
import { Transaction } from '../types';

interface GroupDetailProps {
  groupId: string;
  onBack: () => void;
  onAddTransaction: (groupId: string) => void;
  onEditTransaction: (transaction: Transaction) => void;
}

export const GroupDetail: React.FC<GroupDetailProps> = ({ groupId, onBack, onAddTransaction, onEditTransaction }) => {
  const { groups, transactions, getContactName, calculateGroupBalances, deleteTransaction } = useAppContext();
  const group = groups.find(g => g.id === groupId);
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances'>('expenses');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  if (!group) { return null; }

  const groupTransactions = transactions.filter(t => t.groupId === group.id);
  const simplifiedDebts = calculateGroupBalances(group.id);
  
  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      deleteTransaction(id);
    }
    setActiveMenu(null);
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900/50">
      <header className="flex items-center p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
        <button onClick={onBack} className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ArrowLeftIcon className="w-6 h-6" /></button>
        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3"><UserGroupIcon className="w-6 h-6 text-green-600 dark:text-green-300" /></div>
        <div>
          <h2 className="text-xl font-bold">{group.name}</h2>
          <p className="text-sm text-gray-500">{group.members.length + 1} members</p>
        </div>
      </header>

      <div className="border-b dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex">
              <button onClick={() => setActiveTab('expenses')} className={`flex-1 py-3 text-sm font-semibold ${activeTab === 'expenses' ? 'border-b-2 border-accent text-accent' : 'text-gray-500'}`}>Expenses</button>
              <button onClick={() => setActiveTab('balances')} className={`flex-1 py-3 text-sm font-semibold ${activeTab === 'balances' ? 'border-b-2 border-accent text-accent' : 'text-gray-500'}`}>Balances</button>
          </div>
      </div>
      
      <main className="flex-grow overflow-y-auto p-4 md:p-6">
        {activeTab === 'expenses' && (
          groupTransactions.length > 0 ? (
            <ul className="space-y-4">
              {groupTransactions.map(t => (
                <li key={t.id} className="flex items-start p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm relative">
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
                  <div className="text-right">
                    <p className="text-lg font-bold">₹{t.amount.toFixed(2)}</p>
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
              ))}
            </ul>
          ) : <div className="text-center py-16"><h3 className="text-lg font-semibold">No group expenses yet</h3></div>
        )}
        {activeTab === 'balances' && (
          simplifiedDebts.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-bold text-lg mb-2">Who owes who</h3>
              {simplifiedDebts.map((debt, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <span className="font-semibold">{getContactName(debt.from)}</span>
                    <span className="text-gray-500">owes</span>
                    <span className="font-semibold">{getContactName(debt.to)}</span>
                    <span className="font-bold text-lg text-primary">₹{debt.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-16"><h3 className="text-lg font-semibold">Everyone is settled up!</h3></div>
        )}
      </main>
      
      <footer className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
        <button onClick={() => onAddTransaction(group.id)} className="w-full bg-accent text-white font-bold py-3 px-4 rounded-lg hover:bg-secondary transition-colors">
          Add Group Expense
        </button>
      </footer>
    </div>
  );
};