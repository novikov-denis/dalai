import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Analysis history table
export const analysisHistory = pgTable("analysis_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  originalText: text("original_text").notNull(),
  suggestions: jsonb("suggestions").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  title: text("title"),
  acceptedCount: integer("accepted_count").default(0),
});

// Suggestion type
export const suggestionSchema = z.object({
  id: z.string(),
  original: z.string(),
  replacement: z.string(),
  reason: z.string(),
  type: z.enum(["style", "tone", "grammar", "clarity", "policy"]),
  status: z.enum(["pending", "accepted", "rejected"]),
  start_index: z.number().optional(),
});

export type Suggestion = z.infer<typeof suggestionSchema>;

// API request/response schemas
export const analyzeRequestSchema = z.object({
  text: z.string().min(10, "Текст слишком короткий").max(50000, "Текст слишком длинный"),
  customPrompt: z.string().max(2000, "Промпт слишком длинный").optional(),
  toneSettings: z.object({
    formality: z.enum(["informal", "moderate", "formal"]).optional(),
    empathy: z.enum(["low", "medium", "high"]).optional(),
    strictness: z.enum(["lenient", "moderate", "strict"]).optional(),
  }).optional(),
});

export const analyzeResponseSchema = z.object({
  suggestions: z.array(suggestionSchema),
  overall_analysis: z.string().optional(),
  illustrations: z.array(z.object({
    id: z.string(),
    location: z.string(),
    description: z.string(),
    tz: z.string(),
  })).optional(),
});

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Некорректный email").max(255),
  password: z.string().min(6, "Пароль минимум 6 символов").max(128),
});

export const registerSchema = z.object({
  email: z.string().email("Некорректный email").max(255),
  name: z.string().min(1, "Имя обязательно").max(100),
  password: z.string().min(6, "Пароль минимум 6 символов").max(128),
});

// Refine schemas
export const refineSelectionSchema = z.object({
  selectedText: z.string().min(1).max(10000),
  userPrompt: z.string().min(1).max(1000),
});

export const refineSchema = z.object({
  original: z.string().min(1).max(10000),
  replacement: z.string().min(1).max(10000),
  reason: z.string().max(1000).optional(),
  userPrompt: z.string().min(1).max(1000),
});

// Image alt text schemas
export const generateAltSchema = z.object({
  imageUrl: z.string().url("Некорректный URL изображения").max(2000),
});

export const generateAltFromPromptSchema = z.object({
  imageUrl: z.string().url("Некорректный URL изображения").max(2000),
  userPrompt: z.string().max(1000).optional(),
  currentCaption: z.string().max(500).optional(),
});

// History schemas
export const historyItemSchema = z.object({
  originalText: z.string().max(100000),
  suggestions: z.array(suggestionSchema),
  title: z.string().max(200).optional(),
  email: z.string().email(),
});

export const updateHistorySchema = z.object({
  email: z.string().email(),
  suggestions: z.array(suggestionSchema).optional(),
  acceptedCount: z.number().int().min(0).optional(),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
