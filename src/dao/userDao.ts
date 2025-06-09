import { v4 as uuidv4 } from 'uuid';
import { User, UserRegistration } from '../models/User';
import { AuthUtils } from '../utils/auth';

// In-memory user storage (in production, this would be a database)
const users: User[] = [];

export class UserDao {
  /**
   * Create a new user
   */
  static async createUser(userData: UserRegistration): Promise<User> {
    // Check if user already exists
    const existingUser = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await AuthUtils.hashPassword(userData.password);

    // Create new user
    const newUser: User = {
      id: uuidv4(),
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      isEmailVerified: false,
      preferences: {
        notifications: true,
        shareInsights: false,
        publicProfile: false,
      },
      subscription: {
        plan: 'free',
        status: 'active',
      },
      stats: {
        totalDreams: 0,
        streakDays: 0,
        joinedAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to storage
    users.push(newUser);
    
    return newUser;
  }

  /**
   * Find user by email
   */
  static async findUserByEmail(email: string): Promise<User | null> {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return user || null;
  }

  /**
   * Find user by ID
   */
  static async findUserById(id: string): Promise<User | null> {
    const user = users.find(u => u.id === id);
    return user || null;
  }

  /**
   * Update user's last login
   */
  static async updateLastLogin(userId: string): Promise<void> {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].stats.lastLoginAt = new Date();
      users[userIndex].updatedAt = new Date();
    }
  }

  /**
   * Update user profile
   */
  static async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return null;
    }

    // Merge updates
    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date(),
    };

    return users[userIndex];
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string): Promise<boolean> {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return false;
    }

    users.splice(userIndex, 1);
    return true;
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  /**
   * Verify user's email
   */
  static async verifyEmail(userId: string): Promise<boolean> {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return false;
    }

    users[userIndex].isEmailVerified = true;
    users[userIndex].updatedAt = new Date();
    return true;
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, newPassword: string): Promise<boolean> {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return false;
    }

    const hashedPassword = await AuthUtils.hashPassword(newPassword);
    users[userIndex].password = hashedPassword;
    users[userIndex].updatedAt = new Date();
    return true;
  }

  /**
   * Get user statistics
   */
  static async getUserStats(): Promise<{
    totalUsers: number;
    verifiedUsers: number;
    activeUsers: number;
    newUsersToday: number;
  }> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return {
      totalUsers: users.length,
      verifiedUsers: users.filter(u => u.isEmailVerified).length,
      activeUsers: users.filter(u => u.stats.lastLoginAt && 
        new Date(u.stats.lastLoginAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length,
      newUsersToday: users.filter(u => new Date(u.createdAt) >= today).length,
    };
  }
} 