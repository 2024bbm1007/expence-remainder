
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { UsersIcon } from './icons/UsersIcon';

interface ContactListProps {
  onSelectContact: (contactId: string) => void;
}

export const ContactList: React.FC<ContactListProps> = ({ onSelectContact }) => {
  const { contacts, calculateBalance } = useAppContext();

  const totalBalance = contacts.reduce((acc, contact) => acc + calculateBalance(contact.id), 0);
  const totalOwedToYou = contacts.reduce((acc, contact) => {
    const balance = calculateBalance(contact.id);
    return balance > 0 ? acc + balance : acc;
  }, 0);
  const totalYouOwe = contacts.reduce((acc, contact) => {
    const balance = calculateBalance(contact.id);
    return balance < 0 ? acc + balance : acc;
  }, 0);

  const BalanceSummary = () => (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 mb-6 text-sm">
      <div className="flex justify-between items-center border-b pb-2 mb-2 dark:border-gray-700">
        <span className="font-semibold text-gray-700 dark:text-gray-300">Total balance</span>
        <span className={`font-bold ${totalBalance >= 0 ? 'text-positive' : 'text-negative'}`}>
          ₹{totalBalance.toFixed(2)}
        </span>
      </div>
      <div className="flex justify-between text-gray-500 dark:text-gray-400">
        <span>You are owed</span>
        <span className="text-positive">₹{totalOwedToYou.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-gray-500 dark:text-gray-400">
        <span>You owe</span>
        <span className="text-negative">₹{(-totalYouOwe).toFixed(2)}</span>
      </div>
    </div>
  );
  
  const ContactItem = ({ contact }: { contact: {id: string, name: string} }) => {
    const balance = calculateBalance(contact.id);
    const owesYou = balance > 0;
    const youOwe = balance < 0;

    return (
      <li
        onClick={() => onSelectContact(contact.id)}
        className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200"
      >
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-4">
            <span className="font-bold text-lg text-primary dark:text-accent">{contact.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200">{contact.name}</p>
            {balance !== 0 && (
              <p className={`text-sm ${owesYou ? 'text-positive' : 'text-negative'}`}>
                {owesYou ? `Owes you ₹${balance.toFixed(2)}` : `You owe ₹${(-balance).toFixed(2)}`}
              </p>
            )}
            {balance === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Settled up</p>
            )}
          </div>
        </div>
        <div className={`font-bold text-lg ${owesYou ? 'text-positive' : youOwe ? 'text-negative' : 'text-gray-500'}`}>
            {balance > 0 ? `+₹${balance.toFixed(2)}` : balance < 0 ? `-₹${(-balance).toFixed(2)}` : `₹0.00`}
        </div>
      </li>
    );
  };

  return (
    <div className="p-4 md:p-6">
      <BalanceSummary />
      {contacts.length > 0 ? (
        <ul className="space-y-3">
          {contacts.map(contact => <ContactItem key={contact.id} contact={contact} />)}
        </ul>
      ) : (
        <div className="text-center py-16 px-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <UsersIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500" />
          <h3 className="mt-4 text-lg font-semibold text-gray-800 dark:text-gray-200">No Contacts Yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add a contact to start splitting expenses.</p>
        </div>
      )}
    </div>
  );
};
