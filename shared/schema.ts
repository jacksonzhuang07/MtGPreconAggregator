import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Card information from CSV
export const cards = pgTable("cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  setCode: text("set_code"),
  setName: text("set_name"),
  scryfallId: text("scryfall_id"),
  manaCost: text("mana_cost"),
  cmc: real("cmc"),
  type: text("type"),
  rarity: text("rarity"),
  priceUsd: real("price_usd"),
  priceUpdatedAt: text("price_updated_at"),
});

// Precon deck information
export const preconDecks = pgTable("precon_decks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  format: text("format").notNull(),
  commander: text("commander"),
  totalValue: real("total_value").default(0),
  cardCount: integer("card_count").default(0),
  uniqueCardCount: integer("unique_card_count").default(0),
  publicUrl: text("public_url"),
  description: text("description"),
});

// Many-to-many relationship between decks and cards
export const deckCards = pgTable("deck_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deckId: varchar("deck_id").notNull(),
  cardId: varchar("card_id").notNull(),
  quantity: integer("quantity").default(1),
  finish: text("finish").default("nonFoil"),
});

// Analysis progress tracking
export const analysisJobs = pgTable("analysis_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  totalCards: integer("total_cards").default(0),
  processedCards: integer("processed_cards").default(0),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  errorMessage: text("error_message"),
});

// Zod schemas
export const insertCardSchema = createInsertSchema(cards).omit({
  id: true,
  priceUpdatedAt: true,
});

export const insertPreconDeckSchema = createInsertSchema(preconDecks).omit({
  id: true,
  totalValue: true,
  cardCount: true,
  uniqueCardCount: true,
});

export const insertDeckCardSchema = createInsertSchema(deckCards).omit({
  id: true,
});

export const insertAnalysisJobSchema = createInsertSchema(analysisJobs).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

// TypeScript types
export type Card = typeof cards.$inferSelect;
export type PreconDeck = typeof preconDecks.$inferSelect;
export type DeckCard = typeof deckCards.$inferSelect;
export type AnalysisJob = typeof analysisJobs.$inferSelect;

export type InsertCard = z.infer<typeof insertCardSchema>;
export type InsertPreconDeck = z.infer<typeof insertPreconDeckSchema>;
export type InsertDeckCard = z.infer<typeof insertDeckCardSchema>;
export type InsertAnalysisJob = z.infer<typeof insertAnalysisJobSchema>;

// Custom types for API responses
export type PreconDeckWithDetails = PreconDeck & {
  cards: (DeckCard & { card: Card })[];
};

export type DeckRanking = {
  rank: number;
  deck: PreconDeck;
  cardCount: number;
  totalValue: number;
};

export type AnalysisProgress = {
  jobId: string;
  status: string;
  current: number;
  total: number;
  percentage: number;
  message: string;
};

export type AnalysisStats = {
  totalDecks: number;
  uniqueCards: number;
  avgPrice: number;
  highestValue: number;
  lowestValue: number;
};
