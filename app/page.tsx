"use client";
import { useExchangeRates } from "./lib/useExchangeRates";

import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, CartesianGrid
} from "recharts";
import {
  Bell, Home, Search, LayoutGrid, PieChart, Wallet, CreditCard,
  ArrowUpRight, ArrowDownRight, Plus, Monitor, Edit2, Trash2, X, User,
  MoreHorizontal, Briefcase, Zap, Shield, HelpCircle, Settings, ChevronRight, Calendar,
  Sun, Moon, Camera, Mail, Smartphone, Key, MapPin, Globe, CheckCircle2, Lock, Menu,
  TrendingUp, TrendingDown, RefreshCw, Snowflake, Eye, EyeOff, ExternalLink, Activity, ArrowRightLeft, Download
} from "lucide-react";
import Image from "next/image";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Mode = "banks" | "crypto";

type Entry = {
  id: string;
  date: string;
  project: string;
  earned: number;
  saved: number;
  given: number;
  givenTo: string;
  mode: Mode;
  walletId?: string;
};

import { useAppSettings } from './context/AppSettingsContext';
// Korgon Brand Colors
const BRAND = "#D4FE44";
const SURFACE = "#131316";
const BORDER = "#222226";

const COLORS = [BRAND, "#3B82F6", "#A855F7", "#F97316"];

// Entries are fetched from API

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// --- Entry Modal Component with real form fields ---
function EntryModal({ onClose, onSave, mode, bankCards, wallets }: { 
  onClose: () => void; 
  onSave: (entry: Omit<Entry, 'id'>) => void;
  mode: Mode;
  bankCards: Array<{ id: string; name: string; last4: string }>;
  wallets: Array<{ id: string; name: string; address: string }>;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const { rates, convert, formatCurrency } = useExchangeRates();
  const [project, setProject] = useState("");
  const [earned, setEarned] = useState("");
  const [saved, setSaved] = useState("");
  const [given, setGiven] = useState("");
  const [givenTo, setGivenTo] = useState("");
  const [walletId, setWalletId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const items = mode === 'banks' 
    ? bankCards.map(c => ({ id: c.id, label: `${c.name} (**** ${c.last4})` }))
    : wallets.map(w => ({ id: w.id, label: `${w.name} (${w.address.slice(0,6)}...${w.address.slice(-4)})` }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSave({
        date,
        project,
        earned: parseFloat(earned) || 0,
        saved: parseFloat(saved) || 0,
        given: parseFloat(given) || 0,
        givenTo,
        mode,
        walletId: walletId || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#131316] border border-[#222226] max-w-md w-full rounded-3xl p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-400 dark:text-zinc-400 hover:text-zinc-50 hover:bg-white/10 transition-colors">
          <X size={18} />
        </button>
        <h2 className="text-2xl font-semibold mb-2 text-zinc-50">New Transaction</h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-400 mb-8">Record your incoming and outgoing finances.</p>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Category</label>
              <input
                type="text"
                value={givenTo}
                onChange={(e) => setGivenTo(e.target.value)}
                placeholder="e.g. Freelance, DeFi"
                className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Project / Description</label>
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="e.g. Client project, ETH staking"
              className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors"
            />
          </div>
          {items.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">{mode === 'banks' ? 'Card' : 'Wallet'}</label>
            <select value={walletId} onChange={e => setWalletId(e.target.value)} className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors">
              <option value="">Select {mode === 'banks' ? 'card' : 'wallet'}...</option>
              {items.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Earned</label>
              <input
                type="number"
                value={earned}
                onChange={(e) => setEarned(e.target.value)}
                placeholder="0"
                className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Saved</label>
              <input
                type="number"
                value={saved}
                onChange={(e) => setSaved(e.target.value)}
                placeholder="0"
                className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Given</label>
              <input
                type="number"
                value={given}
                onChange={(e) => setGiven(e.target.value)}
                placeholder="0"
                className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 transition-colors text-zinc-600 dark:text-zinc-300 rounded-2xl font-medium">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !project}
              className={cn(
                "flex-[2] py-3.5 rounded-2xl font-semibold transition-colors shadow-[0_0_20px_rgba(212,254,68,0.2)] flex items-center justify-center gap-2",
                submitting || !project
                  ? "bg-[#D4FE44]/70 text-[#0A0A0A]/70 cursor-not-allowed"
                  : "bg-[#D4FE44] text-[#0A0A0A] hover:bg-[#bceb29]"
              )}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0A0A0A]/50 border-t-[#0A0A0A] rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : "Add Transaction"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Edit Modal Component ---
function EditModal({ entry, onClose, onSave, mode, bankCards, wallets }: {
  entry: Entry;
  onClose: () => void;
  onSave: (entry: Entry) => void;
  mode: Mode;
  bankCards: Array<{ id: string; name: string; last4: string }>;
  wallets: Array<{ id: string; name: string; address: string }>;
}) {
  const [date, setDate] = useState(entry.date);
  const [project, setProject] = useState(entry.project);
  const [earned, setEarned] = useState(String(entry.earned));
  const [saved, setSaved] = useState(String(entry.saved));
  const [given, setGiven] = useState(String(entry.given));
  const [givenTo, setGivenTo] = useState(entry.givenTo);
  const [walletId, setWalletId] = useState(entry.walletId || "");
  const [submitting, setSubmitting] = useState(false);

  const items = mode === 'banks'
    ? bankCards.map(c => ({ id: c.id, label: `${c.name} (**** ${c.last4})` }))
    : wallets.map(w => ({ id: w.id, label: `${w.name} (${w.address.slice(0,6)}...${w.address.slice(-4)})` }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSave({
        ...entry,
        date,
        project,
        earned: parseFloat(earned) || 0,
        saved: parseFloat(saved) || 0,
        given: parseFloat(given) || 0,
        givenTo,
        mode,
        walletId: walletId || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#131316] border border-[#222226] max-w-md w-full rounded-3xl p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-50 hover:bg-white/10 transition-colors">
          <X size={18} />
        </button>
        <h2 className="text-2xl font-semibold mb-2 text-zinc-50">Edit Transaction</h2>
        <p className="text-sm text-zinc-400 mb-8">Update your transaction details.</p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Category</label>
              <input
                type="text"
                value={givenTo}
                onChange={(e) => setGivenTo(e.target.value)}
                placeholder="e.g. Freelance, DeFi"
                className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Project / Description</label>
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="e.g. Client project, ETH staking"
              className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors"
            />
          </div>
          {items.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">{mode === 'banks' ? 'Card' : 'Wallet'}</label>
            <select value={walletId} onChange={e => setWalletId(e.target.value)} className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors">
              <option value="">Select {mode === 'banks' ? 'card' : 'wallet'}...</option>
              {items.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Earned</label>
              <input
                type="number"
                value={earned}
                onChange={(e) => setEarned(e.target.value)}
                placeholder="0"
                className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Saved</label>
              <input
                type="number"
                value={saved}
                onChange={(e) => setSaved(e.target.value)}
                placeholder="0"
                className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Given</label>
              <input
                type="number"
                value={given}
                onChange={(e) => setGiven(e.target.value)}
                placeholder="0"
                className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 transition-colors text-zinc-300 rounded-2xl font-medium">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !project}
              className={cn(
                "flex-[2] py-3.5 rounded-2xl font-semibold transition-colors shadow-[0_0_20px_rgba(212,254,68,0.2)] flex items-center justify-center gap-2",
                submitting || !project
                  ? "bg-[#D4FE44]/70 text-[#0A0A0A]/70 cursor-not-allowed"
                  : "bg-[#D4FE44] text-[#0A0A0A] hover:bg-[#bceb29]"
              )}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0A0A0A]/50 border-t-[#0A0A0A] rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransferModal({ onClose, onTransfer }: { onClose: () => void, onTransfer: (amount: number, fromCard: string, toCard: string) => void }) {
  const [amount, setAmount] = useState("");
  const [fromCard, setFromCard] = useState("card1");
  const [toCard, setToCard] = useState("card2");
  const [isTransferring, setIsTransferring] = useState(false);

  const cards = [
    { id: "card1", name: "korgon Premium", last4: "4209" },
    { id: "card2", name: "Virtual Card", last4: "8831" },
  ];

  const handleTransfer = async () => {
    setIsTransferring(true);
    try {
      await onTransfer(Number(amount), fromCard, toCard);
    } finally {
      setIsTransferring(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#131316] border border-[#222226] max-w-md w-full rounded-3xl p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-400 dark:text-zinc-400 hover:text-zinc-50 hover:bg-white/10 transition-colors">
          <X size={18} />
        </button>
        <h2 className="text-2xl font-bold mb-2 text-zinc-50 border-b-2 border-[#D4FE44] inline-block pb-1">Transfer Funds</h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-400 mb-8 mt-2">Transfer between your bank cards.</p>
        
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">From Card</label>
            <select value={fromCard} onChange={e => setFromCard(e.target.value)} className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors">
              {cards.map(c => <option key={c.id} value={c.id}>{c.name} (**** {c.last4})</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">To Card</label>
            <select value={toCard} onChange={e => setToCard(e.target.value)} className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors">
              {cards.filter(c => c.id !== fromCard).map(c => <option key={c.id} value={c.id}>{c.name} (**** {c.last4})</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Amount</label>
            <div className="relative">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
               <input 
                 type="number" 
                 value={amount}
                 onChange={(e) => setAmount(e.target.value)}
                 placeholder="0.00" 
                 className="w-full bg-[#09090B] border border-[#222226] rounded-xl pl-8 pr-4 py-3 text-lg font-bold text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors" 
               />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 transition-colors text-zinc-300 rounded-2xl font-semibold">Cancel</button>
            <button 
              onClick={handleTransfer} 
              disabled={isTransferring || !amount || fromCard === toCard}
              className={cn("flex-[2] py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_5px_20px_rgba(212,254,68,0.15)]", 
                isTransferring || !amount || fromCard === toCard ? "bg-[#D4FE44]/70 text-[#0A0A0A]/70 cursor-not-allowed" : "bg-[#D4FE44] text-[#0A0A0A] hover:bg-[#bceb29] hover:-translate-y-0.5"
              )}
            >
              {isTransferring ? (
                 <>
                   <div className="w-4 h-4 border-2 border-[#0A0A0A]/50 border-t-[#0A0A0A] rounded-full animate-spin"></div>
                   Processing...
                 </>
              ) : "Transfer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransferToWeb2Modal({ onClose, onTransfer, bankCards, wallets }: { 
  onClose: () => void; 
  onTransfer: (amount: number, cardId: string, walletId: string) => void;
  bankCards: Array<{ id: string; name: string; last4: string; balance: number }>;
  wallets: Array<{ id: string; name: string; address: string; balance: number }>;
}) {
  const [amount, setAmount] = useState("");
  const [cardId, setCardId] = useState(bankCards[0]?.id || "");
  const [walletId, setWalletId] = useState(wallets[0]?.id || "");
  const [isTransferring, setIsTransferring] = useState(false);
  const { convert } = useExchangeRates();

  const handleTransfer = async () => {
    setIsTransferring(true);
    try {
      await onTransfer(Number(amount), cardId, walletId);
    } finally {
      setIsTransferring(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#131316] border border-[#222226] max-w-md w-full rounded-3xl p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-400 dark:text-zinc-400 hover:text-zinc-50 hover:bg-white/10 transition-colors">
          <X size={18} />
        </button>
        <h2 className="text-2xl font-bold mb-2 text-zinc-50 border-b-2 border-emerald-400 inline-block pb-1">Transfer to Bank</h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-400 mb-8 mt-2">Off-ramp crypto to your connected bank account.</p>
        
        <div className="space-y-5">
          {wallets.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">From Wallet</label>
            <select value={walletId} onChange={e => setWalletId(e.target.value)} className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none focus:border-emerald-400 transition-colors">
              {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({w.address.slice(0,6)}...${w.address.slice(-4)}) — ${w.balance.toFixed(2)}</option>)}
            </select>
          </div>
          )}
          {bankCards.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">To Card</label>
            <select value={cardId} onChange={e => setCardId(e.target.value)} className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none focus:border-emerald-400 transition-colors">
              {bankCards.map(c => <option key={c.id} value={c.id}>{c.name} (**** {c.last4}) — ₹{convert(c.balance, 'INR').toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</option>)}
            </select>
          </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Amount to Transfer (USD)</label>
            <div className="relative">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
               <input 
                 type="number" 
                 value={amount}
                 onChange={(e) => setAmount(e.target.value)}
                 placeholder="0.00" 
                 className="w-full bg-[#09090B] border border-[#222226] rounded-xl pl-8 pr-4 py-3 text-lg font-bold text-zinc-100 outline-none focus:border-emerald-400 transition-colors" 
               />
            </div>
            {amount && Number(amount) > 0 && (
              <p className="text-xs text-zinc-500 mt-1">≈ ₹{convert(Number(amount), 'INR').toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})} INR</p>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 transition-colors text-zinc-300 rounded-2xl font-semibold">Cancel</button>
            <button 
              onClick={handleTransfer} 
              disabled={isTransferring || !amount || Number(amount) <= 0 || !cardId || !walletId}
              className={cn("flex-[2] py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_5px_20px_rgba(52,211,153,0.15)]", 
                isTransferring || !amount || Number(amount) <= 0 || !cardId || !walletId ? "bg-emerald-400/70 text-[#0A0A0A]/70 cursor-not-allowed" : "bg-emerald-400 text-[#0A0A0A] hover:bg-emerald-300 hover:-translate-y-0.5"
              )}
            >
              {isTransferring ? (
                 <>
                   <div className="w-4 h-4 border-2 border-[#0A0A0A]/50 border-t-[#0A0A0A] rounded-full animate-spin"></div>
                   Processing...
                 </>
              ) : "Confirm Transfer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Custom Chart Tooltip ---
const CustomTooltip = ({ active, payload, label, selectedYear, currencySymbol, convertAmount }: any) => {
  if (active && payload && payload.length) {
    const sym = currencySymbol || '$';
    const fmt = convertAmount || ((v: number) => v.toLocaleString());
    return (
      <div className="bg-[#131316] border border-[#222226] p-4 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
        <p className="font-bold text-zinc-100 mb-2">{label} {selectedYear}</p>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#D4FE44]">
            Income: {sym}{fmt(payload[0]?.value || 0)}
          </p>
          <p className="text-sm font-semibold text-zinc-300">
            Expenses: {sym}{fmt(payload[1]?.value || 0)}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

// --- Main Dashboard component ---
export default function FinanceDashboard() {
  const { changeAppPasscode: changeContextPasscode } = useAppSettings();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [mode, setMode] = useState<Mode>("banks");
  const [filter, setFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showTransferToWeb2, setShowTransferToWeb2] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [web2Goal, setWeb2Goal] = useState({ amount: 10000, currency: "USD" });
  const [web3Goal, setWeb3Goal] = useState({ amount: 5, currency: "ETH" });
  const { convert } = useExchangeRates();
  const bankCurrency = web2Goal.currency || 'USD';
  const bankSymbol = bankCurrency === 'INR' ? '₹' : bankCurrency === 'EUR' ? '€' : bankCurrency === 'GBP' ? '£' : '$';
  const toBankDisplay = (usdAmount: number) => {
    if (bankCurrency === 'INR') return convert(usdAmount, 'INR').toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0});
    return usdAmount.toLocaleString();
  };
  
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appPasscode, setAppPasscode] = useState("123456"); // kept in memory for encryption
  const [passcodeHash, setPasscodeHash] = useState(""); // server hash for verification
  const [passcode, setPasscode] = useState("");
  const [wrongPasscode, setWrongPasscode] = useState(false);
  const [profilePic, setProfilePic] = useState<string>("https://picsum.photos/seed/avatar5/150/150");
  const [firstName, setFirstName] = useState("Korgon");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New login from Mac OS', time: '2 mins ago', read: false },
    { id: 2, title: 'Transfer of $200.00 clear', time: '1 hour ago', read: false },
    { id: 3, title: 'Your weekly report is ready', time: '1 day ago', read: true }
  ]);
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const [securityCurrentPass, setSecurityCurrentPass] = useState("");
  const [securityNewPass, setSecurityNewPass] = useState("");
  const [securityPassMessage, setSecurityPassMessage] = useState({ text: "", type: "" });
  
  // Wallet state
  type Wallet = { id: string; name: string; address: string; network: string; balance: number; createdAt: string; isEncrypted?: boolean; encryptedData?: any; };
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [walletForm, setWalletForm] = useState({ name: '', address: '', network: 'Ethereum', balance: '', encrypt: false });
  const [walletError, setWalletError] = useState('');
  const [encryptPasscode, setEncryptPasscode] = useState('');
  const [deletingWalletId, setDeletingWalletId] = useState<string | null>(null);
  const [decryptingWalletId, setDecryptingWalletId] = useState<string | null>(null);
  const [decryptPasscode, setDecryptPasscode] = useState('');
  
  // Fetch wallets from API
  async function fetchWallets() {
    try {
      const res = await fetch('/api/wallets');
      if (res.ok) { const data = await res.json(); setWallets(data); }
    } catch {}
    setLoadingWallets(false);
  }
  useEffect(() => { fetchWallets(); }, []);
  
  // Bank cards state
  type BankCard = { id: string; name: string; last4: string; holder: string; expiry: string; type: 'physical' | 'virtual'; balance: number };
  const [bankCards, setBankCards] = useState<BankCard[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardForm, setCardForm] = useState({ name: '', last4: '', expiry: '', type: 'virtual' as 'physical' | 'virtual' });
  const [cardError, setCardError] = useState('');
  // Fetch cards from API on mount
  async function fetchCards() {
    try {
      const res = await fetch('/api/cards');
      if (res.ok) {
        const data = await res.json();
        setBankCards(data);
      }
    } catch {}
  }
  useEffect(() => { fetchCards(); }, []);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Activity feed state
  type Activity = { id: string; type: string; action: string; amount: number; date: string; mode: string };
  const [activities, setActivities] = useState<Activity[]>([]);
  async function fetchActivity() {
    try {
      const res = await fetch('/api/activity');
      if (res.ok) setActivities(await res.json());
    } catch {}
  }
  useEffect(() => { fetchActivity(); }, []);

  async function deleteActivity(id: string, type: string) {
    try {
      await fetch(`/api/activity?id=${id}&type=${type}`, { method: 'DELETE' });
      setActivities(prev => prev.filter(a => a.id !== id));
    } catch {}
  }

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setProfilePic(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          avatarUrl: profilePic,
          theme,
          banksGoal: web2Goal.amount,
          cryptoGoal: web3Goal.amount,
        }),
      });
    } catch (err) {
      console.error('[saveSettings] failed:', err);
    }
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Date", "Project / Payee", "Category", "Amount Earned", "Amount Spent", "Savings"];
    const csvRows = [headers.join(",")];
    
    filteredEntries.forEach(entry => {
      const row = [
        entry.id,
        entry.date,
        `"${entry.project.replace(/"/g, '""')}"`,
        `"${entry.givenTo.replace(/"/g, '""')}"`,
        entry.earned,
        entry.given,
        entry.saved
      ];
      csvRows.push(row.join(","));
    });

    const csvData = csvRows.join("\n");
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `korgon_export_${mode}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };
  
  const filteredEntries = useMemo(() => {
    let res = entries.filter(e => e.mode === mode && new Date(e.date).getFullYear() === selectedYear);
    if (filter !== "All") res = res.filter(e => e.givenTo.toLowerCase() === filter.toLowerCase());
    if (selectedMonth) res = res.filter(e => MONTHS[new Date(e.date).getMonth()] === selectedMonth);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      res = res.filter(e => e.project.toLowerCase().includes(q) || e.givenTo.toLowerCase().includes(q));
    }
    return res.sort((a: any, b: any) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      // Same date → sort by createdAt (newest first)
      if (a.createdAt && b.createdAt) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });
  }, [entries, mode, filter, selectedMonth, selectedYear, searchQuery]);

  const categories = ["All", ...Array.from(new Set(entries.filter(e => e.mode === mode).map(e => e.givenTo.toLowerCase())))].map(c => c === "All" ? c : c.charAt(0).toUpperCase() + c.slice(1));

  const monthlyData = useMemo(() => {
    return MONTHS.map(month => {
      const me = entries.filter(e => e.mode === mode && MONTHS[new Date(e.date).getMonth()] === month && new Date(e.date).getFullYear() === selectedYear);
      return {
        month,
        earned: me.reduce((s, e) => s + e.earned, 0),
        saved: me.reduce((s, e) => s + e.saved, 0),
        given: me.reduce((s, e) => s + e.given, 0),
      };
    });
  }, [entries, mode]);

  // Verify passcode against server hash
  useEffect(() => {
    if (!isAuthenticated && passcode.length === 6 && passcodeHash) {
      setWrongPasscode(false);
      import('./utils/encryption').then(({ hashPasscode }) => {
        hashPasscode(passcode).then(hash => {
          if (hash === passcodeHash) {
            setIsAuthenticated(true);
            setAppPasscode(passcode); // keep entered passcode for encryption
            setPasscode("");
          } else {
            setWrongPasscode(true);
          }
        });
      });
    }
    if (passcode.length < 6) setWrongPasscode(false);
  }, [passcode, passcodeHash, isAuthenticated]);

  // Load all settings from API (cross-device sync)
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.firstName) setFirstName(data.firstName);
          if (data.lastName !== undefined) setLastName(data.lastName);
          if (data.email) setEmail(data.email);
          if (data.avatarUrl) setProfilePic(data.avatarUrl);
          if (data.theme === 'dark' || data.theme === 'light') setTheme(data.theme);
          if (data.banksGoal !== undefined) setWeb2Goal({ amount: data.banksGoal, currency: 'USD' });
          if (data.cryptoGoal !== undefined) setWeb3Goal({ amount: data.cryptoGoal, currency: 'ETH' });
          if (data.passcodeHash) setPasscodeHash(data.passcodeHash);
        }
      } catch (err) {
        console.error('[settings] load failed:', err);
      }
    }
    loadSettings();
  }, []);

  // Save individual settings to API (debounced)
  function saveSetting(field: string, value: unknown) {
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    }).catch(() => {});
  }

  // Fetch entries from API on mount and mode change
  useEffect(() => {
    let cancelled = false;
    async function fetchEntries() {
      setLoadingEntries(true);
      try {
        const res = await fetch(`/api/entries?mode=${mode}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setEntries(data);
      } catch (err) {
        console.error("[fetchEntries] failed:", err);
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoadingEntries(false);
      }
    }
    fetchEntries();
    return () => { cancelled = true; };
  }, [mode]);

  // Fetch goal from API on mount and mode change
  useEffect(() => {
    let cancelled = false;
    async function fetchGoal() {
      try {
        const res = await fetch(`/api/goal?mode=${mode}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled && data.amount) {
          if (mode === "banks") {
            setWeb2Goal({ amount: data.amount, currency: data.currency || "USD" });
          } else {
            setWeb3Goal({ amount: data.amount, currency: data.currency || "ETH" });
          }
        }
      } catch (err) {
        console.error("[fetchGoal] failed:", err);
      }
    }
    fetchGoal();
    return () => { cancelled = true; };
  }, [mode]);

  const totalEarned = entries.filter(e => e.mode === mode).reduce((s,e) => s+e.earned, 0);
  const totalGiven = entries.filter(e => e.mode === mode).reduce((s,e) => s+e.given, 0);
  const totalSaved = entries.filter(e => e.mode === mode).reduce((s,e) => s+e.saved, 0);
  const netIncome = totalEarned - totalGiven;

  if (!isAuthenticated) {
    return (
      <div className={cn("bg-[#09090B] text-zinc-50 min-h-screen w-full flex font-sans overflow-hidden", theme === 'light' ? 'theme-light' : 'theme-dark')}>
        <style>{`
          .theme-light {
            --bg-main: #F5F5F8;
            --bg-card: #FFFFFF;
            --bg-hover: #F1F1F5;
            --border-color: #E2E8F0;
            --text-main: #18181A;
            --text-muted: #71717A;
            --primary: #83B72D;
            --primary-bright: #D7FE03;
            --bg-white-5: rgba(0,0,0,0.03);
            --bg-white-10: rgba(0,0,0,0.06);
          }
          .theme-light .bg-\\[\\#09090B\\] { background-color: var(--bg-main) !important; }
          .theme-light .bg-\\[\\#131316\\] { background-color: var(--bg-card) !important; box-shadow: 0 4px 15px rgba(0,0,0,0.03) !important; }
          .theme-light .text-zinc-50, .theme-light .text-zinc-100 { color: var(--text-main) !important; }
          .theme-light .text-zinc-400, .theme-light .text-zinc-500 { color: var(--text-muted) !important; }
          .theme-light .border-\\[\\#222226\\] { border-color: var(--border-color) !important; }
          .theme-light button.theme-toggle:hover { background-color: var(--bg-white-5) !important; color: var(--text-main) !important; }
          
          .theme-light .auth-left-pane {
            background-color: #0A0A0A !important;
          }
          .theme-light .auth-left-pane .text-zinc-400 {
            color: #A1A1AA !important;
          }
          .theme-light .auth-left-pane .text-zinc-500 {
            color: #71717A !important;
          }
        `}</style>
        
        {/* Left Side: Branding / Visual (Hidden on mobile) */}
        <div className="auth-left-pane hidden lg:flex lg:w-1/2 relative bg-zinc-950 flex-col justify-between p-12 border-r border-[#222226]">
           {/* Abstract shapes / glow */}
           <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4FE44]/10 rounded-full blur-[100px] pointer-events-none"></div>
           <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
           
           <div className="relative z-10 w-full max-w-lg mx-auto mt-12">
             <div className="h-16"></div>
             
             <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white mb-6">
               Welcome back
             </h1>
             <p className="text-lg text-zinc-400 max-w-md">
               Sign in to access your dashboard.
             </p>
           </div>
           
           <div className="relative z-10 text-zinc-500 text-sm font-medium max-w-lg mx-auto w-full">
           </div>
        </div>

        {/* Right Side: Authentication */}
        <div className="w-full lg:w-1/2 flex flex-col relative bg-[#09090B]">
          
          <div className="absolute top-6 right-6 md:top-8 md:right-8 z-50">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="theme-toggle w-11 h-11 bg-[#131316] border border-[#222226] rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-50 hover:bg-white/5 transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto p-6 md:p-8 animate-in fade-in zoom-in-95 duration-500">
              
              {/* Mobile header - no branding */}

              <div className="w-16 h-16 mb-8 rounded-[1.2rem] bg-[#131316] border border-[#222226] flex items-center justify-center text-zinc-300 shadow-sm relative overflow-hidden group">
                 <Lock size={26} strokeWidth={2.5} />
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2 tracking-tight text-center">Passcode</h2>
              <p className="text-zinc-500 font-medium text-sm text-center mb-8 sm:mb-10">To protect your account, please verify your identity.</p>
              
              <div className="w-full max-w-[280px]">
                <input
                  type="password"
                  maxLength={6}
                  placeholder="Enter passcode..."
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full px-5 py-4 bg-[#131316] border border-[#222226] rounded-xl text-center text-2xl tracking-[0.5em] text-zinc-100 focus:outline-none focus:border-[#D4FE44] focus:ring-1 focus:ring-[#D4FE44]/50 transition-all font-mono placeholder:tracking-normal placeholder:text-base placeholder:text-zinc-600"
                  autoFocus
                />
              </div>
              
              <div className="h-10 mt-8 flex items-center justify-center w-full">
                 {wrongPasscode && (
                   <div className="flex items-center gap-2 text-red-500 font-medium text-sm">
                     Incorrect Passcode
                   </div>
                 )}
              </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-[#09090B] text-zinc-50 min-h-screen w-full flex overflow-hidden font-sans", theme === 'light' ? 'theme-light' : 'theme-dark')}>
      <style>{`
        .theme-light {
          --bg-main: #F5F5F8;
          --bg-card: #FFFFFF;
          --bg-hover: #F1F1F5;
          --border-color: #E2E8F0;
          --text-main: #18181A;
          --text-muted: #71717A;
          --primary: #83B72D;
          --primary-bright: #D7FE03;
          --bg-white-5: rgba(0,0,0,0.03);
          --bg-white-10: rgba(0,0,0,0.06);
        }

        .theme-light .bg-\\[\\#09090B\\] { background-color: var(--bg-main) !important; }
        .theme-light .bg-\\[\\#131316\\] { background-color: var(--bg-card) !important; box-shadow: 0 4px 15px rgba(0,0,0,0.03) !important; }
        .theme-light .bg-zinc-950\\/80 { background-color: rgba(245, 245, 248, 0.8) !important; }
        .theme-light .bg-\\[\\#1C1C21\\] { background-color: var(--bg-hover) !important; }
        .theme-light .text-zinc-50, .theme-light .text-zinc-100 { color: var(--text-main) !important; }
        .theme-light .text-zinc-400, .theme-light .text-zinc-500 { color: var(--text-muted) !important; }
        .theme-light .border-\\[\\#222226\\], .theme-light .border-\\[\\#2A2A30\\] { border-color: var(--border-color) !important; }
        .theme-light .bg-white\\/5 { background-color: var(--bg-white-5) !important; border-color: var(--border-color) !important; }
        .theme-light .bg-white\\/10 { background-color: var(--bg-white-10) !important; border-color: var(--border-color) !important; color: var(--text-main) !important; }
        .theme-light .text-\\[\\#D4FE44\\] { color: var(--primary) !important; }
        .theme-light .bg-\\[\\#D4FE44\\] { background-color: var(--primary-bright) !important; color: #0A0A0A !important; border-color: var(--primary) !important; }
        .theme-light .bg-\\[\\#D4FE44\\]\\/10 { background-color: rgba(131, 183, 45, 0.1) !important; border-color: rgba(131, 183, 45, 0.3) !important; color: var(--primary) !important; }
        
        .theme-light nav button.text-zinc-400:hover { color: var(--text-main) !important; background-color: var(--bg-white-5) !important; }
        .theme-light input { color: var(--text-main) !important; }
        .theme-light input::placeholder { color: var(--text-muted) !important; }
        .theme-light .recharts-cartesian-grid-line { stroke: var(--border-color) !important; }
        
        /* Stop overriding the dark card specifically requested by design */
        .theme-light .force-dark-card { background-color: #0A0A0A !important; color: white !important;}
        .theme-light .force-dark-card .text-zinc-300 { color: #A1A1AA !important; }
        .theme-light .force-dark-card .text-zinc-100 { color: white !important; }

        /* Hide number input spinners */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
      `}</style>
      
      {/* SIDEBAR NAVIGATION */}
      <aside className={`${sidebarCollapsed ? 'w-[70px]' : 'w-[260px]'} border-r border-[#222226] bg-[#09090B] hidden md:flex flex-col flex-shrink-0 z-10 transition-all duration-300`}>
        <div className={`${sidebarCollapsed ? 'p-4 justify-center' : 'p-8'} flex items-center gap-3`}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center relative shadow-[0_0_15px_rgba(212,254,68,0.2)]">
            <Image src="/favicon.svg" alt="korgon logo" fill className="object-contain" />
          </div>
          {!sidebarCollapsed && <span className="text-xl font-bold tracking-tight">korgon</span>}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className={`${sidebarCollapsed ? 'ml-0' : 'ml-auto'} w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors`}>
            {sidebarCollapsed ? <ChevronRight size={16} /> : <Menu size={16} />}
          </button>
        </div>

        <nav className={`flex-1 ${sidebarCollapsed ? 'px-2' : 'px-4'} space-y-1 overflow-y-auto custom-scrollbar pt-2`}>
          {!sidebarCollapsed && <p className="px-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-4">Main Menu</p>}
          <button onClick={() => setActiveTab('Dashboard')} title="Dashboard" className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full", activeTab === 'Dashboard' ? "bg-white/5 text-zinc-50 border border-white/5" : "text-zinc-400 hover:text-zinc-50 hover:bg-white/5")}>
            <Home size={20} className={activeTab === 'Dashboard' ? "text-[#D4FE44]" : ""} />
            {!sidebarCollapsed && <span className="font-medium">Dashboard</span>}
          </button>
          <button onClick={() => setActiveTab('Analytics')} title="Analytics" className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full", activeTab === 'Analytics' ? "bg-white/5 text-zinc-50 border border-white/5" : "text-zinc-400 hover:text-zinc-50 hover:bg-white/5")}>
            <PieChart size={20} />
            {!sidebarCollapsed && <span className="font-medium">Analytics</span>}
          </button>
          <button onClick={() => setActiveTab('Cards')} title={mode === 'banks' ? 'My Cards' : 'My Wallets'} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full", activeTab === 'Cards' ? "bg-white/5 text-zinc-50 border border-white/5" : "text-zinc-400 hover:text-zinc-50 hover:bg-white/5")}>
            <CreditCard size={20} />
            {!sidebarCollapsed && <span className="font-medium">{mode === 'banks' ? 'My Cards' : 'My Wallets'}</span>}
          </button>
          <button onClick={() => setActiveTab('Security')} title="Security" className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full", activeTab === 'Security' ? "bg-white/5 text-zinc-50 border border-white/5" : "text-zinc-400 hover:text-zinc-50 hover:bg-white/5")}>
            <Shield size={20} />
            {!sidebarCollapsed && <span className="font-medium">Security</span>}
          </button>

          {!sidebarCollapsed && <p className="px-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-4 mt-8">General</p>}
          <button onClick={() => setActiveTab('Settings')} title="Settings" className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full", activeTab === 'Settings' ? "bg-white/5 text-zinc-50 border border-white/5" : "text-zinc-400 hover:text-zinc-50 hover:bg-white/5")}>
            <Settings size={20} />
            {!sidebarCollapsed && <span className="font-medium">Settings</span>}
          </button>
          
        </nav>

        </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#09090B] pb-16 md:pb-0">
        {/* HEADER */}
        <header className="h-auto md:h-24 py-4 md:py-0 flex flex-col-reverse md:flex-row items-start md:items-center justify-between px-4 md:px-8 bg-zinc-950/80 backdrop-blur-xl border-b border-[#222226] sticky top-0 z-20 gap-4 md:gap-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-zinc-50">Hello, {firstName}</h1>
            <p className="text-sm text-zinc-400 dark:text-zinc-400">Welcome to your financial dashboard</p>
          </div>

          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            {/* Context Switcher (Overview / Crypto) */}
            <div className="bg-[#131316] p-1 rounded-xl flex border border-[#222226] flex-1 md:flex-initial">
              <button 
                onClick={() => setMode('banks')} 
                className={cn("flex-1 md:flex-none px-4 md:px-5 py-2 rounded-lg text-sm font-semibold transition-all", mode === 'banks' ? "bg-white/10 text-zinc-50 shadow-md" : "text-zinc-400 dark:text-zinc-400 hover:text-zinc-200")}
              >
                Banking
              </button>
              <button 
                onClick={() => setMode('crypto')} 
                className={cn("flex-1 md:flex-none px-4 md:px-5 py-2 rounded-lg text-sm font-semibold transition-all", mode === 'crypto' ? "bg-white/10 text-zinc-50 shadow-md" : "text-zinc-400 dark:text-zinc-400 hover:text-zinc-200")}
              >
                Crypto
              </button>
            </div>

            <div className="relative flex items-center gap-2">
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-11 h-11 bg-[#131316] border border-[#222226] rounded-xl flex items-center justify-center text-zinc-400 dark:text-zinc-400 hover:text-zinc-50 hover:bg-white/5 transition-colors relative flex-shrink-0"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-11 h-11 bg-[#131316] border border-[#222226] rounded-xl flex items-center justify-center text-zinc-400 dark:text-zinc-400 hover:text-zinc-50 hover:bg-white/5 transition-colors relative flex-shrink-0"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#D4FE44] rounded-full"></span>
                )}
              </button>
              
              {/* Notification Dropdown Overlay */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                  <div className="absolute right-0 top-14 w-80 bg-[#131316]/95 backdrop-blur-xl border border-[#222226] rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
                    <div className="flex justify-between items-center p-4 border-b border-[#222226]">
                      <h3 className="font-bold text-zinc-100 text-sm">Notifications</h3>
                      <button 
                        className="text-xs text-[#D4FE44] hover:underline cursor-pointer"
                        onClick={() => setNotifications(notifications.map(n => ({...n, read: true})))}
                      >
                        Mark all as read
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length > 0 ? notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          onClick={() => {
                            if (!notif.read) {
                              setNotifications(notifications.map(n => n.id === notif.id ? {...n, read: true} : n));
                            }
                          }}
                          className={cn("p-4 border-b border-[#222226]/50 transition-colors cursor-pointer", notif.read ? "opacity-60 hover:bg-white/5" : "bg-[#D4FE44]/5 hover:bg-[#D4FE44]/10")}
                        >
                          <div className="flex justify-between items-start mb-1">
                             <p className={cn("text-sm", notif.read ? "text-zinc-300 font-medium" : "text-zinc-100 font-bold")}>{notif.title}</p>
                             {!notif.read && <span className="w-2 h-2 rounded-full bg-[#D4FE44] mt-1.5 flex-shrink-0 shadow-[0_0_10px_rgba(212,254,68,0.5)]"></span>}
                          </div>
                          <p className="text-xs text-zinc-500">{notif.time}</p>
                        </div>
                      )) : (
                        <div className="p-8 text-center text-zinc-500 text-sm">No notifications</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        
        {activeTab === 'Dashboard' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
          
          {loadingEntries ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-[#222226] border-t-[#D4FE44] rounded-full animate-spin"></div>
                <p className="text-sm text-zinc-400 font-medium">Loading entries...</p>
              </div>
            </div>
          ) : (<>
          {/* TOP STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <div className="bg-[#131316] p-6 rounded-3xl border border-[#222226] shadow-sm flex flex-col justify-between group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm font-medium text-zinc-400 dark:text-zinc-400 mb-1">Total Income</p>
                  <div className="h-9 flex items-center">
                    <h3 className="text-3xl font-bold text-zinc-50 leading-none">{bankSymbol}{toBankDisplay(totalEarned)}</h3>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <ArrowUpRight size={20} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm h-5">
                <span className="text-emerald-400 font-semibold px-2 py-1 bg-emerald-500/10 rounded-md leading-none">+14.5%</span>
                <span className="text-zinc-400 dark:text-zinc-500">vs last month</span>
              </div>
            </div>

            <div className="bg-[#131316] p-6 rounded-3xl border border-[#222226] shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm font-medium text-zinc-400 dark:text-zinc-400 mb-1">Total Expenses</p>
                  <div className="h-9 flex items-center">
                    <h3 className="text-3xl font-bold text-zinc-50 leading-none">{bankSymbol}{toBankDisplay(totalGiven)}</h3>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
                  <ArrowDownRight size={20} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm h-5">
                <span className="text-red-400 font-semibold px-2 py-1 bg-red-500/10 rounded-md leading-none">+2.1%</span>
                <span className="text-zinc-400 dark:text-zinc-500">vs last month</span>
              </div>
            </div>

            <div className="bg-[#131316] p-6 rounded-3xl border border-[#222226] shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm font-medium text-zinc-400 dark:text-zinc-400 mb-1">Net Savings</p>
                  <div className="h-9 flex items-center">
                    <h3 className="text-3xl font-bold text-zinc-50 leading-none">{bankSymbol}{toBankDisplay(totalSaved)}</h3>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Briefcase size={20} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm h-5">
                <span className="text-zinc-400 dark:text-zinc-400 font-semibold leading-none">{totalSaved > 0 ? 'On track' : 'Needs attention'}</span>
              </div>
            </div>

            {/* GOAL CARD */}
            <div className="bg-[#131316] p-6 rounded-3xl border border-[#222226] shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm font-medium text-zinc-400 mb-1">{mode === 'banks' ? 'Financial Goal' : 'Crypto Goal'}</p>
                    <div className="flex-1">
                      {mode === 'banks' ? (
                        <div className="flex items-center gap-1">
                          <span className="text-3xl font-bold text-zinc-50 leading-none">
                            {web2Goal.currency === 'USD' ? '$' : web2Goal.currency === 'EUR' ? '€' : web2Goal.currency === 'GBP' ? '£' : web2Goal.currency === 'INR' ? '₹' : '$'}
                          </span>
                          <input 
                            type="number" 
                            value={web2Goal.amount} 
                            onChange={(e) => {
                              const newGoal = {...web2Goal, amount: Number(e.target.value)};
                              setWeb2Goal(newGoal);
                              fetch("/api/goal", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ mode: "banks", amount: newGoal.amount, currency: newGoal.currency }),
                              }).catch(err => console.error("[saveGoal web2] failed:", err));
                            }}
                            className="bg-transparent text-3xl font-bold text-zinc-50 w-28 outline-none border-b border-[#222226] focus:border-[#D4FE44] leading-none"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-3xl font-bold text-zinc-50 leading-none">$</span>
                          <input 
                            type="number" 
                            value={web3Goal.amount} 
                            onChange={(e) => {
                              const newGoal = {...web3Goal, amount: Number(e.target.value)};
                              setWeb3Goal(newGoal);
                              fetch("/api/goal", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ mode: "crypto", amount: newGoal.amount, currency: "USD" }),
                              }).catch(err => console.error("[saveGoal web3] failed:", err));
                            }}
                            className="bg-transparent text-3xl font-bold text-zinc-50 w-28 outline-none border-b border-[#222226] focus:border-[#D4FE44] leading-none"
                          />
                        </div>
                      )}
                    </div>
                    <div className="mt-1">
                      {mode === 'banks' ? (
                        <select 
                          value={web2Goal.currency}
                          onChange={(e) => {
                            const newGoal = {...web2Goal, currency: e.target.value};
                            setWeb2Goal(newGoal);
                            fetch("/api/goal", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ mode: "banks", amount: newGoal.amount, currency: newGoal.currency }),
                            }).catch(err => console.error("[saveGoal web2 currency] failed:", err));
                          }}
                          className="bg-transparent text-xs text-zinc-500 font-semibold outline-none cursor-pointer w-auto"
                        >
                          <option value="USD">USD (US Dollar)</option>
                          <option value="EUR">EUR (Euro)</option>
                          <option value="GBP">GBP (British Pound)</option>
                          <option value="INR">INR (Indian Rupee)</option>
                        </select>
                      ) : null}
                    </div>
                 </div>
                <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Shield size={20} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm h-5">
                <div className="w-full bg-[#222226] h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-[#D4FE44] h-full" style={{width: `${Math.min((totalSaved / (mode === 'banks' ? web2Goal.amount : web3Goal.amount * 3000)) * 100, 100)}%`}}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
            
            {/* CASH FLOW CHART */}
            <div className="xl:col-span-2 flex flex-col relative h-[320px] md:h-[420px]">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-lg font-bold text-zinc-100">Cash Flow Analytics</h2>
                  <p className="text-sm text-zinc-400 dark:text-zinc-400">Click a bar to filter transactions by month</p>
                </div>
                <div className="relative">
                  <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="flex items-center gap-2 pl-9 pr-8 py-2 bg-[#131316] border border-[#222226] hover:bg-[#1C1C21] rounded-xl text-sm font-medium text-zinc-300 transition-colors appearance-none outline-none cursor-pointer"
                  >
                    <option value={2026}>2026 Year</option>
                    <option value={2025}>2025 Year</option>
                    <option value={2024}>2024 Year</option>
                  </select>
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              <div className="bg-[#131316] border border-[#222226] rounded-3xl p-6 flex-1 shadow-sm relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} barSize={24} onClick={(state: any) => {
                    if (state && state.activePayload && state.activePayload.length > 0) {
                      const clickedMonth = state.activePayload[0].payload.month;
                      setSelectedMonth(prev => prev === clickedMonth ? null : clickedMonth);
                    }
                  }}>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#71717A', fontWeight: 500 }}
                      dy={15}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.03)', rx: 8 }} 
                      content={<CustomTooltip selectedYear={selectedYear} currencySymbol={bankSymbol} convertAmount={toBankDisplay} />}
                    />
                    <Bar dataKey="earned" stackId="a" radius={[0,0,6,6]} style={{ cursor: 'pointer' }}>
                      {monthlyData.map((data, index) => <Cell key={`cell-${index}`} fill={BRAND} opacity={selectedMonth && selectedMonth !== data.month ? 0.15 : 1} stroke={selectedMonth === data.month ? "#fff" : "transparent"} strokeWidth={selectedMonth === data.month ? 2 : 0} />)}
                    </Bar>
                    <Bar dataKey="given" stackId="a" radius={[6,6,0,0]} style={{ cursor: 'pointer' }}>
                      {monthlyData.map((data, index) => <Cell key={`given-${index}`} fill="#3F3F46" opacity={selectedMonth && selectedMonth !== data.month ? 0.15 : 1} stroke={selectedMonth === data.month ? "#fff" : "transparent"} strokeWidth={selectedMonth === data.month ? 2 : 0} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* TRANSACTIONS LIST */}
            <div className="flex flex-col h-[400px] md:h-[420px] mt-8 xl:mt-0">
              <div className="flex justify-between items-end mb-6 h-10">
                <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  Transactions
                  {selectedMonth && (
                    <span className="text-[#D4FE44] font-medium text-sm flex items-center bg-[#D4FE44]/10 px-2.5 py-0.5 rounded-md border border-[#D4FE44]/20">
                      {selectedMonth}
                      <button onClick={(e) => { e.stopPropagation(); setSelectedMonth(null); }} className="ml-1 hover:text-white"><X size={12}/></button>
                    </span>
                  )}
                </h2>
                <div className="flex gap-2 relative">
                  <div className={cn("absolute right-full mr-2 top-1/2 -translate-y-1/2 transition-all duration-300 overflow-hidden", showSearch ? "w-48 opacity-100" : "w-0 opacity-0 pointer-events-none")}>
                    <input 
                      type="text" 
                      placeholder="Search..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#1C1C21] border border-[#222226] rounded-xl px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors"
                    />
                  </div>
                  <button onClick={() => setShowSearch(!showSearch)} className={cn("p-2 border rounded-xl transition-colors min-w-[34px]", showSearch ? "bg-white/10 border-white/10 text-zinc-200" : "bg-[#131316] border-[#222226] hover:bg-[#1C1C21] text-zinc-400 hover:text-zinc-200")}>
                     <Search size={16} />
                  </button>
                  <button onClick={handleExportCSV} title="Export CSV" className="p-2 border border-[#222226] bg-[#131316] hover:bg-[#1C1C21] text-zinc-400 hover:text-zinc-200 rounded-xl transition-colors min-w-[34px]">
                     <Download size={16} />
                  </button>
                  {mode === 'crypto' && (
                    <button 
                      onClick={() => setShowTransferToWeb2(true)} 
                      title="Transfer to Bank"
                      className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-xl hover:scale-105 transition-all"
                    >
                       <ArrowRightLeft size={16} strokeWidth={2} />
                    </button>
                  )}
                  <button onClick={() => setShowAdd(true)} className="p-2 bg-[#D4FE44] border border-[#D4FE44]/20 hover:bg-[#bceb29] rounded-xl text-black hover:scale-105 transition-all">
                     <Plus size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              <div className="bg-[#131316] border border-[#222226] rounded-3xl p-2 flex-1 shadow-sm overflow-hidden flex flex-col">
                {/* Categories Row */}
                <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide border-b border-[#222226]">
                  {categories.map(cat => (
                     <button 
                       key={cat} 
                       onClick={() => setFilter(cat)}
                       className={cn(
                         "px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors",
                         filter === cat ? "bg-white/10 text-zinc-50 border border-white/10" : "bg-transparent text-zinc-400 dark:text-zinc-400 hover:bg-white/5"
                       )}
                     >
                       {cat}
                     </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 mt-1">
                  {filteredEntries.map(entry => {
                    const isPositive = entry.earned > entry.given;
                    const amount = isPositive ? entry.earned : entry.given;
                    return (
                      <div key={entry.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/5">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-11 h-11 rounded-xl flex items-center justify-center border",
                            isPositive ? "bg-[#D4FE44]/10 text-[#D4FE44] border-[#D4FE44]/20" : "bg-zinc-800 text-zinc-400 dark:text-zinc-400 border-[#222226]"
                          )}>
                             {isPositive ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-zinc-100">{entry.project}</h4>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                              {entry.date} • {entry.givenTo}
                              {entry.walletId && (
                                <span className="ml-1 text-[#D4FE44]/70">
                                  • {mode === 'banks' 
                                    ? (bankCards.find(c => c.id === entry.walletId)?.name || 'Card')
                                    : (wallets.find(w => w.id === entry.walletId)?.name || 'Wallet')
                                  }
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-sm font-bold", isPositive ? "text-[#D4FE44]" : "text-zinc-100")}>
                            {isPositive ? "+" : "-"}${amount.toLocaleString()}
                          </p>
                          <div className="flex justify-end gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingEntry(entry)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:text-zinc-300"><Edit2 size={12} /></button>
                            <button onClick={() => setDeletingTransactionId(entry.id)} className="text-zinc-400 dark:text-zinc-500 hover:text-red-400"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  
                  {filteredEntries.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
                       <HelpCircle size={32} className="mb-2 opacity-50" />
                       <span className="text-sm font-medium">No transactions found</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
          </>)}
        </div>
        )}
        
        {activeTab === 'Analytics' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
            {mode === 'banks' ? (
              /* ========== BANKS ANALYTICS ========== */
              <div className="max-w-6xl mx-auto space-y-6 pb-20 md:pb-0">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-zinc-100">Financial Analytics</h2>
                  <p className="text-sm text-zinc-400">Track your income, spending, and savings performance.</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Earned', value: totalEarned, color: 'text-emerald-400', icon: ArrowUpRight, prefix: bankSymbol },
                    { label: 'Total Spent', value: totalGiven, color: 'text-red-400', icon: ArrowDownRight, prefix: bankSymbol },
                    { label: 'Net Income', value: netIncome, color: netIncome >= 0 ? 'text-emerald-400' : 'text-red-400', icon: TrendingUp, prefix: bankSymbol },
                    { label: 'Total Saved', value: totalSaved, color: 'text-[#D4FE44]', icon: Activity, prefix: bankSymbol },
                  ].map((card, i) => (
                    <div key={i} className="bg-[#131316] border border-[#222226] rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <card.icon size={16} className={card.color} />
                        <span className="text-xs text-zinc-500 font-medium">{card.label}</span>
                      </div>
                      <p className={cn("text-2xl font-bold", card.color)}>{card.prefix}{bankCurrency === 'INR' ? toBankDisplay(card.value) : card.value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    </div>
                  ))}
                </div>

                {/* Main Chart */}
                <div className="bg-[#131316] border border-[#222226] rounded-3xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-zinc-100">Income vs Expenses</h3>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#D4FE44]"></span> Earned</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400"></span> Spent</span>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222226" vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717A' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717A' }} tickFormatter={(val) => `$${val}`} />
                        <Tooltip contentStyle={{ backgroundColor: '#131316', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', color: '#FAFAFA' }} />
                        <Bar dataKey="earned" fill="#D4FE44" radius={[6,6,0,0]} maxBarSize={40} />
                        <Bar dataKey="given" fill="#f87171" radius={[6,6,0,0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Monthly Savings */}
                  <div className="bg-[#131316] border border-[#222226] rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-zinc-100 mb-6">Monthly Savings</h3>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                          <defs>
                            <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#D4FE44" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#D4FE44" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#222226" vertical={false} />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717A' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717A' }} tickFormatter={(val) => `$${val}`} />
                          <Tooltip contentStyle={{ backgroundColor: '#131316', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', color: '#FAFAFA' }} />
                          <Area type="monotone" dataKey="saved" stroke="#D4FE44" strokeWidth={2} fillOpacity={1} fill="url(#colorSaved)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-[#131316] border border-[#222226] rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-zinc-100 mb-4">Recent Activity</h3>
                    <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar">
                      {filteredEntries.slice(0, 8).map((entry, i) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-[#09090B] hover:bg-[#1C1C21] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", entry.earned > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                              {entry.earned > 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-zinc-200">{entry.project}</p>
                              <p className="text-xs text-zinc-500">{entry.date} • {entry.givenTo}</p>
                            </div>
                          </div>
                          <span className={cn("text-sm font-bold", entry.earned > 0 ? "text-emerald-400" : "text-red-400")}>
                            {entry.earned > 0 ? '+' : '-'}${(entry.earned || entry.given).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {filteredEntries.length === 0 && (
                        <p className="text-sm text-zinc-500 text-center py-8">No transactions yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ========== CRYPTO ANALYTICS ========== */
              <div className="max-w-6xl mx-auto space-y-6 pb-20 md:pb-0">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-zinc-100">Crypto Analytics</h2>
                  <p className="text-sm text-zinc-400">Portfolio performance, ROI tracking, and wallet distribution.</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Portfolio Value', value: totalEarned, color: 'text-purple-400', icon: Wallet, prefix: '$' },
                    { label: 'Total Invested', value: totalSaved, color: 'text-blue-400', icon: TrendingDown, prefix: '$' },
                    { label: 'Net P&L', value: totalEarned - totalSaved, color: (totalEarned - totalSaved) >= 0 ? 'text-emerald-400' : 'text-red-400', icon: TrendingUp, prefix: '$' },
                    { label: 'Transactions', value: filteredEntries.length, color: 'text-[#D4FE44]', icon: Activity, prefix: '' },
                  ].map((card, i) => (
                    <div key={i} className="bg-[#131316] border border-[#222226] rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <card.icon size={16} className={card.color} />
                        <span className="text-xs text-zinc-500 font-medium">{card.label}</span>
                      </div>
                      <p className={cn("text-2xl font-bold", card.color)}>{card.prefix}{typeof card.value === 'number' ? (card.prefix === '' ? card.value : card.value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})) : card.value}</p>
                    </div>
                  ))}
                </div>

                {/* Portfolio Chart */}
                <div className="bg-[#131316] border border-[#222226] rounded-3xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-zinc-100">Portfolio Value Over Time</h3>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-400"></span> Current Value</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-400"></span> Invested</span>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                        <defs>
                          <linearGradient id="colorCurrentValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222226" vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717A' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717A' }} tickFormatter={(val) => `$${val}`} />
                        <Tooltip contentStyle={{ backgroundColor: '#131316', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', color: '#FAFAFA' }} />
                        <Area type="monotone" dataKey="saved" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorInvested)" name="Invested" />
                        <Area type="monotone" dataKey="earned" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorCurrentValue)" name="Current Value" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Wallet Distribution */}
                  <div className="bg-[#131316] border border-[#222226] rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-zinc-100 mb-4">Wallet Distribution</h3>
                    {wallets.length > 0 ? (
                      <div className="space-y-4">
                        {wallets.map((w, i) => {
                          const totalBal = wallets.reduce((s, x) => s + x.balance, 0);
                          const pct = totalBal > 0 ? (w.balance / totalBal) * 100 : 0;
                          const colors = ['bg-purple-400', 'bg-blue-400', 'bg-emerald-400', 'bg-amber-400', 'bg-pink-400', 'bg-cyan-400'];
                          return (
                            <div key={w.id}>
                              <div className="flex justify-between items-end mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className={cn("w-2.5 h-2.5 rounded-full", colors[i % colors.length])}></span>
                                  <span className="text-sm font-medium text-zinc-300">{w.name}</span>
                                </div>
                                <span className="text-sm font-bold text-zinc-100">${w.balance.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                              </div>
                              <div className="w-full bg-[#222226] h-2 rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full transition-all", colors[i % colors.length])} style={{ width: `${pct}%` }}></div>
                              </div>
                              <p className="text-[10px] text-zinc-600 mt-0.5 font-mono">{w.address.slice(0,8)}...{w.address.slice(-4)} • {w.network}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Wallet size={32} className="text-zinc-600 mx-auto mb-3" />
                        <p className="text-sm text-zinc-500">No wallets added yet</p>
                      </div>
                    )}
                  </div>

                  {/* Recent Crypto Activity */}
                  <div className="bg-[#131316] border border-[#222226] rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-zinc-100 mb-4">Recent Transactions</h3>
                    <div className="space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar">
                      {filteredEntries.slice(0, 8).map((entry, i) => {
                        const wallet = wallets.find(w => w.id === entry.walletId);
                        return (
                          <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-[#09090B] hover:bg-[#1C1C21] transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center">
                                <Wallet size={14}/>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-zinc-200">{entry.project}</p>
                                <p className="text-xs text-zinc-500">{entry.date}{wallet ? ` • ${wallet.name}` : ''}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold text-purple-400">${entry.earned.toFixed(2)}</span>
                              {entry.saved > 0 && entry.saved !== entry.earned && (
                                <p className="text-[10px] text-zinc-500">Cost: ${entry.saved.toFixed(2)}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {filteredEntries.length === 0 && (
                        <p className="text-sm text-zinc-500 text-center py-8">No transactions yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Cards' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
            {mode === 'banks' ? (
              <div className="max-w-5xl mx-auto space-y-6 pb-20 md:pb-0">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-100">My Cards</h2>
                    <p className="text-sm text-zinc-400">Manage your active physical and virtual cards.</p>
                  </div>
                  <button onClick={() => { setShowAddCard(true); setCardError(''); }} className="px-4 py-2 bg-[#D4FE44] text-[#0A0A0A] rounded-xl font-bold text-sm hover:bg-[#bceb29] transition-all flex items-center gap-2">
                    <Plus size={16}/> New Card
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {bankCards.map((card, i) => (
                    <div key={card.id} className={`${i === 0 ? 'bg-gradient-to-tr from-[#D4FE44] to-[#A3D121]' : 'bg-zinc-800 border border-[#222226]'} rounded-3xl p-6 shadow-lg relative overflow-hidden h-64 flex flex-col justify-between group`}>
                      <div className={`absolute ${i === 0 ? '-right-8 -top-8 w-32 h-32 bg-white/20' : '-right-8 -bottom-8 w-32 h-32 bg-white/5'} rounded-full blur-2xl group-hover:bg-white/30 transition-colors`}></div>
                      <div className="flex justify-between items-start z-10 relative">
                        <span className={`${i === 0 ? 'text-[#0A0A0A]' : 'text-zinc-100'} font-bold text-lg tracking-tight`}>{card.name}</span>
                        <button onClick={() => setDeletingCardId(card.id)} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} className={i === 0 ? 'text-[#0A0A0A]/50 hover:text-red-600' : 'text-zinc-500 hover:text-red-400'} /></button>
                      </div>
                      <div className="z-10 relative">
                        <div className={`${i === 0 ? 'text-[#0A0A0A]/80' : 'text-zinc-300'} font-semibold tracking-widest text-xl font-mono mb-2`}>**** **** **** {card.last4}</div>
                        <div className={`${i === 0 ? 'text-[#0A0A0A]' : 'text-zinc-100'} font-bold text-xl mb-2`}>₹{(card.balance * 83.5).toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                        <div className="flex justify-between items-end">
                          <div>
                             <p className={`${i === 0 ? 'text-[#0A0A0A]/60' : 'text-zinc-500'} text-[10px] font-bold uppercase tracking-wider`}>Cardholder</p>
                             <p className={`${i === 0 ? 'text-[#0A0A0A]' : 'text-zinc-100'} font-bold text-sm`}>{card.holder}</p>
                          </div>
                          <div>
                             <p className={`${i === 0 ? 'text-[#0A0A0A]/60' : 'text-zinc-500'} text-[10px] font-bold uppercase tracking-wider`}>Expires</p>
                             <p className={`${i === 0 ? 'text-[#0A0A0A]' : 'text-zinc-100'} font-bold text-sm`}>{card.expiry}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <h3 className="text-lg font-bold text-zinc-100 mt-10 mb-6">Card Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-[#131316] border border-[#222226] rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-[#1C1C21] transition-colors">
                     <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center"><Snowflake size={18}/></div>
                     <div><p className="font-bold text-zinc-100 text-sm">Freeze Card</p><p className="text-xs text-zinc-500">Temporarily lock</p></div>
                   </div>
                   <div className="bg-[#131316] border border-[#222226] rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-[#1C1C21] transition-colors">
                     <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><Activity size={18}/></div>
                     <div><p className="font-bold text-zinc-100 text-sm">Spending Limits</p><p className="text-xs text-zinc-500">Set daily limits</p></div>
                   </div>
                   <div className="bg-[#131316] border border-[#222226] rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-[#1C1C21] transition-colors">
                     <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center"><EyeOff size={18}/></div>
                     <div><p className="font-bold text-zinc-100 text-sm">Show Details</p><p className="text-xs text-zinc-500">View CVV and expiry</p></div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="max-w-5xl mx-auto space-y-6 pb-20 md:pb-0">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-100">My Wallets</h2>
                    <p className="text-sm text-zinc-400">{wallets.length} wallet{wallets.length !== 1 ? 's' : ''} connected</p>
                  </div>
                  <button onClick={() => { setShowAddWallet(true); setWalletError(''); }} className="px-4 py-2 bg-[#D4FE44] text-[#0A0A0A] rounded-xl font-bold text-sm hover:bg-[#bceb29] transition-all flex items-center gap-2">
                    <Plus size={16}/> Add Wallet
                  </button>
                </div>

                {loadingWallets ? (
                  <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-[#D4FE44] border-t-transparent rounded-full animate-spin"></div></div>
                ) : wallets.length === 0 ? (
                  <div className="bg-[#131316] border border-[#222226] rounded-3xl p-12 text-center">
                    <Wallet size={40} className="text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-zinc-300 mb-2">No wallets yet</h3>
                    <p className="text-sm text-zinc-500 mb-6">Add your first wallet to start tracking your crypto portfolio.</p>
                    <button onClick={() => { setShowAddWallet(true); setWalletError(''); }} className="px-6 py-3 bg-[#D4FE44] text-[#0A0A0A] rounded-xl font-bold text-sm hover:bg-[#bceb29] transition-all"><Plus size={16} className="inline mr-2"/>Add Wallet</button>
                  </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {wallets.map((w) => (
                  <div key={w.id} className="bg-[#131316] border border-[#222226] rounded-3xl p-6 shadow-sm flex flex-col group hover:border-[#D4FE44]/30 transition-colors">
                    <div className="flex justify-between items-start mb-6">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-[#1C1C21] flex items-center justify-center"><Wallet size={18} className="text-zinc-300"/></div>
                         <div>
                           <h3 className="font-bold text-zinc-100">{w.name}</h3>
                           <p className="text-xs text-zinc-500 font-mono">{w.address.length > 12 ? `${w.address.slice(0,6)}...${w.address.slice(-4)}` : w.address}</p>
                         </div>
                       </div>
                       <div className="flex gap-1">
                         {w.isEncrypted && (
                           <button onClick={() => { setDecryptingWalletId(w.id); setDecryptPasscode(''); }} className="w-8 h-8 rounded-full bg-[#1C1C21] flex items-center justify-center text-zinc-400 hover:text-amber-400 transition-colors" title="Decrypt"><Lock size={14}/></button>
                         )}
                         <button onClick={() => setDeletingWalletId(w.id)} className="w-8 h-8 rounded-full bg-[#1C1C21] flex items-center justify-center text-zinc-400 hover:text-red-400 transition-colors" title="Delete"><Trash2 size={14}/></button>
                       </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-zinc-400 mb-1 tracking-wider uppercase">Total Balance</p>
                      <p className="text-2xl font-bold text-zinc-100">${w.balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    </div>
                    <div className="space-y-3 pt-4 border-t border-[#222226]">
                       <div className="flex justify-between items-center">
                         <div className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">{w.network === 'Solana' ? 'SOL' : w.network === 'Bitcoin' ? 'BTC' : 'ETH'}</span> <span className="text-sm font-semibold text-zinc-300">{w.network}</span></div>
                         <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${w.isEncrypted ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{w.isEncrypted ? '🔒 Encrypted' : 'Unencrypted'}</span>
                       </div>
                    </div>
                  </div>
                  ))}
                </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Security' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-0">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-zinc-100">Security</h2>
                <p className="text-sm text-zinc-400">Manage your dashboard passcode.</p>
              </div>

              {/* Change Passcode */}
              <div className="bg-[#131316] border border-[#222226] rounded-3xl p-6 shadow-sm flex flex-col max-w-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-[#1C1C21] text-zinc-400 flex items-center justify-center">
                       <Key size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-zinc-100">Change Passcode</h3>
                      <p className="text-xs text-zinc-500">Update your 6-digit access code.</p>
                    </div>
                  </div>
                  <div className="space-y-4 flex-1">
                    {securityPassMessage.text && (
                      <div className={cn("px-3 py-2 rounded-lg text-xs font-medium border", securityPassMessage.type === 'error' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20")}>
                        {securityPassMessage.text}
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">Current Passcode</label>
                      <input 
                        type="password" 
                        maxLength={6}
                        value={securityCurrentPass}
                        onChange={(e) => setSecurityCurrentPass(e.target.value)}
                        placeholder="••••••" 
                        className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors font-mono tracking-widest placeholder:tracking-normal" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">New Passcode (6 digits)</label>
                      <input 
                        type="password" 
                        maxLength={6}
                        value={securityNewPass}
                        onChange={(e) => setSecurityNewPass(e.target.value)}
                        placeholder="••••••" 
                        className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors font-mono tracking-widest placeholder:tracking-normal" 
                      />
                    </div>
                  </div>
                  <div className="pt-6">
                    <button 
                      onClick={async () => {
                        if (securityCurrentPass !== appPasscode) {
                          setSecurityPassMessage({ text: "Current passcode is incorrect.", type: "error" });
                          return;
                        }
                        if (securityNewPass.length !== 6 || !/^\d+$/.test(securityNewPass)) {
                          setSecurityPassMessage({ text: "New passcode must be exactly 6 digits.", type: "error" });
                          return;
                        }
                        // Save to API (server verifies current, hashes new)
                        try {
                          const res = await fetch('/api/settings', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ currentPasscode: securityCurrentPass, newPasscode: securityNewPass }),
                          });
                          if (!res.ok) {
                            const data = await res.json();
                            setSecurityPassMessage({ text: data.error || "Failed to update.", type: "error" });
                            return;
                          }
                          // Update local state
                          const { hashPasscode } = await import('./utils/encryption');
                          const newHash = await hashPasscode(securityNewPass);
                          setPasscodeHash(newHash);
                          setAppPasscode(securityNewPass);
                        } catch (err) {
                          console.error("[savePasscode] failed:", err);
                          setSecurityPassMessage({ text: "Network error.", type: "error" });
                          return;
                        }
                        changeContextPasscode(securityCurrentPass, securityNewPass);
                        setSecurityCurrentPass("");
                        setSecurityNewPass("");
                        setSecurityPassMessage({ text: "Passcode updated successfully.", type: "success" });
                        setTimeout(() => setSecurityPassMessage({ text: "", type: "" }), 3000);
                      }}
                      disabled={!securityCurrentPass || !securityNewPass}
                      className="w-full py-3 bg-[#D4FE44] text-[#0A0A0A] hover:bg-[#bceb29] disabled:opacity-50 disabled:hover:bg-[#D4FE44] rounded-xl font-bold text-sm transition-colors"
                    >
                      Update Passcode
                    </button>
                  </div>
                </div>

            </div>
          </div>
        )}

        {activeTab === 'Settings' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-0">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-zinc-100">Account Settings</h2>
                <p className="text-sm text-zinc-400">Manage your personal profile, regional preferences, and subscription details.</p>
              </div>
              
              {/* Profile Card */}
              <div className="bg-[#131316] border border-[#222226] rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-zinc-100 mb-6">Profile Information</h3>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex flex-col items-center gap-3">
                    <div 
                      className="relative w-24 h-24 rounded-full border-2 border-white/10 overflow-hidden group cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Image src={profilePic} alt="Avatar" fill className="object-cover transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={24} className="text-white" />
                      </div>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleProfileImageChange} 
                    />
                    <button 
                      className="text-xs font-semibold text-[#D4FE44] hover:underline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change Picture
                    </button>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">First Name</label>
                        <input 
                          type="text" 
                          value={firstName} 
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Last Name</label>
                        <input 
                          type="text" 
                          value={lastName} 
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors" 
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-medium text-zinc-400">Email Address</label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                          <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#09090B] border border-[#222226] rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors" 
                          />
                        </div>
                      </div>
                    </div>
                    <div className="pt-4">
                      <button 
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                        className={cn("px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-[0_5px_20px_rgba(212,254,68,0.15)] focus:outline-none flex items-center justify-center gap-2", 
                          isSaving ? "bg-[#D4FE44]/70 text-[#0A0A0A]/70 cursor-not-allowed" : "bg-[#D4FE44] text-[#0A0A0A] hover:bg-[#bceb29] hover:-translate-y-0.5"
                        )}
                      >
                         {isSaving ? (
                            <>
                              <div className="w-4 h-4 border-2 border-[#0A0A0A]/50 border-t-[#0A0A0A] rounded-full animate-spin"></div>
                              Saving...
                            </>
                         ) : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-[#131316] border border-[#222226] rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-zinc-100">Recent Activity</h3>
                  <span className="text-xs text-zinc-500 font-medium">{activities.length} actions</span>
                </div>
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-sm">
                    <Activity size={24} className="mx-auto mb-2 opacity-50" />
                    No activity yet. Add a card, wallet, or entry to get started.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                    {activities.map((a) => (
                      <div key={a.id} className="flex items-center justify-between p-3 bg-[#09090B] border border-[#222226] rounded-xl group hover:border-zinc-600 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            a.type === 'bank_entry' ? 'bg-emerald-500/10 text-emerald-400' :
                            a.type === 'crypto_entry' ? 'bg-purple-500/10 text-purple-400' :
                            a.type === 'card' ? 'bg-blue-500/10 text-blue-400' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>
                            {a.type === 'card' ? <CreditCard size={14} /> :
                             a.type === 'wallet' ? <Wallet size={14} /> :
                             <ArrowRightLeft size={14} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-200 truncate">{a.action}</p>
                            <p className="text-xs text-zinc-500">
                              {new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {' • '}
                              <span className={a.mode === 'banks' ? 'text-emerald-400' : 'text-purple-400'}>
                                {a.mode === 'banks' ? 'Banks' : 'Crypto'}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-mono text-zinc-400">
                            {a.mode === 'banks' ? '₹' : '$'}{a.amount.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                          </span>
                          <button
                            onClick={() => deleteActivity(a.id, a.type)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-all"
                            title="Delete this activity"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </main>
        

      {/* RIGHT SIDEBAR / QUICK ACTIONS PANEL */}
      <aside className="w-[320px] bg-[#09090B] border-l border-[#222226] hidden xl:flex flex-col flex-shrink-0 relative">
        <div className="p-8 flex flex-col h-full overflow-y-auto custom-scrollbar">
          
          {/* User Section */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-white/10 overflow-hidden">
                  <Image src={profilePic} alt="Avatar" width={48} height={48} className="object-cover" referrerPolicy="no-referrer" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#131316] rounded-full"></span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100">{firstName} {lastName ? `${lastName[0]}.` : ''}</h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Premium Member</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('Settings')}
              className="w-10 h-10 rounded-full bg-[#131316] border border-[#222226] flex items-center justify-center text-zinc-400 dark:text-zinc-400 hover:text-zinc-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* VIRTUAL CARD */}
          <div className="mb-8">
            <div className="flex justify-between items-end mb-4">
               <h3 className="text-sm font-bold text-zinc-100">{mode === 'banks' ? 'My Cards' : 'My Wallets'}</h3>
               <button 
                onClick={() => setActiveTab('Cards')}
                className="text-xs font-semibold text-[#D4FE44] hover:underline cursor-pointer"
               >
                 View All
               </button>
            </div>
            
            <div className="bg-gradient-to-tr from-[#D4FE44] to-[#A3D121] rounded-3xl p-6 shadow-[0_20px_40px_rgba(212,254,68,0.15)] relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer">
              {/* Glass Shapes */}
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-colors"></div>
              <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-black/10 rounded-full blur-xl"></div>
              
              <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                <div className="flex justify-between items-start">
                  <span className="text-[#0A0A0A] font-bold text-lg tracking-tight">korgon</span>
                  <Monitor size={24} className="text-[#0A0A0A] opacity-80" />
                </div>
                
                <div>
                  <p className="text-[#0A0A0A]/60 text-xs font-bold uppercase tracking-wider mb-1">Available Balance</p>
                  <h3 className="text-[#0A0A0A] text-3xl font-extrabold tracking-tight">${wallets.length > 0 ? wallets.reduce((sum, w) => sum + w.balance, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : netIncome.toLocaleString()}</h3>
                </div>
                
                <div className="flex justify-between items-end">
                  <div className="text-[#0A0A0A]/80 font-semibold tracking-widest text-sm font-mono">
                    {wallets.length > 0 ? (wallets[0].address.length > 12 ? `${wallets[0].address.slice(0,6)}...${wallets[0].address.slice(-4)}` : wallets[0].address) : '**** **** **** ****'}
                  </div>
                  <div className="text-[#0A0A0A] font-bold text-sm">
                    {wallets.length > 0 ? `${wallets.length} wallet${wallets.length > 1 ? 's' : ''}` : 'No wallets'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1" />

          {/* QUICK ACTIONS */}
          <div className="bg-[#131316] border border-[#222226] rounded-3xl p-6 mt-8 force-dark-card shadow-2xl">
            <h3 className="text-sm font-bold text-zinc-100 mb-6">Global Activity</h3>
            
            <div className="space-y-4">
              <button 
                onClick={() => setShowAdd(true)}
                className="w-full flex justify-between items-center bg-[#D4FE44] text-[#0A0A0A] p-4 rounded-2xl font-bold text-sm shadow-[0_10px_30px_rgba(212,254,68,0.2)] hover:-translate-y-1 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-[#0A0A0A]/10 rounded-lg">
                    <Plus size={16} strokeWidth={2.5} />
                  </div>
                  New Transaction
                </div>
                <ChevronRight size={18} className="opacity-50" />
              </button>
              
              <button 
                onClick={() => setShowTransfer(true)}
                className="w-full flex justify-between items-center text-zinc-200 border border-white/5 bg-white/5 hover:bg-white/10 p-4 rounded-2xl font-semibold text-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white/10 rounded-lg text-zinc-300">
                    <ArrowUpRight size={16} />
                  </div>
                  Transfer Funds
                </div>
                <span className="text-xs font-mono text-[#D4FE44] bg-[#D4FE44]/10 px-2.5 py-1 rounded-md border border-[#D4FE44]/20 items-center justify-center">Bank</span>
              </button>

              <button 
                onClick={() => setShowTransferToWeb2(true)}
                className="w-full flex justify-between items-center text-zinc-200 border border-emerald-500/10 bg-emerald-500/5 hover:bg-emerald-500/10 p-4 rounded-2xl font-semibold text-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400">
                    <ArrowRightLeft size={16} />
                  </div>
                  Transfer Crypto
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 items-center justify-center">Web3</span>
              </button>
            </div>
          </div>

        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#131316] border-t border-[#222226] z-50 flex items-center justify-around px-4 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
         <button onClick={() => setActiveTab('Dashboard')} className={cn("p-2 flex flex-col items-center gap-1 transition-colors", activeTab === 'Dashboard' ? "text-[#D4FE44]" : "text-zinc-500")}><Home size={20} /><span className="text-[10px] font-semibold">Home</span></button>
         <button onClick={() => setActiveTab('Analytics')} className={cn("p-2 flex flex-col items-center gap-1 transition-colors", activeTab === 'Analytics' ? "text-[#D4FE44]" : "text-zinc-500")}><PieChart size={20} /><span className="text-[10px] font-semibold">Stats</span></button>
         <button onClick={() => setShowAdd(true)} className="p-3 bg-[#D4FE44] rounded-full text-black -mt-6 border-4 border-[#09090B] shadow-[0_0_20px_rgba(212,254,68,0.2)] hover:scale-105 transition-transform"><Plus size={24} strokeWidth={2.5}/></button>
         <button onClick={() => setActiveTab('Cards')} className={cn("p-2 flex flex-col items-center gap-1 transition-colors", activeTab === 'Cards' ? "text-[#D4FE44]" : "text-zinc-500")}><CreditCard size={20} /><span className="text-[10px] font-semibold">Cards</span></button>
         <button onClick={() => setActiveTab('Settings')} className={cn("p-2 flex flex-col items-center gap-1 transition-colors", activeTab === 'Settings' ? "text-[#D4FE44]" : "text-zinc-500")}><Settings size={20} /><span className="text-[10px] font-semibold">Profile</span></button>
      </div>

      {/* MODALS */}
      {showAdd && <EntryModal 
        onClose={() => setShowAdd(false)} 
        mode={mode}
        bankCards={bankCards.map(c => ({ id: c.id, name: c.name, last4: c.last4 }))}
        wallets={wallets.map(w => ({ id: w.id, name: w.name, address: w.address }))}
        onSave={async (entryData) => {
        const newEntry = { ...entryData, id: Math.random().toString(36).substr(2, 9), mode };
        setEntries(prev => [newEntry, ...prev]);
        // Update card/wallet balance
        if (newEntry.walletId) {
          const delta = (newEntry.earned || 0) - (newEntry.given || 0);
          if (mode === 'banks') {
            setBankCards(prev => prev.map(c => {
              if (c.id === newEntry.walletId) {
                const newBal = Math.max(0, c.balance + delta);
                fetch(`/api/cards/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ balance: newBal }) }).catch(() => {});
                return { ...c, balance: newBal };
              }
              return c;
            }));
          } else {
            setWallets(prev => prev.map(w => {
              if (w.id === newEntry.walletId) {
                const newBal = Math.max(0, w.balance + delta);
                // Persist to API
                fetch(`/api/wallets/${w.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ balance: newBal }) }).catch(() => {});
                return { ...w, balance: newBal };
              }
              return w;
            }));
          }
        }
        setShowAdd(false);
        try {
          await fetch("/api/entries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newEntry),
          });
        } catch (err) {
          console.error("[addEntry] failed:", err);
        }
        fetchActivity();
      }} />}

      {editingEntry && <EditModal
        entry={editingEntry}
        onClose={() => setEditingEntry(null)}
        mode={mode}
        bankCards={bankCards.map(c => ({ id: c.id, name: c.name, last4: c.last4 }))}
        wallets={wallets.map(w => ({ id: w.id, name: w.name, address: w.address }))}
        onSave={async (updatedEntry) => {
          setEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
          setEditingEntry(null);
          try {
            await fetch(`/api/entries/${updatedEntry.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updatedEntry),
            });
          } catch (err) {
            console.error("[editEntry] failed:", err);
          }
          fetchActivity();
        }}
      />}

      {showTransfer && <TransferModal onClose={() => setShowTransfer(false)} onTransfer={async (amount, fromCardId, toCardId) => {
        const from = bankCards.find(c => c.id === fromCardId)?.name || "Card";
        const to = bankCards.find(c => c.id === toCardId)?.name || "Card";
        // Update card balances & persist
        setBankCards(prev => prev.map(c => {
          if (c.id === fromCardId) {
            const newBal = Math.max(0, c.balance - amount);
            fetch(`/api/cards/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ balance: newBal }) }).catch(() => {});
            return { ...c, balance: newBal };
          }
          if (c.id === toCardId) {
            const newBal = c.balance + amount;
            fetch(`/api/cards/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ balance: newBal }) }).catch(() => {});
            return { ...c, balance: newBal };
          }
          return c;
        }));
        // Create transfer entries
        const fromEntry = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString().split('T')[0],
            project: `Transfer: ${from} → ${to}`,
            earned: 0, saved: 0, given: amount,
            givenTo: "Transfer", mode: "banks" as const, walletId: fromCardId,
        };
        const toEntry = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString().split('T')[0],
            project: `Received: ${from} → ${to}`,
            earned: amount, saved: 0, given: 0,
            givenTo: "Transfer", mode: "banks" as const, walletId: toCardId,
        };
        setEntries(prev => [fromEntry, toEntry, ...prev]);
        // Save both to API
        try {
          await fetch("/api/entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fromEntry) });
          await fetch("/api/entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(toEntry) });
        } catch (err) { console.error("[bankTransfer] save failed:", err); }
        fetchActivity();
      }} />}
      
      {showTransferToWeb2 && <TransferToWeb2Modal 
        onClose={() => setShowTransferToWeb2(false)} 
        bankCards={bankCards.map(c => ({ id: c.id, name: c.name, last4: c.last4, balance: c.balance }))}
        wallets={wallets.map(w => ({ id: w.id, name: w.name, address: w.address, balance: w.balance }))}
        onTransfer={async (amount, cardId, walletId) => {
        // Add to bank card balance & persist
        setBankCards(prev => prev.map(c => {
          if (c.id === cardId) {
            const newBal = c.balance + amount;
            fetch(`/api/cards/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ balance: newBal }) }).catch(() => {});
            return { ...c, balance: newBal };
          }
          return c;
        }));
        // Deduct from crypto wallet balance & persist
        setWallets(prev => prev.map(w => {
          if (w.id === walletId) {
            const newBal = Math.max(0, w.balance - amount);
            fetch(`/api/wallets/${w.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ balance: newBal }) }).catch(() => {});
            return { ...w, balance: newBal };
          }
          return w;
        }));
        const cardName = bankCards.find(c => c.id === cardId)?.name || 'Bank Card';
        const walletName = wallets.find(w => w.id === walletId)?.name || 'Crypto Wallet';
        const cryptoId = Math.random().toString(36).substr(2, 9);
        const bankId = Math.random().toString(36).substr(2, 9);
        const today = new Date().toISOString().split('T')[0];
        
        // Create crypto entry (shown in crypto mode)
        const cryptoEntry = {
            id: cryptoId, date: today,
            project: `Off-Ramp → ${cardName}`, earned: 0, saved: 0, given: amount,
            givenTo: cardName, mode: "crypto" as const, walletId: walletId,
        };
        // Create bank entry (shown in banks mode)
        const bankEntry = {
            id: bankId, date: today,
            project: `Received from ${walletName}`, earned: amount, saved: 0, given: 0,
            givenTo: "Crypto Off-Ramp", mode: "banks" as const, walletId: cardId,
        };
        
        setEntries(prev => [cryptoEntry, bankEntry, ...prev]);
        
        // Save BOTH entries to API so they persist across mode switches
        try {
          await fetch("/api/entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cryptoEntry) });
          await fetch("/api/entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bankEntry) });
        } catch (err) { console.error("[transferToBank] save failed:", err); }
        fetchActivity();
      }} />}
      
      {deletingTransactionId && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#131316] border border-[#222226] max-w-sm w-full rounded-3xl p-6 shadow-2xl relative text-center">
            <Trash2 size={40} className="text-red-500 mx-auto mb-4 opacity-90" strokeWidth={1.5} />
            <h3 className="text-xl font-bold text-zinc-100 mb-2">Delete Transaction?</h3>
            <p className="text-zinc-400 text-sm mb-8">This action cannot be undone. Are you sure you want to permanently delete this transaction?</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setDeletingTransactionId(null)}
                className="flex-1 py-3 bg-[#1C1C21] hover:bg-[#222226] text-zinc-300 rounded-xl font-semibold text-sm border border-[#2A2A30] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  const id = deletingTransactionId;
                  // Reverse balance change
                  const entry = entries.find(e => e.id === id);
                  if (entry?.walletId) {
                    const delta = -((entry.earned || 0) - (entry.given || 0));
                    if (entry.mode === 'banks') {
                      setBankCards(prev => prev.map(c => {
                        if (c.id === entry.walletId) {
                          const newBal = Math.max(0, c.balance + delta);
                          fetch(`/api/cards/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ balance: newBal }) }).catch(() => {});
                          return { ...c, balance: newBal };
                        }
                        return c;
                      }));
                    } else {
                      setWallets(prev => prev.map(w => {
                        if (w.id === entry.walletId) {
                          const newBal = Math.max(0, w.balance + delta);
                          fetch(`/api/wallets/${w.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ balance: newBal }) }).catch(() => {});
                          return { ...w, balance: newBal };
                        }
                        return w;
                      }));
                    }
                  }
                  setEntries(prev => prev.filter(e => e.id !== id));
                  setDeletingTransactionId(null);
                  try {
                    await fetch(`/api/entries/${id}`, { method: "DELETE" });
                  } catch (err) {
                    console.error("[delete] failed:", err);
                  }
                  fetchActivity();
                }}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm shadow-[0_5px_20px_rgba(239,68,68,0.3)] transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Wallet Modal */}
      {showAddWallet && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#131316] border border-[#222226] max-w-md w-full rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-zinc-100">Add Wallet</h3>
              <button onClick={() => setShowAddWallet(false)} className="w-8 h-8 rounded-full bg-[#1C1C21] flex items-center justify-center text-zinc-400 hover:text-white"><X size={16}/></button>
            </div>
            {walletError && <div className="px-3 py-2 rounded-lg text-xs font-medium border bg-red-500/10 text-red-500 border-red-500/20 mb-4">{walletError}</div>}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Wallet Name</label>
                <input value={walletForm.name} onChange={e => setWalletForm({...walletForm, name: e.target.value})} placeholder="e.g. MetaMask, Ledger" className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Wallet Address</label>
                <input value={walletForm.address} onChange={e => setWalletForm({...walletForm, address: e.target.value})} placeholder="0x... or Solana address" className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors font-mono text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Network</label>
                  <select value={walletForm.network} onChange={e => setWalletForm({...walletForm, network: e.target.value})} className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors">
                    <option value="Ethereum">Ethereum</option>
                    <option value="Solana">Solana</option>
                    <option value="Bitcoin">Bitcoin</option>
                    <option value="Polygon">Polygon</option>
                    <option value="Arbitrum">Arbitrum</option>
                    <option value="Base">Base</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Balance (USD)</label>
                  <input type="number" step="0.01" value={walletForm.balance} onChange={e => setWalletForm({...walletForm, balance: e.target.value})} placeholder="0.00" className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors" />
                </div>
              </div>
              <div className="bg-[#09090B] border border-[#222226] rounded-xl p-4 flex items-center gap-3">
                <Shield size={18} className="text-amber-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-200">Encrypt Address</p>
                  <p className="text-xs text-zinc-500">Hide wallet address behind your passcode</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={walletForm.encrypt || false} onChange={e => { setWalletForm({...walletForm, encrypt: e.target.checked}); if (!e.target.checked) setEncryptPasscode(''); }} className="sr-only peer" />
                  <div className="w-9 h-5 bg-[#222226] rounded-full peer peer-checked:bg-[#D4FE44] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
              {walletForm.encrypt && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-2">
                  <label className="text-xs font-medium text-amber-400">Enter Passcode to Encrypt</label>
                  <input type="password" maxLength={6} value={encryptPasscode} onChange={e => setEncryptPasscode(e.target.value)} placeholder="••••••" className="w-full bg-[#09090B] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-400 transition-colors font-mono tracking-widest text-center" />
                  <p className="text-[10px] text-zinc-500">You'll need this passcode to reveal the address later.</p>
                </div>
              )}
            </div>
            <button onClick={async () => {
              setWalletError('');
              if (!walletForm.name.trim()) { setWalletError('Wallet name is required.'); return; }
              if (!walletForm.address.trim()) { setWalletError('Wallet address is required.'); return; }
              const bal = parseFloat(walletForm.balance) || 0;
              const doEncrypt = walletForm.encrypt || false;
              try {
                let payload: any = {
                  name: walletForm.name.trim(),
                  address: walletForm.address.trim(),
                  network: walletForm.network,
                  balance: bal,
                };
                if (doEncrypt) {
                  if (!encryptPasscode || encryptPasscode.length !== 6) { setWalletError('Enter a 6-digit passcode to encrypt.'); return; }
                  const { encryptData } = await import('./utils/encryption');
                  const encrypted = await encryptData(walletForm.address.trim(), encryptPasscode);
                  payload = {
                    ...payload,
                    address: walletForm.address.trim().slice(0, 4) + '••••••••' + walletForm.address.trim().slice(-4),
                    isEncrypted: true,
                    encryptedData: encrypted,
                  };
                }
                const res = await fetch('/api/wallets', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                setShowAddWallet(false);
                setWalletForm({ name: '', address: '', network: 'Ethereum', balance: '', encrypt: false });
                fetchWallets();
                fetchActivity();
              } catch (err: any) { setWalletError('Failed to add wallet: ' + err.message); }
            }} className="w-full py-3 mt-6 bg-[#D4FE44] text-[#0A0A0A] rounded-xl font-bold text-sm hover:bg-[#bceb29] transition-colors">
              Add Wallet
            </button>
          </div>
        </div>
      )}

      {/* Delete Wallet Modal */}
      {deletingWalletId && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#131316] border border-[#222226] max-w-sm w-full rounded-3xl p-6 shadow-2xl relative text-center">
            <Trash2 size={40} className="text-red-500 mx-auto mb-4 opacity-90" strokeWidth={1.5} />
            <h3 className="text-xl font-bold text-zinc-100 mb-2">Delete Wallet?</h3>
            <p className="text-zinc-400 text-sm mb-8">This will permanently remove this wallet from your dashboard.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeletingWalletId(null)} className="flex-1 py-3 bg-[#1C1C21] hover:bg-[#222226] text-zinc-300 rounded-xl font-semibold text-sm border border-[#2A2A30] transition-colors">Cancel</button>
              <button onClick={async () => {
                const id = deletingWalletId;
                setDeletingWalletId(null);
                setWallets(prev => prev.filter(w => w.id !== id));
                try { await fetch(`/api/wallets/${id}`, { method: 'DELETE' }); } catch {}
                fetchWallets();
                fetchActivity();
              }} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm shadow-[0_5px_20px_rgba(239,68,68,0.3)] transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#131316] border border-[#222226] max-w-md w-full rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-zinc-100">Add Card</h3>
              <button onClick={() => setShowAddCard(false)} className="w-8 h-8 rounded-full bg-[#1C1C21] flex items-center justify-center text-zinc-400 hover:text-white"><X size={16}/></button>
            </div>
            {cardError && <div className="px-3 py-2 rounded-lg text-xs font-medium border bg-red-500/10 text-red-500 border-red-500/20 mb-4">{cardError}</div>}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Card Name</label>
                <input value={cardForm.name} onChange={e => setCardForm({...cardForm, name: e.target.value})} placeholder="e.g. Chase Debit, Savings" className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Last 4 Digits</label>
                  <input maxLength={4} value={cardForm.last4} onChange={e => setCardForm({...cardForm, last4: e.target.value.replace(/\D/g, '')})} placeholder="4209" className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors font-mono" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Expiry</label>
                  <input maxLength={5} value={cardForm.expiry} onChange={e => setCardForm({...cardForm, expiry: e.target.value})} placeholder="MM/YY" className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors font-mono" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Card Type</label>
                <select value={cardForm.type} onChange={e => setCardForm({...cardForm, type: e.target.value as 'physical' | 'virtual'})} className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors">
                  <option value="physical">Physical</option>
                  <option value="virtual">Virtual</option>
                </select>
              </div>
            </div>
            <button onClick={async () => {
              setCardError('');
              if (!cardForm.name.trim()) { setCardError('Card name is required.'); return; }
              if (cardForm.last4.length !== 4) { setCardError('Last 4 digits must be exactly 4 numbers.'); return; }
              if (!cardForm.expiry.match(/^\d{2}\/\d{2}$/)) { setCardError('Expiry must be MM/YY format.'); return; }
              const cardData = {
                name: cardForm.name.trim(),
                last4: cardForm.last4,
                holder: `${firstName} ${lastName}`,
                expiry: cardForm.expiry,
                type: cardForm.type,
                balance: 0,
              };
              try {
                const res = await fetch('/api/cards', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(cardData),
                });
                if (res.ok) {
                  const saved = await res.json();
                  setBankCards(prev => [...prev, saved]);
                  fetchActivity();
                }
              } catch (err) { console.error("[addCard] failed:", err); }
              setShowAddCard(false);
              setCardForm({ name: '', last4: '', expiry: '', type: 'virtual' });
            }} className="w-full py-3 mt-6 bg-[#D4FE44] text-[#0A0A0A] rounded-xl font-bold text-sm hover:bg-[#bceb29] transition-colors">
              Add Card
            </button>
          </div>
        </div>
      )}

      {/* Delete Card Modal */}
      {deletingCardId && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#131316] border border-[#222226] max-w-sm w-full rounded-3xl p-6 shadow-2xl relative text-center">
            <Trash2 size={40} className="text-red-500 mx-auto mb-4 opacity-90" strokeWidth={1.5} />
            <h3 className="text-xl font-bold text-zinc-100 mb-2">Delete Card?</h3>
            <p className="text-zinc-400 text-sm mb-8">This will permanently remove this card.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeletingCardId(null)} className="flex-1 py-3 bg-[#1C1C21] hover:bg-[#222226] text-zinc-300 rounded-xl font-semibold text-sm border border-[#2A2A30] transition-colors">Cancel</button>
              <button onClick={async () => {
                const id = deletingCardId;
                setBankCards(prev => prev.filter(c => c.id !== id));
                setDeletingCardId(null);
                try { await fetch(`/api/cards/${id}`, { method: 'DELETE' }); } catch {}
                fetchActivity();
              }} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm shadow-[0_5px_20px_rgba(239,68,68,0.3)] transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Decrypt Wallet Modal */}
      {decryptingWalletId && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#131316] border border-[#222226] max-w-sm w-full rounded-3xl p-6 shadow-2xl">
            <div className="text-center mb-6">
              <Lock size={40} className="text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-zinc-100 mb-2">Decrypt Wallet</h3>
              <p className="text-zinc-400 text-sm">Enter your 6-digit passcode to reveal the wallet address.</p>
            </div>
            <input type="password" maxLength={6} value={decryptPasscode} onChange={e => setDecryptPasscode(e.target.value)} placeholder="••••••" className="w-full bg-[#09090B] border border-[#222226] rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none focus:border-[#D4FE44] transition-colors font-mono tracking-widest text-center mb-4" />
            <div className="flex gap-4">
              <button onClick={() => { setDecryptingWalletId(null); setDecryptPasscode(''); }} className="flex-1 py-3 bg-[#1C1C21] hover:bg-[#222226] text-zinc-300 rounded-xl font-semibold text-sm border border-[#2A2A30] transition-colors">Cancel</button>
              <button onClick={async () => {
                try {
                  // Fetch wallet to get encrypted data
                  const walletRes = await fetch(`/api/wallets/${decryptingWalletId}`);
                  if (!walletRes.ok) throw new Error('Wallet not found');
                  const wallet = await walletRes.json();
                  if (!wallet.encryptedData) throw new Error('No encrypted data');
                  
                  // Decrypt client-side
                  const { decryptData } = await import('./utils/encryption');
                  const decryptedAddress = await decryptData(
                    wallet.encryptedData.encryptedData,
                    decryptPasscode,
                    wallet.encryptedData.salt,
                    wallet.encryptedData.iv
                  );
                  
                  // Update wallet to remove encryption and restore real address
                  const updateRes = await fetch(`/api/wallets/${decryptingWalletId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      address: decryptedAddress,
                      isEncrypted: false,
                    }),
                  });
                  
                  if (updateRes.ok) {
                    setDecryptingWalletId(null);
                    setDecryptPasscode('');
                    fetchWallets();
                  } else {
                    alert('Failed to save decrypted wallet.');
                  }
                } catch (err: any) {
                  alert('Decryption failed: wrong passcode or corrupted data.');
                }
              }} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all">Decrypt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
