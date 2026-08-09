export type Expense = {
  id: string;
  user_id: string;
  amount: number;
  category_id: string | null;
  note: string | null;
  date: string;
  created_at: string;
};
