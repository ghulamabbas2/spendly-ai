export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

export type TabParamList = {
  Home: undefined;
  Chat: undefined;
  Insights: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  Tabs: undefined;
  AddExpense: undefined;
  ExpenseDetail: { expenseId: string };
  Categories: undefined;
};
