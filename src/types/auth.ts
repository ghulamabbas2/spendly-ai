export type AuthUser = {
  id: string;
  email: string;
};

export type Session = {
  user: AuthUser;
};
