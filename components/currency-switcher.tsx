"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DollarSign } from "lucide-react"
import type { Currency } from "@/lib/types"

const CURRENCY_KEY = "sedra_currency"

export function CurrencySwitcher() {
  const [currency, setCurrency] = useState<Currency>("USD")

  useEffect(() => {
    const saved = localStorage.getItem(CURRENCY_KEY)
    setCurrency(saved === "SYP" ? "SYP" : "USD")
  }, [])

  const currencies = [
    { code: "USD" as const, label: "دولار أمريكي", symbol: "$" },
    { code: "SYP" as const, label: "ليرة سورية", symbol: "ل.س" },
  ]

  const currentCurrency = currencies.find((c) => c.code === currency)

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency)
    localStorage.setItem(CURRENCY_KEY, newCurrency)
    window.dispatchEvent(new Event("currencyChanged"))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-sm">
          <DollarSign className="h-4 w-4" />
          <span className="hidden sm:inline">{currentCurrency?.label}</span>
          <span className="sm:hidden">{currency}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currencies.map((c) => (
          <DropdownMenuItem
            key={c.code}
            onClick={() => handleCurrencyChange(c.code)}
            className={currency === c.code ? "bg-primary/10" : ""}
          >
            <span className="ms-2 font-medium">{c.symbol}</span>
            {c.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
