
import React, { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { ContactList } from './components/ContactList';
import { ContactDetail } from './components/ContactDetail';
import { ContactModal } from './components/ContactModal';
import { TransactionModal } from './components/TransactionModal';
import { PlusIcon } from './components/icons/PlusIcon';
import { UsersIcon } from './components/icons/UsersIcon';
import { ArrowLeftIcon } from './components/icons/ArrowLeftIcon';

type View = 'list' | 'detail';

const AppHeader: React.FC<{
  view: View;
  onBack: () => void;
  contactName?: string;
  onAddContact: () => void;
}> = ({ view, onBack, contactName, onAddContact }) => (
  <header className="bg-primary text-white shadow-md sticky top-0 z-10">
    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
      {view === 'detail' ? (
        <button onClick={onBack} className="p-2 -ml-2">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
      ) : (
        <h1 className="text-xl font-bold">SplitEase</h1>
      )}
      {view === 'list' && (
        <button onClick={onAddContact} className="p-2 -mr-2">
          <UsersIcon className="w-6 h-6" />
        </button>
      )}
    </div>
  </header>
);

const AppContent: React.FC = () => {
  const [view, setView] = useState<View>('list');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const { getContactName } = useAppContext();

  const handleSelectContact = (contactId: string) => {
    setSelectedContactId(contactId);
    setView('detail');
  };

  const handleBack = () => {
    setView('list');
    setSelectedContactId(null);
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
      <AppHeader 
        view={view} 
        onBack={handleBack} 
        contactName={selectedContactId ? getContactName(selectedContactId) : undefined}
        onAddContact={() => setIsContactModalOpen(true)}
      />
      <main className="container mx-auto max-w-2xl pb-24">
        {view === 'list' && <ContactList onSelectContact={handleSelectContact} />}
        {view === 'detail' && selectedContactId && <ContactDetail contactId={selectedContactId} />}
      </main>

      {view === 'list' && (
        <div className="fixed bottom-6 right-6 z-20">
            <button onClick={() => setIsTransactionModalOpen(true)} className="bg-accent hover:bg-secondary text-white rounded-full p-4 shadow-lg flex items-center justify-center transition-transform transform hover:scale-105">
                <PlusIcon className="w-8 h-8"/>
            </button>
        </div>
      )}

      {isContactModalOpen && <ContactModal onClose={() => setIsContactModalOpen(false)} />}
      {isTransactionModalOpen && <TransactionModal onClose={() => setIsTransactionModalOpen(false)} />}
    </div>
  );
};


const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
