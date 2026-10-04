"use client";

import { useMemo, useState, useEffect } from "react";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, Timestamp, setDoc, serverTimestamp, getDocs, getDoc, orderBy, limit } from "firebase/firestore";
import { format, getMonth, getYear, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import type { MealLog, Expense, Settlement, Member } from "@/lib/types";
import { computeElectricityShares, type LeaveRecord } from "@/lib/electricity-split";
import { WelcomeCard } from "@/components/app/welcome-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, Scale, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ProcessedMember {
  id: string;
  name: string;
  photoURL?: string;
  totalPaid: number;
  totalShare: number;
  balance: number;
  isSettled?: boolean;
  settlementDetails?: Settlement;
}

interface MonthlyRecord {
  month: Date;
  processedMembers: ProcessedMember[];
  totalGroupExpenses: number;
  mealRate: number;
}

function HistorySkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-7 w-48" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

function SettleUpDialog({ member, month, year, groupId, currentUserId, members, currentUserIsAdmin }: { member: ProcessedMember; month: number; year: number; groupId: string, currentUserId: string, members: ProcessedMember[], currentUserIsAdmin: boolean }) {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [settlementMethod, setSettlementMethod] = useState("");
    const [settledTo, setSettledTo] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [open, setOpen] = useState(false);

    const membersToPay = members.filter(m => m.id !== member.id);

    const handleSettleUp = async () => {
        if (!settlementMethod || !settledTo) {
            toast({ variant: 'destructive', title: 'Please fill all fields.' });
            return;
        }

        setIsSaving(true);
        const settlementId = `${member.id}-${month}-${year}`;
        const settlementRef = doc(firestore, `groups/${groupId}/settlements/${settlementId}`);
        
        try {
            await setDoc(settlementRef, {
                groupId,
                userId: member.id,
                month,
                year,
                settledAt: serverTimestamp(),
                settlementMethod,
                settledTo,
            });
            toast({ title: "Balance Settled!", description: `Settlement for ${member.name} has been recorded.` });
            setOpen(false);
        } catch (error) {
            console.error("Error settling up:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save settlement.' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const canSettle = currentUserIsAdmin || currentUserId === member.id;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" disabled={!canSettle}>Settle Up</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Settle Balance for {member.name}</DialogTitle>
                    <DialogDescription>
                        Confirm how this member paid their balance for the month.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                     <div className="space-y-2">
                        <label htmlFor="settledTo">Who was paid?</label>
                         <select
                            id="settledTo"
                            value={settledTo}
                            onChange={(e) => setSettledTo(e.target.value)}
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="" disabled>Select a member</option>
                            {membersToPay.map(m => (
                                <option key={m.id} value={m.name}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="paymentMethod">How was it paid?</label>
                        <Textarea
                            id="paymentMethod"
                            placeholder="e.g., Paid in cash, Sent via bKash"
                            value={settlementMethod}
                            onChange={(e) => setSettlementMethod(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSettleUp} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Settlement
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function SettlementHistory() {
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading } = useUser();
  const [history, setHistory] = useState<MonthlyRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);
  const groupId = currentUserData?.groupId;
  const currentUserIsAdmin = currentUserData?.isAdmin ?? false;

  useEffect(() => {
    if (!groupId) {
        setIsLoadingHistory(false);
        return;
    };

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        const monthlyRecords: MonthlyRecord[] = [];
        
        const groupCreationQuery = query(collection(firestore, `groups/${groupId}/members`), orderBy("joinedAt", "asc"), limit(1));
        const groupCreationSnapshot = await getDocs(groupCreationQuery);
        const firstJoinDate = groupCreationSnapshot.docs[0]?.data().joinedAt.toDate() || new Date();
        
        let leavesData: LeaveRecord[] = [];
        try {
            const leavesSnapshot = await getDocs(collection(firestore, `groups/${groupId}/leaves`));
            leavesData = leavesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as LeaveRecord));
        } catch (error) {
            console.error("Could not load leave records:", error);
        }

        // Names/photos: read each member's own user doc (listing all users is blocked by Rules).
        const profileMap: Record<string, any> = {};
        try {
            const allMembersSnapshot = await getDocs(collection(firestore, `groups/${groupId}/members`));
            await Promise.all(allMembersSnapshot.docs.map(async (memberDoc) => {
                const memberData = memberDoc.data() as any;
                let profile: any = null;
                try {
                    const snap = await getDoc(doc(firestore, "users", memberDoc.id));
                    profile = snap.exists() ? snap.data() : null;
                } catch {
                    profile = null;
                }
                profileMap[memberDoc.id] = {
                    id: memberDoc.id,
                    displayName: profile?.displayName || memberData.displayName || memberData.userName,
                    photoURL: profile?.photoURL || memberData.photoURL,
                    email: profile?.email || memberData.email,
                };
            }));
        } catch (error) {
            console.error("Could not load member profiles:", error);
        }

        let loopMonth = startOfMonth(new Date());

        while (loopMonth >= startOfMonth(firstJoinDate)) {
            const monthStart = startOfMonth(loopMonth);
            const monthEnd = endOfMonth(loopMonth);

            const mealsQuery = query(collection(firestore, `groups/${groupId}/meals`), where("date", ">=", monthStart), where("date", "<=", monthEnd));
            const expensesQuery = query(collection(firestore, `groups/${groupId}/expenses`), where("date", ">=", monthStart), where("date", "<=", monthEnd));
            const membersQuery = query(collection(firestore, `groups/${groupId}/members`));
            const usersQuery = query(collection(firestore, 'users'));
            const settlementsQuery = query(collection(firestore, `groups/${groupId}/settlements`), where("month", "==", getMonth(loopMonth) + 1), where("year", "==", getYear(loopMonth)));
            
            const [mealsSnapshot, expensesSnapshot, membersSnapshot, usersSnapshot, settlementsSnapshot] = await Promise.all([
                getDocs(mealsQuery),
                getDocs(expensesQuery),
                getDocs(membersQuery),
                getDocs(membersQuery),
                getDocs(settlementsQuery)
            ]);

            const mealsData = mealsSnapshot.docs.map(d => d.data() as MealLog);
            const expensesData = expensesSnapshot.docs.map(d => d.data() as Expense);
            const membersData = membersSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Member));
            const usersData = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            const settlementsData = settlementsSnapshot.docs.map(d => d.data() as Settlement);
            
            const userMap = usersData.reduce((acc, userDoc) => {
              acc[userDoc.id] = userDoc;
              return acc;
            }, {} as Record<string, any>);
            Object.entries(profileMap).forEach(([id, profile]) => {
              userMap[id] = profile;
            });

            // Filter members who were active during the loopMonth
            const activeMembersInMonth = membersData.filter(m => {
                const joinedAt = m.joinedAt.toDate();
                const leftAt = m.leftAt?.toDate();
                const wasActive = joinedAt <= monthEnd && (!leftAt || leftAt >= monthStart);
                return wasActive;
            });
            const memberCount = activeMembersInMonth.length || 1;

            const mealsByUser = mealsData.reduce((acc, meal) => { (acc[meal.userId] = acc[meal.userId] || []).push(meal); return acc; }, {} as Record<string, MealLog[]>);
            const expensesByUser = expensesData.reduce((acc, expense) => { (acc[expense.userId] = acc[expense.userId] || []).push(expense); return acc; }, {} as Record<string, Expense[]>);
            const settlementsByUser = settlementsData.reduce((acc, settlement) => { acc[settlement.userId] = settlement; return acc; }, {} as Record<string, Settlement>);

            const totalGroupFoodExpenses = expensesData.filter(e => e.category === 'Food & Groceries').reduce((sum, e) => sum + e.amount, 0);
            const totalGroupOtherExpenses = expensesData.filter(e => e.category === 'Other').reduce((sum, e) => sum + e.amount, 0);
            const totalUtilityExpenses = expensesData.filter(e => ['Electricity', 'Gas'].includes(e.category)).reduce((sum, e) => sum + e.amount, 0);
            const totalGroupMeals = mealsData.reduce((sum, meal) => sum + meal.mealNumber, 0);
            const mealRate = totalGroupMeals > 0 ? totalGroupFoodExpenses / totalGroupMeals : 0;
            const perMemberUtilityShare = totalUtilityExpenses / memberCount;
            const perMemberOtherShare = totalGroupOtherExpenses / memberCount;
            const gasTotal = expensesData.filter(e => e.category === 'Gas').reduce((sum, e) => sum + e.amount, 0);
            const electricityShares = computeElectricityShares(expensesData, activeMembersInMonth, leavesData, monthEnd);

            const processedMembers = activeMembersInMonth.map(member => {
                const userDetails = userMap[member.id];
                const memberMeals = mealsByUser[member.id] || [];
                const totalMealCount = memberMeals.reduce((sum, meal) => sum + meal.mealNumber, 0);
                const totalMealCost = totalMealCount * mealRate;

                const memberExpenses = expensesByUser[member.id] || [];
                const totalPaid = memberExpenses.reduce((sum, e) => sum + e.amount, 0);
                
                const utilityShare = gasTotal / memberCount + (electricityShares[member.id] || 0);
                const totalShare = totalMealCost + utilityShare + perMemberOtherShare;
                const balance = totalPaid - totalShare;

                return {
                    id: member.id,
                    name: userDetails?.displayName || userDetails?.email?.split('@')[0] || memberMeals[0]?.userName || memberExpenses[0]?.userName || 'Unnamed Member',
                    photoURL: userDetails?.photoURL,
                    totalPaid,
                    totalShare,
                    balance,
                    isSettled: !!settlementsByUser[member.id],
                    settlementDetails: settlementsByUser[member.id],
                };
            });

            if (mealsData.length > 0 || expensesData.length > 0) {
              monthlyRecords.push({
                  month: loopMonth,
                  processedMembers,
                  totalGroupExpenses: totalGroupFoodExpenses + totalUtilityExpenses + totalGroupOtherExpenses,
                  mealRate,
              });
            }

            loopMonth = subMonths(loopMonth, 1);
        }

        setHistory(monthlyRecords);
        setIsLoadingHistory(false);
    };

    if (groupId) {
        fetchHistory();
    }
  }, [groupId, firestore]);

  const isLoading = isUserLoading || isCurrentUserDataLoading || isLoadingHistory;

  if (isLoading) {
    return <HistorySkeleton />;
  }

  if (!groupId) {
    return <WelcomeCard />;
  }

  if (history.length === 0) {
      return (
          <Card>
              <CardContent className="text-center py-16">
                  <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold">No History Yet</h3>
                  <p className="text-muted-foreground">Once you complete a month of tracking, your settlement history will appear here.</p>
              </CardContent>
          </Card>
      )
  }

  return (
    <div className="space-y-4">
      {history.map(({ month, processedMembers, totalGroupExpenses, mealRate }) => {
        const monthForSettlement = getMonth(month) + 1;
        const yearForSettlement = getYear(month);

        return (
            <Card key={month.toISOString()}>
            <Collapsible>
                <CollapsibleTrigger className="flex justify-between items-center w-full p-4 group">
                    <CardHeader className="p-0 text-left">
                        <CardTitle>{format(month, "MMMM yyyy")}</CardTitle>
                        <CardDescription>Total Expenses: ৳{totalGroupExpenses.toFixed(2)} | Meal Rate: ৳{mealRate.toFixed(2)}</CardDescription>
                    </CardHeader>
                    <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent>
                       {processedMembers.map(member => (
                         <div key={member.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 border-t first:border-t-0">
                           <div className="flex items-center gap-3 flex-1 mb-3 md:mb-0">
                               <Avatar>
                                 <AvatarImage src={member.photoURL}/>
                                 <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                               </Avatar>
                               <div className="flex-1">
                                 <p className="font-semibold">{member.name}</p>
                                 <div className={cn("font-bold text-lg", member.balance >= 0 ? 'text-green-600' : 'text-red-600')}>
                                   {member.balance >= 0 ? `Gets: ` : `Owes: `}
                                   ৳{Math.abs(member.balance).toFixed(2)}
                                 </div>
                               </div>
                           </div>
                           <div className="w-full md:w-auto">
                           {member.isSettled ? (
                                <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-300">
                                    <CheckCircle className="h-4 w-4 !text-green-600" />
                                    <AlertTitle className="text-sm font-semibold">Settled!</AlertTitle>
                                    <AlertDescription className="text-xs">
                                        Paid to {member.settlementDetails?.settledTo} via {member.settlementDetails?.settlementMethod}.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                               <SettleUpDialog member={member} month={monthForSettlement} year={yearForSettlement} groupId={groupId} currentUserId={currentUser!.uid} members={processedMembers} currentUserIsAdmin={currentUserIsAdmin} />
                            )}
                           </div>
                         </div>
                       ))}
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
            </Card>
        )
      })}
    </div>
  );
}
