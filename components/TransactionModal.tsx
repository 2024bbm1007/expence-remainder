
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { USER_ID, USER_NAME } from '../constants';
import { SplitType, Participant } from '../types';

interface TransactionModalProps {
  onClose: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ onClose }) => {
  const { contacts, addTransaction } = useAppContext();
  const allPossiblePayers = useMemo(() => [{ id: USER_ID, name: USER_NAME }, ...contacts], [contacts]);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paidById, setPaidById] = useState(USER_ID);
  const [splitType, setSplitType] = useState<SplitType>(SplitType.EQUALLY);
  const [participants, setParticipants] = useState<string[]>(allPossiblePayers.map(p => p.id));
  const [customSplits, setCustomSplits] = useState<Record<string, number | ''>>({});

  const totalAmount = typeof amount === 'number' ? amount : 0;
  
  useEffect(() => {
    // When participants change, reset custom splits
    const initialSplits: Record<string, number | ''> = {};
    allPossiblePayers.forEach(p => {
      initialSplits[p.id] = '';
    });
    setCustomSplits(initialSplits);
  }, [allPossiblePayers]);

  const handleParticipantToggle = (id: string) => {
    setParticipants(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };
  
  const totalCustomSplit = useMemo(() => {
    return participants.reduce((acc, id) => acc + (Number(customSplits[id]) || 0), 0);
  }, [customSplits, participants]);

  const isValid = useMemo(() => {
    if (!description || totalAmount <= 0 || participants.length === 0) return false;
    if (splitType === SplitType.UNEQUALLY) {
      return Math.abs(totalAmount - totalCustomSplit) < 0.01;
    }
    return true;
  }, [description, totalAmount, participants, splitType, totalCustomSplit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    let finalParticipants: Participant[] = [];
    if (splitType === SplitType.EQUALLY) {
      const splitAmount = totalAmount / participants.length;
      finalParticipants = participants.map(id => ({ contactId: id, amount: splitAmount }));
    } else {
      finalParticipants = participants.map(id => ({ contactId: id, amount: Number(customSplits[id]) || 0 }));
    }

    addTransaction({ description, amount: totalAmount, paidById, participants: finalParticipants });
    onClose();
  };
  
  const getParticipantName = (id: string) => allPossiblePayers.find(p => p.id === id)?.name || 'Unknown';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Add Expense</h2>
        </div>
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
          <div className="p-6 space-y-4">
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (e.g., Lunch)" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="0.00" className="w-full p-3 pl-7 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required min="0.01" step="0.01"/>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paid by</label>
              <select value={paidById} onChange={e => setPaidById(e.target.value)} className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {allPossiblePayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Split between</label>
              <div className="grid grid-cols-2 gap-2">
                {allPossiblePayers.map(p => (
                    <button type="button" key={p.id} onClick={() => handleParticipantToggle(p.id)}
                      className={`p-2 text-sm rounded-lg border ${participants.includes(p.id) ? 'bg-accent text-white border-accent' : 'bg-gray-100 dark:bg-gray-700 dark:border-gray-600'}`}>
                      {p.name}
                    </button>
                ))}
              </div>
            </div>

            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button type="button" onClick={() => setSplitType(SplitType.EQUALLY)} className={`w-1/2 p-2 rounded-md font-semibold text-sm ${splitType === SplitType.EQUALLY ? 'bg-white dark:bg-gray-600 shadow' : ''}`}>Equally</button>
                <button type="button" onClick={() => setSplitType(SplitType.UNEQUALLY)} className={`w-1/2 p-2 rounded-md font-semibold text-sm ${splitType === SplitType.UNEQUALLY ? 'bg-white dark:bg-gray-600 shadow' : ''}`}>Unequally</button>
            </div>

            {splitType === SplitType.EQUALLY && participants.length > 0 && (
                <div className="text-center text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    ₹{totalAmount > 0 ? (totalAmount / participants.length).toFixed(2) : '0.00'} per person
                </div>
            )}

            {splitType === SplitType.UNEQUALLY && (
                <div className="space-y-2">
                    {participants.map(id => (
                        <div key={id} className="flex items-center space-x-2">
                            <label className="w-1/3 text-gray-700 dark:text-gray-300">{getParticipantName(id)}</label>
                            <div className="relative flex-grow">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
                                <input type="number" placeholder="0.00" value={customSplits[id]}
                                  onChange={e => setCustomSplits(prev => ({ ...prev, [id]: e.target.value === '' ? '' : parseFloat(e.target.value) }))}
                                  className="w-full p-2 pl-7 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                        </div>
                    ))}
                    <div className={`flex justify-between p-2 rounded-lg text-sm ${Math.abs(totalAmount - totalCustomSplit) < 0.01 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
                        <span>Total: ₹{totalCustomSplit.toFixed(2)}</span>
                        <span>Remaining: ₹{(totalAmount - totalCustomSplit).toFixed(2)}</span>
                    </div>
                </div>
            )}
          </div>
        </form>
        <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={!isValid} className="px-6 py-2 rounded-lg bg-accent text-white font-semibold hover:bg-secondary disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">Save</button>
        </div>
      </div>
    </div>
  );
};
