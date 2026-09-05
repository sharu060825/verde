import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

export interface ExpenseItemData {
  id: string | number;
  name: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
  currency?: string;
}

export function ExpenseTable({
  expenses,
  currency = 'INR',
}: {
  expenses: ExpenseItemData[];
  currency?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e6ebe8] bg-white shadow-xs">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-[#e6ebe8] bg-[#f8faf9]">
            <TableHead className="text-[10px] font-bold uppercase text-[#4b554f]">Name</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-[#4b554f]">Amount</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-[#4b554f]">Category</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-[#4b554f]">Date</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-[#4b554f]">Payment Method</TableHead>
            <TableHead className="text-right text-[10px] font-bold uppercase text-[#4b554f]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id} className="border-b border-[#e6ebe8] hover:bg-[#f8faf9] transition">
              <TableCell className="font-semibold text-[#0a0d0b]">{expense.name}</TableCell>
              <TableCell className="font-bold text-[#0a0d0b] num-tabular">{formatCurrency(expense.amount, currency)}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] text-[10px]">
                  {expense.category}
                </Badge>
              </TableCell>
              <TableCell className="text-[#838e87]">
                {new Date(expense.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </TableCell>
              <TableCell className="text-[#4b554f]">{expense.paymentMethod}</TableCell>
              <TableCell className="text-right">
                <button className="rounded-full p-2 text-[#838e87] hover:bg-[#f8faf9] hover:text-[#0a0d0b]">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
