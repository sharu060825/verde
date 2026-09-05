export type DashboardStat = {
  title: string;
  value: string;
  icon: 'wallet' | 'trending-up' | 'trending-down' | 'piggy-bank';
  trend: 'up' | 'down';
  percentage: string;
};

export type Transaction = {
  id: number;
  name: string;
  amount: string;
  date: string;
  category: string;
  type: 'income' | 'expense';
};

export type Budget = {
  id: number;
  category: string;
  spent: number;
  total: number;
};

export type Expense = {
  id: number;
  name: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
};

export const dashboardStats: DashboardStat[] = [
  { title: 'Total Balance', value: '$24,580', icon: 'wallet', trend: 'up', percentage: '+12.4%' },
  { title: 'Monthly Income', value: '$8,240', icon: 'trending-up', trend: 'up', percentage: '+8.1%' },
  { title: 'Monthly Expense', value: '$3,980', icon: 'trending-down', trend: 'down', percentage: '-2.3%' },
  { title: 'Savings', value: '$4,260', icon: 'piggy-bank', trend: 'up', percentage: '+15.2%' },
];

export const transactions: Transaction[] = [
  { id: 1, name: 'Salary Deposit', amount: '+$4,200', date: 'Today, 09:30', category: 'Income', type: 'income' },
  { id: 2, name: 'Groceries', amount: '-$128', date: 'Today, 18:15', category: 'Food', type: 'expense' },
  { id: 3, name: 'Cloud Subscription', amount: '-$24', date: 'Yesterday', category: 'Software', type: 'expense' },
  { id: 4, name: 'Freelance Project', amount: '+$780', date: 'Yesterday', category: 'Income', type: 'income' },
  { id: 5, name: 'Gym Membership', amount: '-$46', date: 'Mon', category: 'Health', type: 'expense' },
];

export const budgets: Budget[] = [
  { id: 1, category: 'Housing', spent: 820, total: 1200 },
  { id: 2, category: 'Food', spent: 320, total: 500 },
  { id: 3, category: 'Travel', spent: 180, total: 350 },
];

export const expenses: Expense[] = [
  { id: 1, name: 'Lunch with Client', amount: 48, category: 'Dining', date: '2026-08-01', paymentMethod: 'Card' },
  { id: 2, name: 'Office Supplies', amount: 112, category: 'Work', date: '2026-07-31', paymentMethod: 'Cash' },
  { id: 3, name: 'Train Ticket', amount: 24, category: 'Travel', date: '2026-07-29', paymentMethod: 'Card' },
  { id: 4, name: 'Groceries', amount: 76, category: 'Food', date: '2026-07-28', paymentMethod: 'Card' },
  { id: 5, name: 'Streaming Plan', amount: 15, category: 'Lifestyle', date: '2026-07-26', paymentMethod: 'Online' },
];
