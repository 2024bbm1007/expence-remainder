import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Group } from '../types';

interface GroupModalProps {
  onClose: () => void;
  groupToEdit?: Group | null;
}

export const GroupModal: React.FC<GroupModalProps> = ({ onClose, groupToEdit }) => {
  const [name, setName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const { contacts, addGroup, updateGroup } = useAppContext();
  const [isMounted, setIsMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (groupToEdit) {
      setName(groupToEdit.name);
      setSelectedMembers(groupToEdit.members);
    }
    setIsMounted(true);
  }, [groupToEdit]);
  
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 300);
  };

  const handleToggleMember = (contactId: string) => {
    setSelectedMembers(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && selectedMembers.length > 0) {
      if (groupToEdit) {
        updateGroup({ ...groupToEdit, name: name.trim(), members: selectedMembers });
      } else {
        addGroup({ name: name.trim(), members: selectedMembers });
      }
      handleClose();
    }
  };

  const title = groupToEdit ? 'Edit Group' : 'Create New Group';
  const buttonText = groupToEdit ? 'Save Changes' : 'Create Group';

  return (
    <div 
      className={`fixed inset-0 bg-black flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${isMounted && !isClosing ? 'bg-opacity-50' : 'bg-opacity-0'}`}
      onClick={handleClose}
    >
      <div 
        onClick={e => e.stopPropagation()}
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ${isMounted && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">{title}</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name</label>
              <input id="groupName" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Trip to Goa" className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" autoFocus/>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Members</label>
                <div className="max-h-48 overflow-y-auto border dark:border-gray-600 rounded-lg p-2 space-y-2">
                    {contacts.length > 0 ? contacts.map(contact => (
                        <div key={contact.id} className="flex items-center p-1">
                            <input type="checkbox" id={`member-${contact.id}`} checked={selectedMembers.includes(contact.id)} onChange={() => handleToggleMember(contact.id)} className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent" />
                            <label htmlFor={`member-${contact.id}`} className="ml-3 block text-sm cursor-pointer">{contact.name}</label>
                        </div>
                    )) : <p className="text-sm text-gray-500 p-2">Add contacts first to create a group.</p>}
                </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button type="button" onClick={handleClose} className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-600">Cancel</button>
              <button type="submit" disabled={!name.trim() || selectedMembers.length === 0} className="px-6 py-2 rounded-lg bg-accent text-white font-semibold disabled:bg-gray-400">{buttonText}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};