
"use client";

import { useState } from "react";
import { useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, LogIn, Group } from "lucide-react";
import { doc, addDoc, collection, serverTimestamp, writeBatch, query, where, getDocs, getDoc } from "firebase/firestore";
import { firestore } from "@/firebase/config";

export function Welcome() {
    const { user } = useUser();
    const { toast } = useToast();

    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [inviteCode, setInviteCode] = useState("");

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            toast({ variant: "destructive", title: "Group name is required." });
            return;
        }
        if (!user) return;
        setIsCreating(true);

        try {
            const invitationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const groupRef = await addDoc(collection(firestore, "groups"), {
                groupName: groupName,
                invitationCode: invitationCode,
                adminId: user.uid,
                createdAt: serverTimestamp(),
                settings: {
                    mealTypes: ["Lunch", "Dinner"],
                    isMealItemNameRequired: false,
                    isExpenseDescriptionRequired: false,
                    isUtilityReceiptRequired: false,
                }
            });

            const groupId = groupRef.id;
            const userRef = doc(firestore, "users", user.uid);
            const memberRef = doc(firestore, `groups/${groupId}/members`, user.uid);

            const batch = writeBatch(firestore);
            batch.update(userRef, { groupId: groupId, isAdmin: true });
            batch.set(memberRef, {
                role: "admin",
                status: "active",
                joinedAt: serverTimestamp(),
            });
            await batch.commit();

            toast({ title: "Group Created!", description: `The group "${groupName}" has been successfully created.` });
        } catch (error) {
            console.error("Error creating group:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not create group." });
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoinGroup = async () => {
        if (!inviteCode.trim()) {
            toast({ variant: "destructive", title: "Invite code is required." });
            return;
        }
        if (!user) return;
        setIsJoining(true);

        try {
            const groupsRef = collection(firestore, "groups");
            const q = query(groupsRef, where("invitationCode", "==", inviteCode.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast({ variant: "destructive", title: "Invalid Code", description: "No group found with that invite code." });
                setIsJoining(false);
                return;
            }

            const groupDoc = querySnapshot.docs[0];
            const groupId = groupDoc.id;
            
            const userRef = doc(firestore, "users", user.uid);
            const memberRef = doc(firestore, `groups/${groupId}/members`, user.uid);
            const memberDoc = await getDoc(memberRef);

            const batch = writeBatch(firestore);
            batch.update(userRef, { groupId: groupId, isAdmin: false });

            if (memberDoc.exists()) {
                batch.update(memberRef, { status: 'active', leftAt: null, role: 'member' });
            } else {
                batch.set(memberRef, { role: "member", status: "active", joinedAt: serverTimestamp() });
            }
            await batch.commit();
            
            toast({ title: "Welcome to the Group!", description: `You have successfully joined "${groupDoc.data().groupName}".` });
        } catch (error) {
            console.error("Error joining group: ", error);
            toast({ variant: "destructive", title: "Error", description: "Could not join the group." });
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
                <Group className="h-16 w-16 mx-auto text-primary mb-4" />
                <h1 className="text-4xl font-bold font-headline">Welcome to BachelorBite, {user?.displayName?.split(' ')[0] || 'friend'}!</h1>
                <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
                    You're not part of a group yet. A group allows you to track meals and manage shared expenses with your roommates.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="text-center">
                        <PlusCircle className="h-10 w-10 mx-auto text-primary mb-2" />
                        <h2 className="text-2xl font-semibold leading-none tracking-tight">Create a New Group</h2>
                        <CardDescription>Start a new group and invite your roommates to join.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            placeholder="Enter Your Group or Hostel Name"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            disabled={isCreating || isJoining}
                        />
                        <Button onClick={handleCreateGroup} className="w-full" disabled={isCreating || isJoining}>
                            {isCreating && <Loader2 className="mr-2 animate-spin" />}
                            Create Group & Become Admin
                        </Button>
                    </CardContent>
                </Card>

                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="text-center">
                        <LogIn className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                        <h2 className="text-2xl font-semibold leading-none tracking-tight">Join an Existing Group</h2>
                        <CardDescription>Use an invite code from a roommate to join their group.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            placeholder="Enter Invite Code"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            className="font-mono tracking-widest text-center"
                            disabled={isCreating || isJoining}
                        />
                        <Button onClick={handleJoinGroup} variant="secondary" className="w-full" disabled={isJoining || isCreating}>
                            {isJoining && <Loader2 className="mr-2 animate-spin" />}
                            Join Group
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
