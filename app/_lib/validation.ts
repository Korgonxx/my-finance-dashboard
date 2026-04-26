import { z } from "zod";

// Entry schemas
export const entrySchema = z.object({
  id: z.string().optional(),
  mode: z.enum(["banks", "crypto", "web2", "web3"]).default("banks"),
  date: z.string(),
  project: z.string(),
  // Banks fields
  earned: z.number().optional(),
  saved: z.number().optional(),
  given: z.number().optional(),
  givenTo: z.string().optional(),
  // Crypto fields
  walletAddress: z.string().optional(),
  walletName: z.string().optional(),
  network: z.string().optional(),
  investmentAmount: z.number().optional(),
  currentValue: z.number().optional(),
  roi: z.number().optional(),
  // Optional client-side fields (ignored by API)
  walletId: z.string().optional(),
  createdAt: z.string().optional(),
});

export const entryUpdateSchema = entrySchema.partial().extend({
  id: z.string().optional(),
});

// Card schemas
export const cardSchema = z.object({
  name: z.string().min(1, "Name is required"),
  last4: z.string().optional(),
  holder: z.string().optional(),
  expiry: z.string().optional(),
  type: z.enum(["physical", "virtual"]),
  balance: z.number().optional().default(0),
});

export const cardUpdateSchema = z.object({
  name: z.string().optional(),
  balance: z.number().optional(),
});

// Wallet schemas
export const walletSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  network: z.string().optional().default("Ethereum"),
  balance: z.number().optional().default(0),
  isEncrypted: z.boolean().optional().default(false),
  encryptedData: z.string().optional().nullable(),
});

export const walletUpdateSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  network: z.string().optional(),
  balance: z.number().optional(),
  isEncrypted: z.boolean().optional(),
  encryptedData: z.string().optional().nullable(),
  action: z.string().optional(),
});

// Category schema
export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  icon: z.string().optional().default("📁"),
  color: z.string().optional().default("#22c55e"),
  imageUrl: z.string().optional().nullable(),
});

// Goal schema — accepts both frontend modes ("banks"/"crypto") and legacy ("web2"/"web3")
export const goalSchema = z.object({
  mode: z.enum(["banks", "crypto", "web2", "web3"]).default("banks"),
  amount: z.number().min(0, "Amount must be positive"),
  currency: z.string().optional().default("USD"),
});

// Settings schema
export const settingsSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().optional(),
  theme: z.string().optional(),
  banksGoal: z.number().optional(),
  cryptoGoal: z.number().optional(),
});