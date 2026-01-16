import * as React from "react"

import { cn } from "@/lib/utils"

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  /**
   * The currency symbol to display. Defaults to "R$" for Brazilian Real.
   */
  currencySymbol?: string
}

function CurrencyInput({
  className,
  currencySymbol = "R$",
  ...props
}: CurrencyInputProps) {
  return (
    <div className="relative flex items-center">
      <span className="absolute left-3 text-muted-foreground text-sm pointer-events-none select-none">
        {currencySymbol}
      </span>
      <input
        type="number"
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent py-1 pr-3 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          "pl-10", // Add padding for the currency symbol
          className
        )}
        step="0.01"
        min="0"
        {...props}
      />
    </div>
  )
}

export { CurrencyInput }
