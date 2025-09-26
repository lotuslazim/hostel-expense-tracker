import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { AlertTriangle, UserCog, Settings, Bell, Palette, Globe, LogOut, Trash2, Shield, Edit, ShieldCheck, FileDown, SlidersHorizontal } from "lucide-react"

// Mock data, in a real app this would come from your auth/user state
const USER_IS_ADMIN = true;
const MOCK_GROUP = {
  name: "Sunset Apartment",
  inviteCode: "SUNSET123",
};

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Settings</h1>
        <p className="text-muted-foreground">
          Manage your app, account, and group settings.
        </p>
      </div>

      <Accordion type="single" collapsible defaultValue="app-settings" className="w-full">
        {/* App Settings */}
        <AccordionItem value="app-settings">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5" />
              App Settings
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pt-4">
            <Card>
               <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Palette className="h-4 w-4"/> Appearance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <Switch id="dark-mode" />
                </div>
              </CardContent>
            </Card>
            <Card>
               <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Globe className="h-4 w-4"/> Language</CardTitle>
              </CardHeader>
              <CardContent>
                 <Select defaultValue="en">
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="bn">Bangla</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4"/> Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="meal-reminders">Meal Reminders</Label>
                  <Switch id="meal-reminders" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="expense-alerts">Expense Alerts</Label>
                  <Switch id="expense-alerts" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="missed-day-alerts">Missed Day Alerts</Label>
                  <Switch id="missed-day-alerts" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Account Settings */}
        <AccordionItem value="account-settings">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-3">
              <UserCog className="h-5 w-5" />
              Account
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                  <CardTitle className="text-base">Group Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Group Name</span>
                    <span className="font-medium">{MOCK_GROUP.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Invite Code</span>
                    <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{MOCK_GROUP.inviteCode}</span>
                  </div>
              </CardContent>
            </Card>
            <Card>
               <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <LogOut className="mr-2 h-4 w-4" /> Leave Group
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
                      <AlertDialogDescription>
                        You will lose access to all group data. This action can only be undone by being re-invited by an admin.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive hover:bg-destructive/90">Leave Group</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full justify-start">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive hover:bg-destructive/90">Delete Account</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        
        {/* Admin Settings */}
        {USER_IS_ADMIN && (
          <AccordionItem value="admin-settings">
            <AccordionTrigger className="text-lg font-semibold">
              <div className="flex items-center gap-3 text-primary">
                <Shield className="h-5 w-5" />
                Admin Controls
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-6 pt-4">
               <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><Edit className="h-4 w-4"/> Group Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                   <Button variant="outline" className="w-full justify-start">Edit Group Name</Button>
                   <Button variant="outline" className="w-full justify-start">Reset Invite Code</Button>
                </CardContent>
              </Card>
               <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4"/> Member Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                   <Button variant="outline" className="w-full justify-start">Approve/Reject Member Requests</Button>
                   <Button variant="outline" className="w-full justify-start">Assign Another Admin</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><SlidersHorizontal className="h-4 w-4"/> Expense & Meal Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                   <Button variant="outline" className="w-full justify-start">Set Expense Categories</Button>
                   <Button variant="outline" className="w-full justify-start">Define Cost-Sharing Method</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><FileDown className="h-4 w-4"/> Data & Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full justify-start">Export Group Data (CSV/Excel)</Button>
                </CardContent>
              </Card>
               <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Admin Responsibility</AlertTitle>
                  <AlertDescription>
                    Changes made in this panel will affect all members of your group. Please proceed with caution.
                  </AlertDescription>
                </Alert>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  )
}
