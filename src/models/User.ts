export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  profilePicture?: string;
  dateOfBirth?: Date;
  timezone?: string;
  dreamGoals?: string[];
  preferences: {
    notifications: boolean;
    shareInsights: boolean;
    publicProfile: boolean;
  };
  subscription: {
    plan: 'free' | 'premium' | 'pro';
    status: 'active' | 'inactive' | 'cancelled';
    expiresAt?: Date;
  };
  stats: {
    totalDreams: number;
    streakDays: number;
    joinedAt: Date;
    lastLoginAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRegistration {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UserLogin {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
} 