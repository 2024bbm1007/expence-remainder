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
    if (Math.abs(balance) < 0.01) return;

    // Correctly creates a transaction that represents a direct payment to settle the balance.
    // The key is using customSplits to show the entire amount benefits the person being paid back.
    const transaction: Omit<Transaction, 'id'> = {
        description: "Settle Up",
        amount: Math.abs(balance),
        date: new Date().toISOString(),
        // If balance is negative, I owe them, so I am the payer.
        // If balance is positive, they owe me, so they are the payer.
        paidById: balance < 0 ? 'you' : contactId,
        // The transaction is between the two of us.
        splitBetween: ['you', contactId],
        // The custom split ensures the balance transfer is correct.
        // If I pay them back, their share of this "expense" is the full amount, and mine is 0.
        customSplits: balance < 0 
            ? { [contactId]: Math.abs(balance), 'you': 0 }
            : { 'you': Math.abs(balance), [contactId]: 0 },
        category: 'General',
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
    let balance = 0; // Positive: contact owes you. Negative: you owe contact.
    transactions.forEach(t => {
      // Ignore group transactions for 1-on-1 balances
      if (t.groupId) return;

      const participants = t.splitBetween;
      // Only consider transactions involving both you and the specific contact
      if (!participants.includes('you') || !participants.includes(contactId)) {
        return;
      }

      if (t.customSplits) {
        const yourShare = t.customSplits['you'] ?? 0;
        const contactShare = t.customSplits[contactId] ?? 0;

        if (t.paidById === 'you') {
          // If I paid, I am owed their share.
          balance += contactShare;
        } else if (t.paidById === contactId) {
          // If they paid, I owe them my share.
          balance -= yourShare;
        }
        // If a third party paid, it creates no direct debt between you and the contact.
        // Each of you now owes the third-party payer, so the 1-on-1 balance is unaffected.
        
      } else { // Equal split
        const share = t.amount / participants.length;
        if (t.paidById === 'you') {
          // If I paid, my balance with them increases by their share.
          balance += share;
        } else if (t.paidById === contactId) {
          // If they paid, my balance with them decreases by my share.
          balance -= share;
        }
        // If a third party paid, the logic is the same as above: no direct debt is created between you two.
      }
    });
    return balance;
  };

  const calculateGroupBalances = (groupId: string): SimplifiedDebt[] => {
    const group = getGroup(groupId);
    if (!group) return [];
    
    // Deduplicate members to prevent issues if 'you' is accidentally added to the group members array
    const members: SplitParticipant[] = Array.from(new Set(['you', ...group.members]));
    const balances = new Map<SplitParticipant, number>(members.map(m => [m, 0]));

    transactions.filter(t => t.groupId === groupId).forEach(t => {
        const paidBy = t.paidById;
        // Ensure the payer has an entry in the balance map, even if they aren't an official member
        if (!balances.has(paidBy)) {
            balances.set(paidBy, 0);
        }
        const totalPaid = balances.get(paidBy) ?? 0;
        balances.set(paidBy, totalPaid + t.amount);

        if (t.customSplits) {
            t.splitBetween.forEach(participant => {
                if (!balances.has(participant)) balances.set(participant, 0);
                const share = t.customSplits![participant] ?? 0;
                const currentOwed = balances.get(participant) ?? 0;
                balances.set(participant, currentOwed - share);
            });
        } else {
            const share = t.amount / t.splitBetween.length;
            t.splitBetween.forEach(participant => {
                if (!balances.has(participant)) balances.set(participant, 0);
                const currentOwed = balances.get(participant) ?? 0;
                balances.set(participant, currentOwed - share);
            });
        }
    });

    const debtors = Array.from(balances.entries()).filter(([, b]) => b < -0.01).map(([p, b]) => ({id: p, amount: -b}));
    const creditors = Array.from(balances.entries()).filter(([, b]) => b > 0.01).map(([p, b]) => ({id: p, amount: b}));
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

    return simplifiedDebts.filter(d => d.amount > 0.01);
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