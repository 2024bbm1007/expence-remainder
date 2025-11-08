import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { EXPENSE_CATEGORIES } from '../constants';

export const Dashboard: React.FC = () => {
    const { transactions, contacts, groups, getContactName, calculateBalance, calculateGroupBalances } = useAppContext();

    const stats = useMemo(() => {
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyTransactions = transactions.filter(t => new Date(t.date) >= currentMonthStart && t.splitBetween.includes('you'));
        
        const totalMonthlySpending = monthlyTransactions.reduce((acc, t) => {
            if (t.customSplits) {
                return acc + (t.customSplits['you'] || 0);
            }
            return acc + (t.amount / t.splitBetween.length);
        }, 0);

        const spendingByCategory = monthlyTransactions.reduce((acc, t) => {
            const category = t.category || 'General';
            const yourShare = t.customSplits ? (t.customSplits['you'] || 0) : (t.amount / t.splitBetween.length);
            acc[category] = (acc[category] || 0) + yourShare;
            return acc;
        }, {} as { [key: string]: number });

        const maxCategorySpending = Math.max(...Object.values(spendingByCategory), 0);

        const contactBalances = contacts
            .map(c => ({ id: c.id, name: c.name, balance: calculateBalance(c.id) }))
            .filter(c => c.balance !== 0)
            .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

        const groupSummaries = groups.map(g => {
            const simplifiedDebts = calculateGroupBalances(g.id);
            let youAreOwed = 0;
            let youOwe = 0;
            simplifiedDebts.forEach(debt => {
                if (debt.to === 'you') youAreOwed += debt.amount;
                if (debt.from === 'you') youOwe += debt.amount;
            });
            return { id: g.id, name: g.name, balance: youAreOwed - youOwe };
        })
        .filter(g => g.balance !== 0)
        .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

        return { totalMonthlySpending, spendingByCategory, maxCategorySpending, contactBalances, groupSummaries };
    }, [transactions, contacts, groups, calculateBalance, calculateGroupBalances]);

    const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <h3 className="text-sm text-gray-500 dark:text-gray-400">{title}</h3>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
        </div>
    );
    
    const BalanceList: React.FC<{title: string, data: {name: string, balance: number}[]}> = ({title, data}) => (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">{title}</h3>
            {data.length > 0 ? (
                <ul className="space-y-2">
                    {data.slice(0, 5).map((item, i) => (
                        <li key={i} className="flex justify-between items-center text-sm">
                            <span>{item.name}</span>
                            <span className={`font-bold ${item.balance > 0 ? 'text-positive' : 'text-negative'}`}>
                                {item.balance > 0 ? `+₹${item.balance.toFixed(2)}` : `-₹${(-item.balance).toFixed(2)}`}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-sm text-gray-500 dark:text-gray-400">Nothing to show here.</p>}
        </div>
    );

    return (
        <div className="p-4 md:p-6 h-full overflow-y-auto space-y-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="This Month's Spending" value={`₹${stats.totalMonthlySpending.toFixed(2)}`} />
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Spending by Category</h3>
                <div className="space-y-3">
                    {EXPENSE_CATEGORIES.map(category => {
                        const amount = stats.spendingByCategory[category] || 0;
                        if (amount === 0) return null;
                        const widthPercentage = stats.maxCategorySpending > 0 ? (amount / stats.maxCategorySpending) * 100 : 0;
                        return (
                            <div key={category} className="flex items-center text-sm">
                                <span className="w-1/4 truncate pr-2">{category}</span>
                                <div className="w-3/4 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                                    <div className="bg-accent h-4 rounded-full" style={{ width: `${widthPercentage}%` }}></div>
                                </div>
                                <span className="w-1/4 text-right pl-2 font-semibold">₹{amount.toFixed(2)}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BalanceList title="Top Friend Balances" data={stats.contactBalances} />
                <BalanceList title="Top Group Balances" data={stats.groupSummaries} />
            </div>
        </div>
    );
};