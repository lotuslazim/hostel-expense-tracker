
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays } from "lucide-react";

interface DateCardProps {
    date: Date;
    setDate: (date: Date) => void;
}

export function DateCard({ date, setDate }: DateCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarDays /> Select Date</CardTitle>
                <CardDescription>
                    Choose the date for your meal and expense entries.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    disabled={(date) =>
                        date > new Date() || date < new Date("2000-01-01")
                    }
                    className="rounded-md"
                />
            </CardContent>
        </Card>
    );
}
