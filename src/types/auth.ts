export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}