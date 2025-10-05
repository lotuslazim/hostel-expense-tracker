"use client";

import { useState, useMemo, useEffect } from "react";
import { useUser, useFirebase, useDoc, useCollection } from "@/firebase";
import { doc, updateDoc, collection, query, where, Timestamp, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Camera, User, Mail, Home, Users, Wallet, ChevronDown, Loader2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import type { Expense } from "@/lib/types";
import imageCompression from "browser-image-compression";

function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2 text-center sm:text-left">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-52" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export function Profile() {
  const { user, isUserLoading } = useUser();
  const { firestore, storage } = useFirebase();
  const { toast } = useToast();

  const userRef = useMemo(() => (user ? doc(firestore, "users", user.uid) : null), [user, firestore]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userRef);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const groupId = userData?.groupId;

  const groupRef = useMemo(() => (groupId ? doc(firestore, `groups`, groupId) : null), [groupId, firestore]);
  const { data: groupData, isLoading: isGroupDataLoading } = useDoc(groupRef);

  const membersQuery = useMemo(() => (groupId ? collection(firestore, `groups/${groupId}/members`) : null), [groupId, firestore]);
  const { data: members, isLoading: areMembersLoading } = useCollection(membersQuery);
  
  const expensesQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(firestore, `groups/${groupId}/expenses`), where("userId", "==", user.uid), orderBy("date", "desc"));
  }, [user, firestore, groupId]);
  const { data: expenses, isLoading: areExpensesLoading } = useCollection<Expense>(expensesQuery);

  const monthlyExpenses = useMemo(() => {
    if (!expenses) return {};
    return expenses.reduce((acc, expense) => {
      const month = format((expense.date as Timestamp).toDate(), "MMMM yyyy");
      if (!acc[month]) {
        acc[month] = { total: 0, items: [] };
      }
      acc[month].total += expense.amount;
      acc[month].items.push(expense);
      return acc;
    }, {} as Record<string, { total: number; items: Expense[] }>);
  }, [expenses]);


  useEffect(() => {
    if (userData) {
      setDisplayName(userData.displayName || "");
      setEmail(user?.email || "");
      setIsEditing(false);
    }
  }, [userData, user]);
  
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
       try {
        const compressedFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1024 });
        setProfileImageFile(compressedFile);
        setImagePreview(URL.createObjectURL(compressedFile));
        setIsEditing(true);
      } catch (error) {
        toast({ variant: "destructive", title: "Error compressing image." });
      }
    }
  };

  const handleSaveChanges = async () => {
    if (!userRef) return;
    setIsSaving(true);
    
    let photoURL = userData?.photoURL;

    try {
      if (profileImageFile) {
        const imageRef = ref(storage, `profilePictures/${user?.uid}/${profileImageFile.name}`);
        const snapshot = await uploadBytes(imageRef, profileImageFile);
        photoURL = await getDownloadURL(snapshot.ref);
      }

      await updateDoc(userRef, {
        displayName: displayName,
        photoURL: photoURL,
      });

      // Also update the corresponding member document
      if (groupId && user) {
        const memberRef = doc(firestore, `groups/${groupId}/members`, user.uid);
        await updateDoc(memberRef, {
          displayName: displayName,
          photoURL: photoURL,
        });
      }
      
      toast({ title: "Profile Updated", description: "Your changes have been saved." });
      setIsEditing(false);
      setProfileImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not save changes." });
    } finally {
      setIsSaving(false);
    }
  };

  const roommates = useMemo(() => members?.filter(member => member.id !== user?.uid), [members, user]);

  const isLoading = isUserLoading || isUserDataLoading || isGroupDataLoading || areMembersLoading || areExpensesLoading;

  if (isLoading) {
    return <ProfileSkeleton />;
  }
  
  if (!user) {
    return <p>Please log in to view your profile.</p>
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">View and edit your personal and group information.</p>
      </div>

      <Card>
        <CardHeader>
           <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-2 border-primary">
                  <AvatarImage src={imagePreview || userData?.photoURL} alt={displayName} />
                  <AvatarFallback>{displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <label htmlFor="profile-photo-upload" className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-6 w-6 text-white" />
                  <input id="profile-photo-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>
              <div className="flex-grow w-full space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="displayName"
                      value={displayName}
                      onChange={(e) => { setDisplayName(e.target.value); setIsEditing(true); }}
                      className="pl-10"
                      placeholder="Your Name"
                    />
                  </div>
                  <div className="relative">
                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                     <Input 
                        id="email"
                        value={email}
                        readOnly
                        className="pl-10 bg-muted/50 cursor-not-allowed"
                        placeholder="your@email.com"
                      />
                  </div>
              </div>
            </div>
             {isEditing && (
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setIsEditing(false); setProfileImageFile(null); setImagePreview(null); setDisplayName(userData?.displayName || '')}}>Cancel</Button>
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Home /> Group Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
             {groupData ? (
                <>
                    <div>
                        <p className="font-semibold text-muted-foreground">Hostel Name</p>
                        <p className="text-lg">{groupData.groupName}</p>
                    </div>
                     <Separator />
                    <div>
                      <p className="font-semibold text-muted-foreground mb-2 flex items-center gap-2"><Users/> Roommates</p>
                      <div className="space-y-3">
                        {roommates && roommates.length > 0 ? roommates.map(member => (
                          <div key={member.id} className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.photoURL} />
                              <AvatarFallback>{member.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>{member.displayName}</span>
                          </div>
                        )) : (
                          <p className="text-muted-foreground">You have no roommates in this group yet.</p>
                        )}
                      </div>
                    </div>
                </>
             ) : (
                <div className="text-center py-6">
                    <p className="text-muted-foreground">You are not part of any group.</p>
                     <Button variant="link" className="mt-2" onClick={() => window.location.href='/admin'}>Create or Join a Group</Button>
                </div>
             )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wallet/> Expense History</CardTitle>
            <CardDescription>Your personal expense contributions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
                {Object.keys(monthlyExpenses).length > 0 ? Object.entries(monthlyExpenses).map(([month, data]) => (
                    <Collapsible key={month}>
                        <CollapsibleTrigger className="w-full flex justify-between items-center p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                           <span className="font-semibold">{month}</span>
                           <div className="flex items-center gap-2">
                             <span className="text-muted-foreground">৳{data.total.toFixed(2)}</span>
                             <ChevronDown className="h-5 w-5 transition-transform group-data-[state=open]:rotate-180" />
                           </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-3 pb-3">
                            <div className="space-y-2 mt-2 border-t pt-2">
                                {data.items.map(item => (
                                    <div key={item.id} className="flex justify-between items-center text-sm">
                                        <div>
                                          <p>{item.expenseItem}</p>
                                          <p className="text-xs text-muted-foreground">{format((item.date as Timestamp).toDate(), "do MMM, yyyy")}</p>
                                        </div>
                                        <p className="font-medium">৳{item.amount.toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                )) : (
                    <p className="text-center text-muted-foreground py-6">No expenses logged yet.</p>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
