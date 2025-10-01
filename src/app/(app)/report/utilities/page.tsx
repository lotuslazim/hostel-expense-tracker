
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, Timestamp } from "firebase/firestore";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import type { Expense } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Zap, AlertTriangle, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function UtilityPaymentsPage() {
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();

  const currentUserRef = useMemo(() => 
    currentUser ? doc(firestore, "users", currentUser.uid) : null, 
    [firestore, currentUser]
  );
  
  const { data: currentUserData, isLoading: isCurrentUserDataLoading, error: currentUserDataError } = useDoc(currentUserRef);
  const groupId = currentUserData?.groupId;

  const monthDateRange = useMemo(() => {
    const now = new Date();
    return {
      start: startOfMonth(now),
      end: endOfMonth(now),
    };
  }, []);

  // Query for group members
  const membersQuery = useMemo(() =>
    groupId ? collection(firestore, `groups/${groupId}/members`) : null,
    [firestore, groupId]
  );

  // Query for utility expenses (Electricity and Gas)
  const expensesQuery = useMemo(() =>
    groupId ? query(
      collection(firestore, `groups/${groupId}/expenses`),
      where("date", ">=", monthDateRange.start),
      where("date", "<=", monthDateRange.end),
      where("category", "in", ["Electricity", "Gas"])
    ) : null,
    [firestore, groupId, monthDateRange]
  );

  const { data: membersData, isLoading: areMembersLoading, error: membersError } = useCollection(membersQuery);
  const { data: expensesData, isLoading: areExpensesLoading, error: expensesError } = useCollection<Expense>(expensesQuery);

  const isAnyLoading = isCurrentUserLoading || isCurrentUserDataLoading || (!!groupId && (areMembersLoading || areExpensesLoading));
  const hasAnyErrors = currentUserDataError || membersError || expensesError;

  // CORRECTED data processing logic
  const processedData = useMemo(() => {
    if (!membersData || !expensesData) {
      return null;
    }

    // Calculate total utility expenses
    const totalUtilityExpenses = expensesData.reduce((sum, expense) => sum + expense.amount, 0);

    // Process each member with their specific utility expenses
    const processedMembers = membersData.map(member => {
      // Filter expenses that belong to this specific member
      const memberUtilityExpenses = expensesData.filter(expense => 
        expense.userId === member.id && 
        (expense.category === 'Electricity' || expense.category === 'Gas')
      );

      // Calculate total paid by this member
      const totalPaid = memberUtilityExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      const toDate = (date: Date | Timestamp): Date => {
        return date instanceof Date ? date : (date as Timestamp).toDate();
      }

      return {
        id: member.id,
        name: member.displayName || member.email?.split('@')[0] || 'Unknown User',
        totalPaid,
        memberUtilityExpenses: memberUtilityExpenses.sort((a, b) => 
          toDate(b.date).getTime() - toDate(a.date).getTime()
        ),
      };
    });

    return {
      processedMembers,
      totalUtilityExpenses,
    };
  }, [membersData, expensesData]);

  if (isAnyLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
            <Zap className="h-6 w-6" />
            <Skeleton className="h-9 w-64" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (hasAnyErrors) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Utility Payments</AlertTitle>
          <AlertDescription>
            There was a problem fetching the utility payment data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!processedData) {
    return (
      <div className="container mx-auto py-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            No utility payment data found for the current month.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { processedMembers, totalUtilityExpenses } = processedData;
  const averageShare = processedMembers.length > 0 ? totalUtilityExpenses / processedMembers.length : 0;
  
  const toDate = (date: Date | Timestamp): Date => {
    return date instanceof Date ? date : (date as Timestamp).toDate();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Zap className="h-6 w-6" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">Utility Payments Report</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Monthly Utility Summary</CardTitle>
          <CardDescription>
            Utility payments for {format(new Date(), 'MMMM yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Members</p>
              <p className="text-2xl font-bold ">{processedMembers.length}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Utility Expenses</p>
              <p className="text-2xl font-bold ">৳{totalUtilityExpenses.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Average per Member</p>
              <p className="text-2xl font-bold ">
                ৳{averageShare.toFixed(2)}
              </p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedMembers.length > 0 ? (
                processedMembers.map((member) => {
                  const balance = member.totalPaid - averageShare;

                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>৳{member.totalPaid.toFixed(2)}</TableCell>
                      <TableCell className={balance >= 0 ? "text-green-600" : "text-red-600"}>
                        {balance >= 0 ? `Gets: ৳${balance.toFixed(2)}` : `Owes: ৳${Math.abs(balance).toFixed(2)}`}
                      </TableCell>
                      <TableCell className="text-right">
                        {member.memberUtilityExpenses.length > 0 ? (
                          <div className="space-y-2">
                            {member.memberUtilityExpenses.map((expense) => (
                              <div key={expense.id} className="flex justify-end items-center gap-4 text-sm">
                                <Badge variant="outline" className="text-xs">
                                  {expense.category}
                                </Badge>
                                <span>৳{expense.amount.toFixed(2)}</span>
                                <span className="text-muted-foreground">
                                  {format(toDate(expense.date), 'MMM d')}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No payments</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No members found in the group.</p>
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
