"use client"
import { useState, useEffect } from "react"

interface Rates {
  [key: string]: number
}

const CACHE_KEY = "fv_exchangeRates"
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

export function useExchangeRates() {
  const [rates, setRates] = useState<Rates>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRates() {
      try {
        // Check cache first
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          if (Date.now() - timestamp < CACHE_DURATION) {
            setRates(data)
            setLoading(false)
            return
          }
        }

        // Fetch fresh rates from free API (no key needed)
        const res = await fetch("https://open.er-api.com/v6/latest/USD")
        const data = await res.json()
        
        if (data.rates) {
          setRates(data.rates)
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: data.rates,
            timestamp: Date.now()
          }))
        }
      } catch (err) {
        console.error("Failed to fetch exchange rates:", err)
        // Fallback rates if API fails
        setRates({ INR: 85, EUR: 0.92, GBP: 0.79, JPY: 150, USD: 1 })
      }
      setLoading(false)
    }

    fetchRates()
  }, [])

  const convert = (usdAmount: number, toCurrency: string): number => {
    if (toCurrency === "USD") return usdAmount
    const rate = rates[toCurrency] || 1
    return usdAmount * rate
  }

  const formatCurrency = (usdAmount: number, currency: string): string => {
    const converted = convert(usdAmount, currency)
    const symbols: Record<string, string> = {
      USD: "$", INR: "₹", EUR: "€", GBP: "£", JPY: "¥"
    }
    const symbol = symbols[currency] || currency + " "
    return `${symbol}${converted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return { rates, loading, convert, formatCurrency }
}
