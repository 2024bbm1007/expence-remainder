
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

interface ContactModalProps {
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ onClose }) => {
  const [name, setName] = useState('');
  const { addContact } = useAppContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      addContact(name.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Add New Contact</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contact's Name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              autoFocus
            />
            <div className="mt-6 flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={!name.trim()} className="px-6 py-2 rounded-lg bg-accent text-white font-semibold hover:bg-secondary disabled:bg-gray-400 transition-colors">
                Save Contact
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
