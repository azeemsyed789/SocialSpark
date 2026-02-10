import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { StatusDot } from "@/components/ui/status-dot";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

// Define form state type above the component
export type FormState = {
  date: string;
  time: string;
  platform: string;
  tagline: string;
  campaignId: string;
  accountId: string;
  contentType: string;
};

export function ContentCalendar() {
  const [viewMode, setViewMode] = useState<"week" | "month" | "day">("week");
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<FormState>({
    date: "",
    time: "",
    platform: "tiktok",
    tagline: "",
    campaignId: "",
    accountId: "",
    contentType: "text"
  });
  const queryClient = useQueryClient();

  // Fetch campaigns and accounts for dropdowns
  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery<any[]>({
    queryKey: ["/api/campaigns"],
  });
  const { data: accounts = [], isLoading: loadingAccounts } = useQuery<any[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: slots, isLoading } = useQuery({
    queryKey: ["/api/calendar/slots"],
  });

  const addSlot = useMutation({
    mutationFn: async (data: any) => {
      await fetch("/api/calendar/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/slots"] });
      setShowDialog(false);
      setForm({ date: "", time: "", platform: "tiktok", tagline: "", campaignId: "", accountId: "", contentType: "text" });
    },
  });

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  // Generate mock calendar days for demo
  const generateCalendarDays = (): { date: number; slots: any[] }[] => {
    const days: { date: number; slots: any[] }[] = [];
    for (let i = 18; i <= 24; i++) {
      days.push({
        date: i,
        slots: Array.isArray(slots) ? slots.filter((slot: any) => new Date(slot.scheduledAt).getDate() === i) : []
      });
    }
    return days;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32" />
          <div className="flex space-x-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-16" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </Card>
    );
  }

  const calendarDays = generateCalendarDays();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Content Calendar</h3>
        <div className="flex items-center space-x-2">
          {(["week", "month", "day"] as const).map((mode) => (
            <Button
              key={mode}
              variant={viewMode === mode ? "default" : "ghost"}
              size="sm"
              className={viewMode === mode ? "bg-primary text-primary-foreground" : ""}
              onClick={() => setViewMode(mode)}
              data-testid={`calendar-view-${mode}`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Button>
          ))}
          <Button size="sm" onClick={() => setShowDialog(true)} data-testid="add-slot-btn">Add Slot</Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4 mb-4">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm text-muted-foreground font-medium">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-4 min-h-[300px]">
        {calendarDays.map((day, dayIndex) => (
          <div key={dayIndex} className="border border-border rounded-lg p-2 min-h-[120px]">
            <div className={`text-sm mb-2 ${day.date === 21 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{day.date}</div>
            <div className="space-y-1">
              {day.slots.length === 0 && dayIndex < 3 && (
                // Show demo content for first few days
                <div className="calendar-slot bg-primary/10 p-1 rounded cursor-pointer hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <PlatformBadge platform={dayIndex === 0 ? "tiktok" : dayIndex === 1 ? "instagram" : "linkedin"} />
                    <StatusDot status={dayIndex === 0 ? "scheduled" : dayIndex === 1 ? "posted" : "failed"} />
                  </div>
                  <p className="text-xs text-foreground mt-1 truncate">
                    {dayIndex === 0 ? "SaaS Launch Hook" : dayIndex === 1 ? "B2B Pain Point" : "LinkedIn Post"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dayIndex === 0 ? "2:30 PM" : dayIndex === 1 ? "10:00 AM" : "11:30 AM"}
                  </p>
                </div>
              )}
              {day.slots.map((slot: any) => (
                <div 
                  key={slot.id}
                  className="calendar-slot bg-primary/10 p-1 rounded cursor-pointer hover:shadow-md transition-shadow"
                  data-testid={`calendar-slot-${slot.id}`}
                >
                  <div className="flex items-center justify-between">
                    <PlatformBadge platform={slot.account?.platform} />
                    <StatusDot status={slot.status} />
                  </div>
                  <p className="text-xs text-foreground mt-1 truncate">
                    {slot.tagline || "Untitled"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(slot.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogTitle>Add Content Slot</DialogTitle>
          <form onSubmit={e => {
            e.preventDefault();
            addSlot.mutate({
              scheduledAt: new Date(`${form.date}T${form.time}`),
              platform: form.platform,
              tagline: form.tagline,
              campaignId: form.campaignId,
              accountId: form.accountId,
              contentType: form.contentType,
              status: "draft"
            });
          }}>
            <div className="space-y-4">
              <Input type="date" value={form.date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, date: e.target.value }))} required />
              <Input type="time" value={form.time} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, time: e.target.value }))} required />
              <Select value={form.platform} onValueChange={(v: string) => setForm(f => ({ ...f, platform: v }))}>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="youtube">YouTube</option>
                <option value="discord">Discord</option>
              </Select>
              <select value={form.campaignId} onChange={e => setForm(f => ({ ...f, campaignId: e.target.value }))} required className="w-full border rounded px-2 py-1">
                <option value="">Select Campaign</option>
                {campaigns.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))} required className="w-full border rounded px-2 py-1">
                <option value="">Select Account</option>
                {accounts.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.platform}: {a.handle}</option>
                ))}
              </select>
              <select value={form.contentType} onChange={e => setForm(f => ({ ...f, contentType: e.target.value }))} required className="w-full border rounded px-2 py-1">
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="carousel">Carousel</option>
              </select>
              <Input placeholder="Tagline" value={form.tagline} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, tagline: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="submit" disabled={addSlot.status === "pending"}>Add</Button>
              <Button type="button" variant="ghost" onClick={() => setShowDialog(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
