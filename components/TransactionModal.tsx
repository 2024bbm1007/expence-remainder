import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Transaction, Contact, SplitParticipant } from '../types';
import { EXPENSE_CATEGORIES } from '../constants';

interface TransactionModalProps {
  onClose: () => void;
  contactId?: string;
  groupId?: string;
  transactionToEdit?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ onClose, contactId, groupId, transactionToEdit }) => {
  const { contacts, addTransaction, updateTransaction, getGroup, getContactName } = useAppContext();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [paidById, setPaidById] = useState<SplitParticipant>('you');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);
  const [splitType, setSplitType] = useState<'equal' | 'unequal'>('equal');
  const [customSplits, setCustomSplits] = useState<{ [key: string]: string }>({});
  
  const [isMounted, setIsMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const group = useMemo(() => groupId ? getGroup(groupId) : null, [groupId, getGroup]);
  const contact = useMemo(() => contactId ? contacts.find(c => c.id === contactId) : null, [contactId, contacts]);

  const participants = useMemo((): (Contact | {id: 'you', name: 'You'})[] => {
    if (group) return [{id: 'you', name: 'You'}, ...contacts.filter(c => group.members.includes(c.id))];
    if (contact) return [{id: 'you', name: 'You'}, contact];
    if (transactionToEdit?.groupId) {
        const editGroup = getGroup(transactionToEdit.groupId);
        if (editGroup) return [{id: 'you', name: 'You'}, ...contacts.filter(c => editGroup.members.includes(c.id))];
    }
    return [{id: 'you', name: 'You'}];
  }, [group, contact, contacts, transactionToEdit, getGroup]);

  useEffect(() => {
    if (transactionToEdit) {
      setDescription(transactionToEdit.description);
      setAmount(transactionToEdit.amount.toString());
      setPaidById(transactionToEdit.paidById);
      setCategory(transactionToEdit.category || EXPENSE_CATEGORIES[0]);
      setReceiptImage(transactionToEdit.receiptImage);
      if (transactionToEdit.customSplits) {
        setSplitType('unequal');
        const customSplitStrings: { [key: string]: string } = {};
        for (const key in transactionToEdit.customSplits) {
            customSplitStrings[key] = transactionToEdit.customSplits[key].toString();
        }
        setCustomSplits(customSplitStrings);
      }
    }
    setIsMounted(true);
  }, [transactionToEdit]);

  const handleCustomSplitChange = (participantId: string, value: string) => {
    setCustomSplits(prev => ({ ...prev, [participantId]: value }));
  };
  
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 300);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const totalCustomSplit = Object.values(customSplits).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const numericAmount = parseFloat(amount) || 0;
  const isCustomSplitValid = Math.abs(totalCustomSplit - numericAmount) < 0.01;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim() && numericAmount > 0 && (splitType === 'equal' || isCustomSplitValid)) {
      const baseTransaction = {
        description: description.trim(),
        amount: numericAmount,
        date: transactionToEdit?.date || new Date().toISOString(),
        paidById: paidById,
        splitBetween: participants.map(p => p.id),
        groupId: groupId || transactionToEdit?.groupId || null,
        category,
        receiptImage,
      };

      const finalTransaction = splitType === 'unequal' 
        ? { ...baseTransaction, customSplits: Object.fromEntries(Object.entries(customSplits).map(([k, v]) => [k, parseFloat(v) || 0])) }
        : { ...baseTransaction, customSplits: undefined };

      if (transactionToEdit) {
        updateTransaction({ ...finalTransaction, id: transactionToEdit.id });
      } else {
        addTransaction(finalTransaction);
      }
      handleClose();
    }
  };

  const formTitle = transactionToEdit ? 'Edit Expense' : (group ? `Add expense in "${group?.name}"` : 'Add an expense');
  
  return (
    <div className={`fixed inset-0 bg-black flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${isMounted && !isClosing ? 'bg-opacity-50' : 'bg-opacity-0'}`} onClick={handleClose}>
      <div onClick={e => e.stopPropagation()} className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ${isMounted && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} flex flex-col`}>
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{formTitle}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            <input id="description" type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" autoFocus />
            <input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="₹0.00" className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            <select id="category" value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"><option disabled>Category</option>{EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <select id="paidBy" value={paidById} onChange={e => setPaidById(e.target.value)} className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600">{participants.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}</select>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Receipt (optional)</label>
              <input type="file" onChange={handleFileChange} accept="image/*" className="mt-1 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
              {receiptImage && <img src={receiptImage} alt="receipt preview" className="mt-2 h-20 rounded-md"/>}
            </div>
            <div>
              <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg">
                  <button type="button" onClick={() => setSplitType('equal')} className={`w-1/2 p-2 rounded-l-md ${splitType === 'equal' ? 'bg-accent text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Split Equally</button>
                  <button type="button" onClick={() => setSplitType('unequal')} className={`w-1/2 p-2 rounded-r-md ${splitType === 'unequal' ? 'bg-accent text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Split Unequally</button>
              </div>
            </div>
            {splitType === 'unequal' && (
              <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  {participants.map(p => (
                      <div key={p.id} className="flex items-center justify-between">
                          <label htmlFor={`split-${p.id}`} className="text-sm">{p.name}</label>
                          <input id={`split-${p.id}`} type="number" placeholder="₹0.00" value={customSplits[p.id] || ''} onChange={e => handleCustomSplitChange(p.id, e.target.value)} className="w-1/3 px-2 py-1 border rounded-md dark:bg-gray-600 dark:border-gray-500"/>
                      </div>
                  ))}
                  <div className={`flex justify-between text-sm font-bold pt-2 border-t dark:border-gray-600 ${isCustomSplitValid ? 'text-positive' : 'text-negative'}`}>
                      <span>{isCustomSplitValid ? 'Total matches' : 'Total differs'}</span>
                      <span>₹{totalCustomSplit.toFixed(2)} of ₹{numericAmount.toFixed(2)}</span>
                  </div>
              </div>
            )}
        </form>
        <div className="p-6 flex justify-end space-x-3 border-t dark:border-gray-700">
          <button type="button" onClick={handleClose} className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-600">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={!description.trim() || !amount || (splitType === 'unequal' && !isCustomSplitValid)} className="px-6 py-2 rounded-lg bg-accent text-white font-semibold disabled:bg-gray-400">{transactionToEdit ? 'Save Changes' : 'Add Expense'}</button>
        </div>
      </div>
    </div>
  );
};