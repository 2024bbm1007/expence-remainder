import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { ContactList } from './components/ContactList';
import { ContactDetail } from './components/ContactDetail';
import { GroupList } from './components/GroupList';
import { GroupDetail } from './components/GroupDetail';
import { ContactModal } from './components/ContactModal';
import { GroupModal } from './components/GroupModal';
import { TransactionModal } from './components/TransactionModal';
import { Dashboard } from './components/Dashboard';
import { PlusIcon } from './components/icons/PlusIcon';
import { UsersIcon } from './components/icons/UsersIcon';
import { UserGroupIcon } from './components/icons/UserGroupIcon';
import { ChartBarIcon } from './components/icons/ChartBarIcon';
import { Group, Transaction } from './types';

type View = 'contacts' | 'groups' | 'dashboard';
type Modal = 'contact' | 'group' | 'transaction' | null;

function AppContent() {
  const [currentView, setCurrentView] = useState<View>('contacts');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<Modal>(null);

  const [transactionContext, setTransactionContext] = useState<{ contactId?: string, groupId?: string }>({});
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [groupToEdit, setGroupToEdit] = useState<Group | null>(null);

  const [animationClass, setAnimationClass] = useState('animate-slide-in-right');

  const handleSetView = (view: View) => {
    setAnimationClass('animate-fade-out');
    setTimeout(() => {
      clearSelection();
      setCurrentView(view);
      setAnimationClass('animate-fade-in');
    }, 150);
  };

  const handleSelectContact = (id: string) => {
    setAnimationClass('animate-slide-in-right');
    setSelectedContactId(id);
  }
  
  const handleSelectGroup = (id: string) => {
    setAnimationClass('animate-slide-in-right');
    setSelectedGroupId(id);
  }

  const handleOpenTransactionModal = (context: { contactId?: string, groupId?: string }, transaction?: Transaction) => {
    setTransactionContext(context);
    setTransactionToEdit(transaction || null);
    setActiveModal('transaction');
  };

  const handleOpenGroupModal = (group?: Group) => {
    setGroupToEdit(group || null);
    setActiveModal('group');
  }

  const clearSelection = () => {
    setAnimationClass('animate-slide-in-left');
    setSelectedContactId(null);
    setSelectedGroupId(null);
  };
  
  const isDetailView = selectedContactId || selectedGroupId;

  const renderMainContent = () => {
    if (currentView === 'dashboard') return <Dashboard />;
    if (currentView === 'contacts') return <ContactList onSelectContact={handleSelectContact} />;
    if (currentView === 'groups') return <GroupList onSelectGroup={handleSelectGroup} onEditGroup={handleOpenGroupModal} />;
    return null;
  };

  return (
    <div className="h-screen w-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col font-sans overflow-hidden">
      <main className="flex-1 relative">
        <div key={currentView} className={`absolute inset-0 transition-transform duration-300 ease-in-out ${animationClass} ${isDetailView ? '-translate-x-full' : 'translate-x-0'}`}>
          {renderMainContent()}
        </div>
        
        {isDetailView && (
          <div className={`absolute inset-0 transition-transform duration-300 ease-in-out ${animationClass} ${isDetailView ? 'translate-x-0' : 'translate-x-full'}`}>
            {selectedContactId && <ContactDetail contactId={selectedContactId} onBack={clearSelection} onAddTransaction={() => handleOpenTransactionModal({ contactId: selectedContactId })} onEditTransaction={(t) => handleOpenTransactionModal({ contactId: selectedContactId }, t)} />}
            {selectedGroupId && <GroupDetail groupId={selectedGroupId} onBack={clearSelection} onAddTransaction={() => handleOpenTransactionModal({ groupId: selectedGroupId })} onEditTransaction={(t) => handleOpenTransactionModal({ groupId: selectedGroupId }, t)} />}
          </div>
        )}
      </main>

      {!isDetailView && (
        <div className="absolute bottom-20 right-6 z-20 flex flex-col space-y-3">
          {currentView === 'contacts' && <button onClick={() => setActiveModal('contact')} className="bg-accent hover:bg-secondary text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110"><PlusIcon className="w-6 h-6" /></button>}
          {currentView === 'groups' && <button onClick={() => handleOpenGroupModal()} className="bg-accent hover:bg-secondary text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110"><PlusIcon className="w-6 h-6" /></button>}
        </div>
      )}

      <nav className="flex justify-around p-2 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
        <button onClick={() => handleSetView('contacts')} className={`flex flex-col items-center w-full py-1 rounded-md transition-colors ${currentView === 'contacts' ? 'text-accent' : 'text-gray-500'}`}>
          <UsersIcon className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Friends</span>
        </button>
        <button onClick={() => handleSetView('groups')} className={`flex flex-col items-center w-full py-1 rounded-md transition-colors ${currentView === 'groups' ? 'text-accent' : 'text-gray-500'}`}>
          <UserGroupIcon className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Groups</span>
        </button>
         <button onClick={() => handleSetView('dashboard')} className={`flex flex-col items-center w-full py-1 rounded-md transition-colors ${currentView === 'dashboard' ? 'text-accent' : 'text-gray-500'}`}>
          <ChartBarIcon className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Dashboard</span>
        </button>
      </nav>

      {activeModal === 'contact' && <ContactModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'group' && <GroupModal onClose={() => setActiveModal(null)} groupToEdit={groupToEdit} />}
      {activeModal === 'transaction' && <TransactionModal onClose={() => setActiveModal(null)} {...transactionContext} transactionToEdit={transactionToEdit} />}
      
      <style>{`
        @keyframes slide-in-right { 0% { transform: translateX(100%); } 100% { transform: translateX(0); } }
        @keyframes slide-in-left { 0% { transform: translateX(-100%); } 100% { transform: translateX(0); } }
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes fade-out { 0% { opacity: 1; } 100% { opacity: 0; } }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-in-out; }
        .animate-slide-in-left { animation: slide-in-left 0.3s ease-in-out; }
        .animate-fade-in { animation: fade-in 0.15s ease-in-out; }
        .animate-fade-out { animation: fade-out 0.15s ease-in-out; }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}