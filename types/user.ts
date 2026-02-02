export interface UserData {
  id: string;
  name: string;
  email: string;
  uid: string;
  subscriptionActive: boolean;
  avatarInitials?: string;
  language: string;
  theme: 'light' | 'dark';
}

export interface HeaderProps {
  userData?: Partial<UserData>;
}