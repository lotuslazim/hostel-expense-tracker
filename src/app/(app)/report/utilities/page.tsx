
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { parseISO, startOfMonth, endOfMonth, format, addMonths, subMonths, type Duration } from "date-fns";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, type Timestamp } from "firebase/firestore";
import type { Expense } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ChevronLeft, Users, Zap } from "lucide-react";
import { WelcomeCard } from "@/components/app/welcome-card";
import { Button } from "@/components/ui/button";
import { MonthSwitcher } from "@/components/report/month-switcher";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Define a specific type for member data used in this page
interface Member {
  id: string;
  displayName?: string;
  email: string;
}

interface UtilityPaymentInfo {
  id: string;
  name: string;
  totalPaid: number;
  electricity: number;
  gas: number;
}

function PageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10" />
                    <div>
                        <Skeleton className="h-9 w-72" />
                        <Skeleton className="h-4 w-96 mt-2" />
                    </div>
                </div>
                 <Skeleton className="h-10 w-[330px]" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/4" />
                </CardHeader>
                <CardContent>
                   <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

function DataError() {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error Loading Data</AlertTitle>
      <AlertDescription>
        There was a problem fetching the utility payments report. Please try again later.
      </AlertDescription>
    </Alert>
  );
}

export default function UtilityPaymentsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const monthParam = searchParams.get('month');

    const currentDate = useMemo(() => {
      if (monthParam) {
        try {
          const parsedDate = parseISO(`${monthParam}-01`);
          if (!isNaN(parsedDate.getTime())) {
            return startOfMonth(parsedDate);
          }
        } catch (e) {
          console.warn("Invalid date in URL, defaulting to current month.", e);
        }
      }
      return startOfMonth(new Date());
    }, [monthParam]);

    const { firestore } = useFirebase();
    const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();
    
    const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
    const { data: currentUserData, isLoading: isCurrentUserDataLoading, error: currentUserDataError } = useDoc(currentUserRef);
    const groupId = currentUserData?.groupId;

    const monthDateRange = useMemo(() => ({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
    }), [currentDate]);

    const membersQuery = useMemo(() =>
        (groupId ? collection(firestore, `groups/${groupId}/members`) : null),
        [firestore, groupId]
    );

    const expensesQuery = useMemo(() =>
        (groupId ? query(
            collection(firestore, `groups/${groupId}/expenses`),
            where("date", ">=", monthDateRange.start),
            where("date", "<=", monthDateRange.end),
            where("category", "in", ["Electricity", "Gas"])
        ) : null),
        [firestore, groupId, monthDateRange]
    );

    const { data: membersData, isLoading: areMembersLoading, error: membersError } = useCollection<Member>(membersQuery);
    const { data: expensesData, isLoading: areExpensesLoading, error: expensesError } = useCollection<Expense>(expensesQuery);


    const processedData: UtilityPaymentInfo[] = useMemo(() => {
        if (!membersData || !expensesData) {
            return [];
        }

        return membersData.map((member) => {
            const memberExpenses = expensesData.filter(exp => exp.userId === member.id);
            
            const electricity = memberExpenses
                .filter(exp => exp.category === 'Electricity')
                .reduce((sum, exp) => sum + exp.amount, 0);

            const gas = memberExpenses
                .filter(exp => exp.category === 'Gas')
                .reduce((sum, exp) => sum + exp.amount, 0);

            return {
                id: member.id,
                name: member.displayName || member.email?.split('@')[0] || 'Unknown Member',
                totalPaid: electricity + gas,
                electricity,
                gas
            };
        }).sort((a,b) => b.totalPaid - a.totalPaid);

    }, [expensesData, membersData]);

    const handleMonthChange = (direction: "next" | "prev") => {
        const newDate = direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
        const newUrl = `/report/utilities?month=${format(newDate, 'yyyy-MM')}`;
        router.push(newUrl, { scroll: false });
    };

    const handleBack = () => {
        if (window.history.length > 1) {
            router.back();
        } else {
            router.push('/dashboard');
        }
    };

    const isLoading = isCurrentUserLoading || isCurrentUserDataLoading;
    if (isLoading) {
        return <PageSkeleton />;
    }
    
    if (!groupId) {
        return <WelcomeCard />;
    }

    const isDataLoading = areMembersLoading || areExpensesLoading;
    const hasError = currentUserDataError || membersError || expensesError;
    
    if (isDataLoading) return <PageSkeleton />;
    if (hasError) return <DataError />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" onClick={handleBack}>
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight font-headline">Utility Payments Report</h1>
                        <p className="text-muted-foreground">
                            A summary of utility bills paid by each member in {format(currentDate, "MMMM yyyy")}.
                        </p>
                    </div>
                </div>
                <MonthSwitcher currentDate={currentDate} onMonthChange={handleMonthChange} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" /> 
                        Utility Contributions
                    </CardTitle>
                    <CardDescription>
                        Total electricity and gas bills paid by each member for the month.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead><Badge variant="secondary">Electricity</Badge></TableHead>
                                <TableHead><Badge variant="secondary">Gas</Badge></TableHead>
                                <TableHead className="text-right">Total Paid</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {processedData.length > 0 ? processedData.map(member => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">{member.name}</TableCell>
                                    <TableCell>৳{member.electricity.toFixed(2)}</TableCell>
                                    <TableCell>৳{member.gas.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-semibold">৳{member.totalPaid.toFixed(2)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Users className="h-8 w-8 text-muted-foreground" />
                                            <p className="text-muted-foreground">No utility payments logged this month.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                   </Table>
                </CardContent>
            </Card>
        </div>
    );
}
