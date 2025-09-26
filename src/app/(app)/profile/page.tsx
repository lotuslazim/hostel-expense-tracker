import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import placeholderImages from "@/lib/placeholder-images.json";
import { User, Home, Utensils, DollarSign, ShoppingCart } from "lucide-react";

// Mock data - in a real app, this would come from Firebase
const MOCK_USER = {
  name: "Alice",
  email: "alice@example.com",
  role: "Admin",
  profilePictureId: "user-avatar"
};

const MOCK_GROUP = {
  name: "The Foodies",
  invitationCode: "FDIE-1234",
  memberCount: 3,
};

const MOCK_CONTRIBUTIONS = {
  meals: {
    total: 84,
    averagePerDay: 2.8,
  },
  expenses: {
    total: 12500,
    share: 45,
  },
  purchases: [
    { item: "Rice", quantity: "10 kg" },
    { item: "Oil", quantity: "2 liters" },
    { item: "Vegetables", quantity: "5 kg" },
  ],
  totalItemsLogged: 15
};

export default function ProfilePage() {
  const avatarImage = placeholderImages.placeholderImages.find(p => p.id === MOCK_USER.profilePictureId);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Your Profile</h1>
        <p className="text-muted-foreground">
          View your personal and group information.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-1 space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-16 w-16">
                {avatarImage && (
                  <AvatarImage 
                    src={avatarImage.imageUrl}
                    alt="User avatar" 
                    data-ai-hint={avatarImage.imageHint}
                  />
                )}
                <AvatarFallback>{MOCK_USER.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{MOCK_USER.name}</CardTitle>
                <CardDescription>{MOCK_USER.email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Badge>{MOCK_USER.role}</Badge>
            </CardContent>
          </Card>

          {/* Group Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Home className="h-5 w-5" /> Group Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Group Name</span>
                <span className="font-medium">{MOCK_GROUP.name}</span>
              </div>
              {MOCK_USER.role === 'Admin' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invite Code</span>
                  <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{MOCK_GROUP.invitationCode}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Members</span>
                <span className="font-medium">{MOCK_GROUP.memberCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Meal Contribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Utensils className="h-5 w-5" /> Meal Contribution</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Meals Logged</p>
                <p className="text-3xl font-bold">{MOCK_CONTRIBUTIONS.meals.total}</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Average Meals/Day</p>
                <p className="text-3xl font-bold">{MOCK_CONTRIBUTIONS.meals.averagePerDay}</p>
              </div>
            </CardContent>
          </Card>

          {/* Expense Contribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Expense Contribution</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Spend</p>
                <p className="text-3xl font-bold">Tk{MOCK_CONTRIBUTIONS.expenses.total.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Share of Group Total</p>
                <p className="text-3xl font-bold">{MOCK_CONTRIBUTIONS.expenses.share}%</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Purchase Contribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Purchase Contribution</CardTitle>
               <CardDescription>Total items logged: {MOCK_CONTRIBUTIONS.totalItemsLogged}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Quantity Purchased</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_CONTRIBUTIONS.purchases.map((purchase) => (
                    <TableRow key={purchase.item}>
                      <TableCell className="font-medium">{purchase.item}</TableCell>
                      <TableCell className="text-right">{purchase.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
