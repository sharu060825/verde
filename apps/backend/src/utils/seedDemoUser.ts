import { prisma } from '../prisma/client.js';
import { hashPassword } from './password.js';
import { DEFAULT_CATEGORIES } from './defaultCategories.js';

export async function ensureDemoUserExists() {
  const email = 'demo@expensetracker.ai';
  const hashedPassword = await hashPassword('Password123!');
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
    return existing;
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const user = await prisma.user.create({
    data: {
      name: 'Alex Morgan',
      email,
      password: hashedPassword,
      currency: 'INR',
      theme: 'dark',
      notifications: true,
      categories: {
        create: DEFAULT_CATEGORIES.map((cat) => ({
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          color: cat.color,
        })),
      },
      budgets: {
        create: [
          { category: 'Groceries', limit: 8000, period: 'MONTHLY' },
          { category: 'Food & Dining', limit: 5000, period: 'MONTHLY' },
          { category: 'Utilities', limit: 4000, period: 'MONTHLY' },
          { category: 'Transportation', limit: 3000, period: 'MONTHLY' },
          { category: 'Shopping', limit: 5000, period: 'MONTHLY' },
        ],
      },
      transactions: {
        create: [
          {
            title: 'Monthly Tech Salary',
            amount: 75000,
            type: 'INCOME',
            category: 'Salary',
            paymentMethod: 'Bank Transfer',
            notes: 'Primary monthly compensation',
            date: new Date(year, month, 1),
          },
          {
            title: 'Freelance UI/UX Consulting',
            amount: 15000,
            type: 'INCOME',
            category: 'Freelance',
            paymentMethod: 'UPI',
            notes: 'Mobile app design sprint',
            date: new Date(year, month, 12),
          },
          {
            title: 'Apartment Monthly Rent',
            amount: 18000,
            type: 'EXPENSE',
            category: 'Housing & Rent',
            paymentMethod: 'Net Banking',
            notes: 'Monthly flat rent',
            date: new Date(year, month, 3),
          },
          {
            title: 'Supermarket Organic Groceries',
            amount: 5200,
            type: 'EXPENSE',
            category: 'Groceries',
            paymentMethod: 'Credit Card',
            notes: 'Weekly household supplies',
            date: new Date(year, month, 5),
          },
          {
            title: 'Weekend Dinner with Friends',
            amount: 2800,
            type: 'EXPENSE',
            category: 'Food & Dining',
            paymentMethod: 'UPI',
            notes: 'Italian restaurant dinner',
            date: new Date(year, month, 8),
          },
          {
            title: 'Electricity & Broadband Bill',
            amount: 3100,
            type: 'EXPENSE',
            category: 'Utilities',
            paymentMethod: 'UPI',
            notes: 'Fiber internet and BESCOM electricity',
            date: new Date(year, month, 10),
          },
          {
            title: 'City Metro & Uber Rides',
            amount: 1850,
            type: 'EXPENSE',
            category: 'Transportation',
            paymentMethod: 'UPI',
            notes: 'Work commutes and cab rides',
            date: new Date(year, month, 14),
          },
          {
            title: 'Online Shopping & Books',
            amount: 3400,
            type: 'EXPENSE',
            category: 'Shopping',
            paymentMethod: 'Credit Card',
            notes: 'Tech books and desk accessories',
            date: new Date(year, month, 18),
          },
        ],
      },
    },
  });

  return user;
}
