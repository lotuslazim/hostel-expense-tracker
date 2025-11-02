"use client"

import { Button } from "@/components/ui/button"
import { Logo } from "@/components/icons/logo"
import Link from "next/link"

export default function Home() {

  return (
    <header className="relative h-[95vh] header-bg bg-cover bg-top">
      <div className="absolute top-16 left-16 animate-[moveInRight_1s_ease-out]">
        <Logo />
      </div>

      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="text-[#ececec] uppercase text-center mb-16">
            <span className="block text-6xl font-normal tracking-[3.5rem] animate-[moveInLeft_1s_ease-in]">
              BachelorBite
            </span>
            <span className="block text-xl font-bold tracking-[1.75rem] animate-[moveInRight_1s_ease-out]">
              is where life happens
            </span>
        </div>
        <Button asChild className="uppercase text-lg px-12 py-7 rounded-md relative transition-all duration-200 text-gray-700 bg-white hover:translate-y-[-5px] hover:shadow-[0_1rem_2rem_rgba(0,0,0,0.4)] active:translate-y-[-1px] active:shadow-[0_1rem_1rem_rgba(0,0,0,0.5)] after:content-[''] after:inline-block after:h-full after:w-full after:absolute after:top-0 after:left-0 after:z-[-1] after:rounded-md after:bg-white after:transition-all after:duration-700 hover:after:scale-x-150 hover:after:scale-y-150 hover:after:opacity-0 animate-[moveInBottom_1.5s_ease-in_0.5s_backwards]">
          <Link href="/signup">Get Started</Link>
        </Button>
      </div>
    </header>
  )
}
