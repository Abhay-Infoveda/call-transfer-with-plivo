export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
} 