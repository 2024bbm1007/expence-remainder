
import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Contact, Transaction } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { USER_ID } from '../constants';

interface AppContextType {
  contacts: Contact[];
  transactions: Transaction[];
  addContact: (name: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  getContactName: (id: string) => string;
  calculateBalance: (contactId: string) => number;
  settleUp: (contactId: string) => void;
  getTransactionsForContact: (contactId: string) => Transaction[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contacts, setContacts] = useLocalStorage<Contact[]>('contacts', []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  
  const addContact = (name: string) => {
    const newContact: Contact = { id: crypto.randomUUID(), name };
    setContacts(prev => [...prev, newContact]);
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'date'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    setTransactions(prev => [...prev, newTransaction]);
  };

  const getContactName = (id: string) => {
    if (id === USER_ID) return 'You';
    return contacts.find(c => c.id === id)?.name || 'Unknown';
  };

  const calculateBalance = (contactId: string): number => {
    return transactions.reduce((acc, tx) => {
      const userIsParticipant = tx.participants.some(p => p.contactId === USER_ID);
      const contactIsParticipant = tx.participants.some(p => p.contactId === contactId);

      if (tx.paidById === USER_ID && contactIsParticipant) {
        // You paid, and they participated -> they owe you
        const participant = tx.participants.find(p => p.contactId === contactId);
        acc += participant?.amount || 0;
      } else if (tx.paidById === contactId && userIsParticipant) {
        // They paid, and you participated -> you owe them
        const participant = tx.participants.find(p => p.contactId === USER_ID);
        acc -= participant?.amount || 0;
      }
      return acc;
    }, 0);
  };
  
  const getTransactionsForContact = (contactId: string): Transaction[] => {
    return transactions
      .filter(tx => {
        const userInvolved = tx.paidById === USER_ID || tx.participants.some(p => p.contactId === USER_ID);
        const contactInvolved = tx.paidById === contactId || tx.participants.some(p => p.contactId === contactId);
        return userInvolved && contactInvolved;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const settleUp = (contactId: string) => {
    const balance = calculateBalance(contactId);
    if (balance === 0) return;

    if (balance > 0) { // They owe you
      addTransaction({
        description: `Settle up with ${getContactName(contactId)}`,
        amount: balance,
        paidById: contactId,
        participants: [{ contactId: USER_ID, amount: balance }],
      });
    } else { // You owe them
      addTransaction({
        description: `Settle up with ${getContactName(contactId)}`,
        amount: -balance,
        paidById: USER_ID,
        participants: [{ contactId: contactId, amount: -balance }],
      });
    }
  };

  const contextValue = useMemo(() => ({
    contacts,
    transactions,
    addContact,
    addTransaction,
    getContactName,
    calculateBalance,
    settleUp,
    getTransactionsForContact,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [contacts, transactions]);
  
  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
