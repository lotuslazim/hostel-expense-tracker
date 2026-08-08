"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { MoonIcon, SunIcon } from 'lucide-react';

import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <Skeleton className="h-6 w-11 rounded-full" />
  }

  const isDark = theme === 'dark';

  return (
    <div className="flex items-center space-x-2">
      <SunIcon className="h-5 w-5 text-muted-foreground" />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => {
          setTheme(checked ? 'dark' : 'light')
        }}
        id="dark-mode"
        aria-label="Toggle dark mode"
      />
      <MoonIcon className="h-5 w-5 text-muted-foreground" />
    </div>
  )
}
