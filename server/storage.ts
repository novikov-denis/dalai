import { type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  get(key: string): any;
  set(key: string, value: any): void;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private data: Map<string, any>;

  constructor() {
    this.users = new Map();
    this.data = new Map();
  }

  get(key: string): any {
    return this.data.get(key);
  }

  set(key: string, value: any): void {
    this.data.set(key, value);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
