export type AuthUser = {
  id: string;
  email: string;
  fullName: string | null;
};

export type Session = {
  user: AuthUser;
};
