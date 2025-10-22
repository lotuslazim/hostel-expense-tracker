
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from 'date-fns/format';
import { addDays } from 'date-fns/addDays';
import { subDays } from 'date-fns/subDays';
import { isToday } from 'date-fns/isToday';
import dynamic from 'next/dynamic';
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";

const Calendar = dynamic(() => import('@/components/ui/calendar').then(mod => mod.Calendar), {
    ssr: false,
    loading: () => <div className="p-3"><Skeleton className="h-[280px] w-full" /></div>,
});


interface DateCardProps {
    date: Date;
    setDate: (date: Date) => void;
}

export function DateCard({ date, setDate }: DateCardProps) {
    const handlePrevDay = () => {
        setDate(subDays(date, 1));
    }

    const handleNextDay = () => {
        const nextDay = addDays(date, 1);
        if (nextDay > new Date()) {
            return; // Don't allow future dates
        }
        setDate(nextDay);
    }
    
    const isDateInFuture = date >= new Date() && !isToday(date);
    const isNextButtonDisabled = isToday(date) || isDateInFuture;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><CalendarDays /> Selected Date</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevDay}>
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous day</span>
                </Button>
                <Popover>
                    <PopoverTrigger asChild>
                         <Button
                            variant={"outline"}
                            className="w-full justify-center text-left font-normal"
                        >
                            <span>{format(date, "PPP")}</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(d) => d && setDate(d)}
                            disabled={(date) =>
                                date > new Date() || date < new Date("2000-01-01")
                            }
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
                <Button variant="outline" size="icon" onClick={handleNextDay} disabled={isNextButtonDisabled}>
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next day</span>
                </Button>
            </CardContent>
        </Card>
    );
}

    