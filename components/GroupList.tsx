import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { Group } from '../types';
import { MoreVerticalIcon } from './icons/MoreVerticalIcon';

interface GroupListProps {
  onSelectGroup: (groupId: string) => void;
  onEditGroup: (group: Group) => void;
}

export const GroupList: React.FC<GroupListProps> = ({ onSelectGroup, onEditGroup }) => {
  const { groups, getContactName, calculateGroupBalances } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const getGroupBalanceSummary = (groupId: string) => {
    const simplifiedDebts = calculateGroupBalances(groupId);
    let youAreOwed = 0;
    let youOwe = 0;

    simplifiedDebts.forEach(debt => {
        if (debt.to === 'you') youAreOwed += debt.amount;
        if (debt.from === 'you') youOwe += debt.amount;
    });

    if (youAreOwed > youOwe) return { status: 'positive', text: `You are owed ₹${(youAreOwed - youOwe).toFixed(2)}` };
    if (youOwe > youAreOwed) return { status: 'negative', text: `You owe ₹${(youOwe - youAreOwed).toFixed(2)}` };
    return { status: 'neutral', text: 'All settled up' };
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const GroupItem = ({ group }: { group: Group }) => {
    const balanceSummary = getGroupBalanceSummary(group.id);
    return (
      <li
        onClick={() => onSelectGroup(group.id)}
        className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200"
      >
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-4">
            <UserGroupIcon className="w-6 h-6 text-green-600 dark:text-green-300" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200">{group.name}</p>
            <p className={`text-sm ${balanceSummary.status === 'positive' ? 'text-positive' : balanceSummary.status === 'negative' ? 'text-negative' : 'text-gray-500'}`}>
                {balanceSummary.text}
            </p>
          </div>
        </div>
        <div className="relative">
            <button 
                onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === group.id ? null : group.id); }} 
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
                <MoreVerticalIcon className="w-5 h-5"/>
            </button>
             {activeMenu === group.id && (
                <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-gray-700 rounded-md shadow-lg z-20 border dark:border-gray-600">
                    <button onClick={(e) => { e.stopPropagation(); onEditGroup(group); setActiveMenu(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">Edit</button>
                </div>
            )}
        </div>
      </li>
    );
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto">
       <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search groups..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
      {filteredGroups.length > 0 ? (
        <ul className="space-y-3">
          {filteredGroups.map(group => <GroupItem key={group.id} group={group} />)}
        </ul>
      ) : (
        <div className="text-center py-16 px-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <UserGroupIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500" />
          <h3 className="mt-4 text-lg font-semibold">No Groups Found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try a different search term.' : 'Create a group to split expenses.'}
          </p>
        </div>
      )}
    </div>
  );
};