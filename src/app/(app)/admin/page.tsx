import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, ShieldCheck, User, Copy } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MOCK_GROUP = {
  name: "Sunset Apartment",
  inviteCode: "SUNSET123",
  memberCount: 3,
};

const MOCK_MEMBERS = [
  { id: '1', name: 'Alice', email: 'alice@example.com', role: 'Admin', avatar: 'https://picsum.photos/seed/1/40/40' },
  { id: '2', name: 'Bob', email: 'bob@example.com', role: 'Member', avatar: 'https://picsum.photos/seed/2/40/40' },
  { id: '3', name: 'Charlie', email: 'charlie@example.com', role: 'Member', avatar: 'https://picsum.photos/seed/3/40/40' },
];


export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage your group members and settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Group Details</CardTitle>
          <CardDescription>
            Your group's information and invite code.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Group Name</p>
            <p className="text-lg font-semibold">{MOCK_GROUP.name}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Invite Code</p>
            <p className="text-lg font-mono font-semibold bg-background/50 px-2 py-1 rounded inline-block">{MOCK_GROUP.inviteCode}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Members</p>
            <p className="text-lg font-semibold">{MOCK_GROUP.memberCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Group Members</CardTitle>
            <CardDescription>Add or remove members from your group.</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite a Member</DialogTitle>
                <DialogDescription>
                  Share this code with someone to let them join your group.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center space-x-2">
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="link" className="sr-only">
                    Link
                  </Label>
                  <Input
                    id="link"
                    defaultValue={MOCK_GROUP.inviteCode}
                    readOnly
                    className="font-mono h-12 text-lg"
                  />
                </div>
                <Button size="icon" className="h-12 w-12" onClick={() => navigator.clipboard.writeText(MOCK_GROUP.inviteCode)}>
                  <span className="sr-only">Copy</span>
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="hidden sm:table-cell">Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_MEMBERS.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {member.role === 'Admin' ? (
                      <Badge variant="default" className="bg-primary/20 text-primary-foreground hover:bg-primary/30">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        {member.role}
                      </Badge>
                    ) : (
                       <Badge variant="secondary">
                        <User className="mr-1 h-3 w-3" />
                        {member.role}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {member.role !== 'Admin' && (
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove member</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
