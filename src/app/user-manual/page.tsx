import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  BarChart3,
  BookOpenText,
  CircleHelp,
  ClipboardList,
  FileDown,
  History,
  LayoutDashboard,
  LogIn,
  Menu,
  MessageCircle,
  Package,
  Scale,
  Settings,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  UserCircle,
  Users,
} from "lucide-react";

import { AppHeader } from "@/components/app/header";
import { cn } from "@/lib/utils";

type Accent = "yellow" | "rose" | "pink";
type Access = "ALL MEMBERS" | "ADMINS" | "ACCOUNT";

type ManualStep = {
  label: string;
  text: string;
};

type ManualSection = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: Accent;
  access: Access;
  steps: ManualStep[];
  tip?: string;
  href?: string;
  linkLabel?: string;
};

const accentStyles: Record<
  Accent,
  {
    card: string;
    icon: string;
    eyebrow: string;
    number: string;
    link: string;
  }
> = {
  yellow: {
    card: "border-[#f6cf58]/20 bg-[linear-gradient(145deg,rgba(246,207,88,0.075),rgba(12,31,24,0.96))]",
    icon: "border-[#f6cf58]/25 bg-[#f6cf58]/10 text-[#f6cf58]",
    eyebrow: "text-[#f6cf58]",
    number: "border-[#f6cf58]/25 bg-[#f6cf58]/10 text-[#f6cf58]",
    link: "text-[#f6cf58] hover:text-[#ffe58b]",
  },
  rose: {
    card: "border-[#8f2335]/40 bg-[linear-gradient(145deg,rgba(143,35,53,0.12),rgba(12,31,24,0.96))]",
    icon: "border-[#b94a62]/30 bg-[#8f2335] text-[#ffe5ea]",
    eyebrow: "text-[#f2a6b5]",
    number: "border-[#b94a62]/30 bg-[#8f2335]/30 text-[#ffc8d2]",
    link: "text-[#f2a6b5] hover:text-[#ffd1da]",
  },
  pink: {
    card: "border-[#f1b5c2]/20 bg-[linear-gradient(145deg,rgba(241,181,194,0.08),rgba(12,31,24,0.96))]",
    icon: "border-[#f1b5c2]/25 bg-[#f1b5c2]/10 text-[#f4bdc9]",
    eyebrow: "text-[#f4bdc9]",
    number: "border-[#f1b5c2]/25 bg-[#f1b5c2]/10 text-[#f4bdc9]",
    link: "text-[#f4bdc9] hover:text-[#ffe0e7]",
  },
};

const accessStyles: Record<Access, string> = {
  "ALL MEMBERS": "border-[#f6cf58]/20 bg-[#f6cf58]/10 text-[#f4d978]",
  ADMINS: "border-[#b94a62]/30 bg-[#8f2335]/30 text-[#ffc5d0]",
  ACCOUNT: "border-[#f1b5c2]/20 bg-[#f1b5c2]/10 text-[#f2c3cd]",
};

const manualSections: ManualSection[] = [
  {
    id: "getting-started",
    eyebrow: "START HERE",
    title: "Create an account and join a group",
    description:
      "BachelorBite works best when every roommate uses the same group.",
    icon: LogIn,
    accent: "yellow",
    access: "ACCOUNT",
    steps: [
      {
        label: "Create or log in",
        text: "Choose Create Account if you are new. Choose Log In if you already have an account.",
      },
      {
        label: "Create a group",
        text: "Open Group Details, enter a group name, and tap Create & Become Admin.",
      },
      {
        label: "Join a group",
        text: "Ask an admin for the invite code. Enter it under Join Group and tap Join Group.",
      },
      {
        label: "Start sharing",
        text: "After you join, meals, expenses, notices, shopping items, and reports are shared with the group.",
      },
    ],
    tip: "Keep the invite code inside your trusted roommate group.",
    href: "/admin",
    linkLabel: "Open Group Details",
  },
  {
    id: "navigation",
    eyebrow: "MOVE AROUND",
    title: "Navigation and shortcuts",
    description:
      "Use the header and the floating crocodile to reach any important page.",
    icon: Menu,
    accent: "pink",
    access: "ALL MEMBERS",
    steps: [
      {
        label: "Main menu",
        text: "Tap the three-line icon in the top-left. It opens every app section.",
      },
      {
        label: "Floating crocodile",
        text: "Drag it to either screen edge. Tap it for Dashboard, Shopping List, Monthly Report, Activity Log, and Chat.",
      },
      {
        label: "Notice shortcut",
        text: "Tap the yellow notice icon in the header. A number means you have unread notices.",
      },
      {
        label: "Profile and back",
        text: "Tap your photo to open My Profile. Use the back row under the header to return.",
      },
    ],
    tip: "The floating shortcut is hidden on public login and landing pages.",
  },
  {
    id: "dashboard",
    eyebrow: "DAILY INPUT",
    title: "Dashboard",
    description:
      "Add the daily records that power every report and settlement.",
    icon: LayoutDashboard,
    accent: "rose",
    access: "ALL MEMBERS",
    steps: [
      {
        label: "Choose a date",
        text: "Use the date arrows before logging a meal or expense. Future dates cannot be selected.",
      },
      {
        label: "Log a meal",
        text: "Select one or more meal types, enter each count, add item names if needed, and tap Log Meals. A member can submit each meal type only once for the same date.",
      },
      {
        label: "Correct a quick mistake",
        text: "Tap Undo within 10 seconds. The meal is removed, the undo stays in Activity Log, and you can submit that meal type again correctly.",
      },
      {
        label: "Add an expense",
        text: "Choose Food & Groceries, Electricity, Gas, or Other. Enter the details and tap Add Expense. Its add or undo action also appears in Activity Log.",
      },
      {
        label: "Add purchase details",
        text: "For groceries, add item, quantity, unit, and cost. For utility bills, take or upload a receipt when needed.",
      },
      {
        label: "Post a notice",
        text: "Write a short notice and tap Pin Notice. This works for admins, or for members when the admin allows posting.",
      },
      {
        label: "Read the dashboard feed",
        text: "The monthly feed shows recent group expenses. Change the month to check older entries.",
      },
    ],
    tip: "A grocery item selected from the Shopping List is updated when the expense is saved.",
    href: "/dashboard",
    linkLabel: "Open Dashboard",
  },
  {
    id: "activity-log",
    eyebrow: "SHARED HISTORY",
    title: "Activity Log",
    description:
      "Give every member a transparent record of group actions without extra pop-up notifications.",
    icon: History,
    accent: "pink",
    access: "ALL MEMBERS",
    steps: [
      {
        label: "Open the log",
        text: "Choose Activity Log from the main menu or the floating crocodile shortcut.",
      },
      {
        label: "See everyone",
        text: "Every active group member can see who logged or undid a meal, added or undid an expense, or made an admin change.",
      },
      {
        label: "Filter the list",
        text: "Choose All, Meal, Expense, or Admin to focus on the activity you need.",
      },
      {
        label: "Keep the audit trail",
        text: "Undo creates a new history row instead of deleting the original action, so the group can still understand what happened.",
      },
      {
        label: "Admin meal correction",
        text: "Only an admin can correct another member’s meal count or item. A 5–200 character reason is required and becomes visible to everyone.",
      },
    ],
    tip: "Activity Log is a shared history page, not an unread badge or repeated notification popup.",
    href: "/activity",
    linkLabel: "Open Activity Log",
  },
  {
    id: "monthly-report",
    eyebrow: "SEE THE RESULT",
    title: "Monthly Report",
    description:
      "Turn daily entries into totals, member details, and a fair final balance.",
    icon: BarChart3,
    accent: "yellow",
    access: "ALL MEMBERS",
    steps: [
      {
        label: "Monthly Summary",
        text: "See food cost, total meals, meal rate, utilities, other expenses, and the final settlement.",
      },
      {
        label: "Meals tab",
        text: "Open each member to see total meals, daily meal logs, and food purchases for the month.",
      },
      {
        label: "Expenses tab",
        text: "See the total expense, all entries, categories, members, item details, and saved receipts.",
      },
      {
        label: "Change month",
        text: "Use the left and right arrows to move between months.",
      },
      {
        label: "Settle Up",
        text: "The member or an admin can record who was paid and how the payment was made.",
      },
    ],
    tip: "Settle Up records a payment. BachelorBite does not send money.",
    href: "/report",
    linkLabel: "Open Monthly Report",
  },
  {
    id: "shopping-list",
    eyebrow: "PLAN PURCHASES",
    title: "Shopping List",
    description:
      "Tell the group what is needed and stop two people from buying the same item.",
    icon: ShoppingBasket,
    accent: "pink",
    access: "ALL MEMBERS",
    steps: [
      {
        label: "Add an item",
        text: "Enter the item name, quantity, unit, priority, and an optional note.",
      },
      {
        label: "Mark urgent",
        text: "Choose Urgent when the group needs the item quickly. It also appears in the shopping alert.",
      },
      {
        label: "Claim an item",
        text: "Tap I’ll bring it. Other members will see that you claimed it.",
      },
      {
        label: "Cancel or delete",
        text: "You can cancel your own claim. Only the person who added an item can delete it.",
      },
      {
        label: "Finish the purchase",
        text: "Select the item while adding a grocery expense. A full purchase completes it; a partial purchase keeps the remaining quantity.",
      },
    ],
    href: "/shopping-list",
    linkLabel: "Open Shopping List",
  },
  {
    id: "notice-board",
    eyebrow: "IMPORTANT UPDATES",
    title: "Notice Board",
    description:
      "Keep important group messages separate from normal chat.",
    icon: ClipboardList,
    accent: "rose",
    access: "ALL MEMBERS",
    steps: [
      {
        label: "Read notices",
        text: "Open the board from the menu or the yellow header icon. New notices show an unread count.",
      },
      {
        label: "Post a notice",
        text: "Use Post a Notice on the Dashboard. Member posting depends on the admin setting.",
      },
      {
        label: "Copy a notice",
        text: "Tap the copy icon to copy the full message.",
      },
      {
        label: "Manage a notice",
        text: "Admins can edit every notice. A permitted member can unpin or delete only the notice they created.",
      },
      {
        label: "Know the difference",
        text: "Unpin hides a notice from the board. Delete removes it permanently.",
      },
    ],
    href: "/notice-board",
    linkLabel: "Open Notice Board",
  },
  {
    id: "chat",
    eyebrow: "GROUP TALK",
    title: "Chat",
    description:
      "Use one shared conversation for quick messages and photos.",
    icon: MessageCircle,
    accent: "yellow",
    access: "ALL MEMBERS",
    steps: [
      {
        label: "Send a message",
        text: "Type in the message box and tap the send arrow.",
      },
      {
        label: "Send a photo",
        text: "Tap the image icon, choose a photo, check the preview, and send it.",
      },
      {
        label: "View members and media",
        text: "Tap the group name or the three-dot menu to see members and shared photos.",
      },
      {
        label: "Change the background",
        text: "Open the three-dot menu, choose Change Background, and select a style.",
      },
    ],
    href: "/chat",
    linkLabel: "Open Chat",
  },
  {
    id: "inventory",
    eyebrow: "PURCHASE RECORDS",
    title: "Inventory",
    description:
      "See a monthly summary of the grocery items your group has purchased.",
    icon: Package,
    accent: "pink",
    access: "ALL MEMBERS",
    steps: [
      {
        label: "Create inventory data",
        text: "Log a Food & Groceries expense with purchased item details on the Dashboard.",
      },
      {
        label: "Read the summary",
        text: "Each item shows the total quantity and total cost for the selected month.",
      },
      {
        label: "See contributions",
        text: "Expand an item to see who bought it, the date, quantity, unit, and cost.",
      },
      {
        label: "Load older rows",
        text: "Tap Load More Purchases when more purchase records are available.",
      },
    ],
    tip: "An expense without item details cannot create a useful inventory row.",
    href: "/inventory",
    linkLabel: "Open Inventory",
  },
  {
    id: "group-details",
    eyebrow: "YOUR ROOMMATES",
    title: "Group Details",
    description:
      "Check the group name, invite code, members, roles, and old member records.",
    icon: Users,
    accent: "rose",
    access: "ALL MEMBERS",
    steps: [
      {
        label: "Group name",
        text: "This is the shared name shown to every member.",
      },
      {
        label: "Invite code",
        text: "Tap the copy icon and send the code to a trusted roommate.",
      },
      {
        label: "Active members",
        text: "See each current member, email, and role.",
      },
      {
        label: "Past members",
        text: "See who left or was removed, the date, and the saved reason. Their old records remain in reports.",
      },
      {
        label: "Manage Members",
        text: "This button is shown to admins and opens the Admin Dashboard.",
      },
    ],
    href: "/admin",
    linkLabel: "Open Group Details",
  },
  {
    id: "admin-dashboard",
    eyebrow: "ADMIN TOOLS",
    title: "Admin Dashboard",
    description:
      "Control group rules that affect every member.",
    icon: ShieldCheck,
    accent: "yellow",
    access: "ADMINS",
    steps: [
      {
        label: "Manage members",
        text: "Review active members. Remove a member only when needed and save a clear reason.",
      },
      {
        label: "Manage meal types",
        text: "Add or remove choices such as Breakfast, Lunch, or Dinner.",
      },
      {
        label: "Require meal item name",
        text: "Turn this on when members must write what food was served.",
      },
      {
        label: "Correct member meals",
        text: "Open Activity Log, choose Correct beside a meal, change the count or item, and write the required reason. The correction is shared with everyone.",
      },
      {
        label: "Control notices",
        text: "In Settings, choose whether members may post and manage their own notices.",
      },
      {
        label: "Export group data",
        text: "Download the group’s meal and expense records when you need an outside copy.",
      },
    ],
    tip: "Admin changes can affect the full group. Read each confirmation before continuing.",
    href: "/admin-profile",
    linkLabel: "Open Admin Dashboard",
  },
  {
    id: "settlements",
    eyebrow: "PAYMENT HISTORY",
    title: "Settlement History",
    description:
      "Keep a permanent month-by-month record of who gets money and who owes money.",
    icon: Scale,
    accent: "pink",
    access: "ALL MEMBERS",
    steps: [
      {
        label: "Open a month",
        text: "Expand any month to see total group expense, meal rate, and each member’s balance.",
      },
      {
        label: "Read the balance",
        text: "Gets means the group owes that member. Owes means that member must pay the group.",
      },
      {
        label: "Record payment",
        text: "Tap Settle Up, choose who was paid, write the payment method, and confirm.",
      },
      {
        label: "Who can settle",
        text: "A member can settle their own balance. An admin can record settlement for any member.",
      },
    ],
    tip: "Check the amount before confirming. The record is used as settlement history.",
    href: "/settlements",
    linkLabel: "Open Settlement History",
  },
  {
    id: "profile",
    eyebrow: "YOUR DETAILS",
    title: "My Profile",
    description:
      "Manage your photo and name, then review your personal group activity.",
    icon: UserCircle,
    accent: "rose",
    access: "ACCOUNT",
    steps: [
      {
        label: "Change photo",
        text: "Tap the camera badge on your photo and choose a new image.",
      },
      {
        label: "Edit name",
        text: "Change the display name and tap Save Changes. Your email is read-only here.",
      },
      {
        label: "Group details",
        text: "See the group name, copy the invite code, and view your roommates.",
      },
      {
        label: "Expense history",
        text: "Review your own expense entries and open saved receipts.",
      },
      {
        label: "Account actions",
        text: "Send a password reset link, leave the group, or delete the account. Read every warning first.",
      },
    ],
    href: "/profile",
    linkLabel: "Open My Profile",
  },
  {
    id: "settings",
    eyebrow: "APP & ACCOUNT",
    title: "Settings",
    description:
      "Change your app language and manage account or group controls.",
    icon: Settings,
    accent: "yellow",
    access: "ACCOUNT",
    steps: [
      {
        label: "Language",
        text: "Choose English or Bangla from Select Language.",
      },
      {
        label: "Group information",
        text: "See the group name and copy the invite code.",
      },
      {
        label: "Password",
        text: "Tap Send Reset Link. Check the inbox of your account email.",
      },
      {
        label: "Leave group",
        text: "A normal member can leave after confirmation. The Leave button is disabled for an admin.",
      },
      {
        label: "Delete account",
        text: "This permanently deletes the account. It cannot be undone.",
      },
      {
        label: "Admin controls",
        text: "Admins can reset the invite code, set notice permission, manage roles or members, and export data.",
      },
    ],
    href: "/settings",
    linkLabel: "Open Settings",
  },
  {
    id: "help",
    eyebrow: "NEED SUPPORT",
    title: "Help & Feedback",
    description:
      "Contact the developer when the guide does not solve your problem.",
    icon: CircleHelp,
    accent: "pink",
    access: "ALL MEMBERS",
    steps: [
      {
        label: "Open the page",
        text: "Go to the main menu and tap Help & Feedback.",
      },
      {
        label: "Send an email",
        text: "Tap the developer email address. Describe what you were doing and what went wrong.",
      },
      {
        label: "Add useful detail",
        text: "Include the page name, the button you tapped, and a screenshot when possible.",
      },
    ],
    href: "/contact",
    linkLabel: "Open Help & Feedback",
  },
];

const quickLinks = [
  {
    href: "#getting-started",
    label: "First setup",
    note: "Account and group",
    icon: LogIn,
  },
  {
    href: "#dashboard",
    label: "Daily entries",
    note: "Meals and expenses",
    icon: LayoutDashboard,
  },
  {
    href: "#activity-log",
    label: "Group history",
    note: "Actions and corrections",
    icon: History,
  },
  {
    href: "#monthly-report",
    label: "Reports",
    note: "Totals and balances",
    icon: BarChart3,
  },
  {
    href: "#settings",
    label: "Account care",
    note: "Profile and settings",
    icon: Settings,
  },
];

function ManualCard({ section }: { section: ManualSection }) {
  const Icon = section.icon;
  const styles = accentStyles[section.accent];

  return (
    <article
      id={section.id}
      className={cn(
        "scroll-mt-28 self-start overflow-hidden rounded-[26px] border shadow-[0_20px_55px_rgba(0,0,0,0.16)]",
        styles.card
      )}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "grid h-12 w-12 shrink-0 place-items-center rounded-2xl border",
              styles.icon
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.18em]",
                  styles.eyebrow
                )}
              >
                {section.eyebrow}
              </p>

              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-[0.08em]",
                  accessStyles[section.access]
                )}
              >
                {section.access}
              </span>
            </div>

            <h2 className="mt-1.5 text-[20px] font-semibold leading-7 tracking-[-0.03em] text-[#f7f2e7] sm:text-[22px]">
              {section.title}
            </h2>

            <p className="mt-2 text-[13px] leading-6 text-[#b9c5bf]">
              {section.description}
            </p>
          </div>
        </div>

        <ol className="mt-5 space-y-3.5">
          {section.steps.map((step, index) => (
            <li key={step.label} className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[10px] font-bold",
                  styles.number
                )}
              >
                {index + 1}
              </span>

              <p className="text-[12.5px] leading-[1.7] text-[#b8c4be]">
                <span className="font-semibold text-[#eee7d8]">
                  {step.label}:
                </span>{" "}
                {step.text}
              </p>
            </li>
          ))}
        </ol>

        {section.tip && (
          <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-white/[0.07] bg-black/20 px-3.5 py-3">
            <Sparkles
              className={cn("mt-0.5 h-4 w-4 shrink-0", styles.eyebrow)}
              aria-hidden="true"
            />
            <p className="text-[11.5px] leading-5 text-[#c9d1cd]">
              <span className="font-semibold text-[#f2ebdc]">Good to know:</span>{" "}
              {section.tip}
            </p>
          </div>
        )}

        {section.href && section.linkLabel && (
          <Link
            href={section.href}
            className={cn(
              "mt-5 inline-flex items-center gap-1.5 text-[12px] font-semibold transition-colors",
              styles.link
            )}
          >
            {section.linkLabel}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  );
}

export default function UserManualPage() {
  return (
    <div className="min-h-screen bg-[#0b1813] text-foreground">
      <AppHeader />

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-5 sm:px-6 sm:pt-7 lg:px-8">
        <section className="relative overflow-hidden rounded-[32px] border border-[#f6cf58]/20 bg-[linear-gradient(135deg,#132c23_0%,#10241c_48%,#271821_100%)] px-5 py-7 shadow-[0_28px_80px_rgba(0,0,0,0.28)] sm:px-8 sm:py-10 lg:px-11">
          <div
            className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#8f2335]/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-28 left-[18%] h-64 w-64 rounded-full bg-[#f6cf58]/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f6cf58]/20 bg-[#f6cf58]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f6cf58]">
              <BookOpenText className="h-3.5 w-3.5" aria-hidden="true" />
              BachelorBite User Manual
            </div>

            <h1 className="mt-5 max-w-2xl text-[clamp(2rem,6vw,4rem)] font-bold leading-[1.02] tracking-[-0.055em] text-[#f8f3e8]">
              Know <span className="text-[#f6cf58]">every option.</span>
              <br />
              Use the app with{" "}
              <span className="text-[#f2a6b5]">confidence.</span>
            </h1>

            <p className="mt-4 max-w-2xl text-[13px] leading-6 text-[#c2cbc6] sm:text-[14px] sm:leading-7">
              Find what each page does and follow the short steps. The guide uses
              the same names and icons you see inside the app.
            </p>
          </div>

          <div className="relative mt-7 grid grid-cols-2 gap-2.5 lg:grid-cols-5">
            {quickLinks.map(({ href, label, note, icon: Icon }) => (
              <a
                key={href}
                href={href}
                className="group flex min-h-[76px] items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.045] p-3 transition hover:-translate-y-0.5 hover:border-[#f6cf58]/25 hover:bg-white/[0.065]"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f6cf58]/10 text-[#f6cf58]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11.5px] font-semibold text-[#f3eddf]">
                    {label}
                  </span>
                  <span className="mt-0.5 block text-[9.5px] leading-4 text-[#9eaea6]">
                    {note}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-9" aria-labelledby="manual-sections-title">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f2a6b5]">
                COMPLETE GUIDE
              </p>
              <h2
                id="manual-sections-title"
                className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-[#f4eee1] sm:text-3xl"
              >
                Choose a page. Follow the steps.
              </h2>
            </div>

            <p className="max-w-md text-[11.5px] leading-5 text-[#96a69f] sm:text-right">
              Yellow marks main actions. Maroon and soft pink call attention to
              account, admin, or safety details.
            </p>
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-2">
            {manualSections.map((section) => (
              <ManualCard key={section.id} section={section} />
            ))}
          </div>
        </section>

        <section className="mt-8 flex flex-col gap-4 rounded-[26px] border border-[#8f2335]/40 bg-[linear-gradient(120deg,rgba(143,35,53,0.15),rgba(246,207,88,0.055))] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#8f2335] text-[#ffe1e7]">
              <FileDown className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-[15px] font-semibold text-[#f8f0e4]">
                Before a permanent action
              </h2>
              <p className="mt-1 max-w-2xl text-[11.5px] leading-5 text-[#b9c4be]">
                Read the confirmation before deleting an account, removing a
                member, deleting a notice, or leaving a group. These actions may
                be hard or impossible to undo.
              </p>
            </div>
          </div>

          <Link
            href="/contact"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[#f6cf58] px-5 text-[11.5px] font-bold text-[#10241c] transition hover:bg-[#ffe082]"
          >
            Ask for help
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </section>
      </main>
    </div>
  );
}
