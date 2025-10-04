"use client";

export function ReportTabs() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b">
        <button className="px-4 py-2 border-b-2 border-primary text-primary">Monthly</button>
        <button className="px-4 py-2 text-muted-foreground">Yearly</button>
      </div>
    </div>
  );
}
