import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Contact, Transaction, Group, SimplifiedDebt, SplitParticipant } from '../types';

interface AppContextType {
  contacts: Contact[];
  addContact: (name: string) => void;
  getContactName: (id: string) => string;
  
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (updatedTransaction: Transaction) => void;
  deleteTransaction: (transactionId: string) => void;
  settleUp: (contactId: string) => void;

  groups: Group[];
  addGroup: (group: Omit<Group, 'id'>) => void;
  updateGroup: (updatedGroup: Group) => void;
  getGroup: (id: string) => Group | undefined;
  calculateGroupBalances: (groupId: string) => SimplifiedDebt[];

  calculateBalance: (contactId: string) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contacts, setContacts] = useLocalStorage<Contact[]>('contacts', []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [groups, setGroups] = useLocalStorage<Group[]>('groups', []);

  const addContact = (name: string) => {
    const newContact: Contact = {
      id: new Date().toISOString() + Math.random(),
      name,
    };
    setContacts(prev => [...prev, newContact]);
  };

  const getContactName = (id: string) => {
    if (id === 'you') return 'You';
    return contacts.find(c => c.id === id)?.name || 'Unknown';
  };

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      id: new Date().toISOString() + Math.random(),
      ...transaction,
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const updateTransaction = (updatedTransaction: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
  };  
  const deleteTransaction = (transactionId: string) => {
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
  };

  const settleUp = (contactId: string) => {
    const balance = calculateBalance(contactId);
    if (balance === 0) return;

    // Create a settle-up transaction where both participants are included in the split.
    // If balance > 0 => contact owes you => contact pays, you are included in split
    // If balance < 0 => you owe contact => you pay, both included in split
    const isContactOwing = balance > 0;
    const transaction: Omit<Transaction, 'id'> = {
        description: "Settle Up",
        amount: Math.abs(balance),
        date: new Date().toISOString(),
        paidById: isContactOwing ? contactId : 'you',
        splitBetween: ['you', contactId],
    };
    addTransaction(transaction);
  };  

  const addGroup = (group: Omit<Group, 'id'>) => {
    const newGroup: Group = {
      id: new Date().toISOString() + Math.random(),
      ...group,
    };
    setGroups(prev => [...prev, newGroup]);
  };

  const updateGroup = (updatedGroup: Group) => {
    setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
  };

  const getGroup = (id: string) => {
    return groups.find(g => g.id === id);
  };

  const calculateBalance = (contactId: string) => {
    let balance = 0;
    transactions.forEach(t => {
      if (t.groupId) return; // Ignore group transactions for 1-on-1 balance

      const participants = t.splitBetween;
      // Only consider transactions that include both you and the contact for 1-on-1 balance
      if (!participants.includes('you') || !participants.includes(contactId)) return;

      if (t.customSplits) {
        // Compute explicit shares for you and the contact (fallback to 0 if missing)
        const yourShare = t.customSplits['you'] ?? 0;
        const theirShare = t.customSplits[contactId] ?? 0;

        if (t.paidById === 'you') {
          // You paid: contact owes theirShare to you
          balance += theirShare;
        } else if (t.paidById === contactId) {
          // Contact paid: you owe yourShare to them
          balance -= yourShare;
        } else {
          // Paid by a third party: treat as neutral for direct pairwise balance
          // (both you and contact owe the third party, so pairwise doesn't change)
        }
      } else { // Equal split
        const share = t.amount / participants.length;
        if (t.paidById === 'you') {
          balance += share;
        } else if (t.paidById === contactId) {
          balance -= share;
        } else {
          // third-party payer -> neutral for pairwise balance
        }
      }
    });
    return balance;
  };

  const calculateGroupBalances = (groupId: string): SimplifiedDebt[] => {
    const group = getGroup(groupId);
    if (!group) return [];
    const members: SplitParticipant[] = Array.from(new Set(['you', ...group.members]));
    const balances = new Map<SplitParticipant, number>(members.map(m => [m, 0]));

    transactions.filter(t => t.groupId === groupId).forEach(t => {
        const paidBy = t.paidById as SplitParticipant;
        const totalPaid = balances.get(paidBy) ?? 0;
        balances.set(paidBy, totalPaid + t.amount);

        if (t.customSplits) {
            t.splitBetween.forEach(participant => {
                const share = t.customSplits![participant] ?? 0;
                const currentOwed = balances.get(participant) ?? 0;
                balances.set(participant, currentOwed - share);
            });
        } else {
            const share = t.amount / t.splitBetween.length;
            t.splitBetween.forEach(participant => {
                const currentOwed = balances.get(participant) ?? 0;
                balances.set(participant, currentOwed - share);
            });
        }
    });

    const debtors = Array.from(balances.entries()).filter(([, b]) => b < 0).map(([p, b]) => ({id: p, amount: -b}));
    const creditors = Array.from(balances.entries()).filter(([, b]) => b > 0).map(([p, b]) => ({id: p, amount: b}));
    const simplifiedDebts: SimplifiedDebt[] = [];

    debtors.forEach(debtor => {
        creditors.forEach(creditor => {
            if (debtor.amount === 0 || creditor.amount === 0) return;
            const payment = Math.min(debtor.amount, creditor.amount);
            simplifiedDebts.push({ from: debtor.id, to: creditor.id, amount: payment });
            debtor.amount -= payment;
            creditor.amount -= payment;
        });
    });

    return simplifiedDebts;
  };

  return (
    <AppContext.Provider value={{
      contacts, addContact, getContactName,
      transactions, addTransaction, updateTransaction, deleteTransaction, settleUp,
      groups, addGroup, updateGroup, getGroup, calculateGroupBalances,
      calculateBalance
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};