import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";

// Google Calendar event type
interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  location?: string;
}

export default function Calendar() {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);

  useEffect(() => {
    // Check for success message in URL and fetch events
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'connected') {
      // Optionally show a toast or message here
    }
    fetch("/api/oauth/calendar/events")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setIsConnected(true);
          setEvents(data);
        } else {
          setIsConnected(false);
        }
      });
  }, []);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Calendar"
          description="Schedule and manage your content across all platforms."
          actions={
            isConnected ? (
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <i className="fas fa-plus mr-2"></i>
                Schedule Post
              </Button>
            ) : (
              <Button 
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/oauth/connect/google");
                    if (!res.ok) throw new Error("Failed to connect to Google Calendar");
                    const data = await res.json();
                    if (data.authUrl) {
                      window.location.href = data.authUrl;
                    } else {
                      alert("Google Calendar connection failed. Please try again.");
                    }
                  } catch (err) {
                    alert("Google Calendar connection failed. Please try again.");
                  }
                }}
                data-testid="button-connect-google-calendar"
              >
                <i className="fab fa-google mr-2"></i>
                Connect Google Calendar
              </Button>
            )
          }
        />
        <div className="flex-1 overflow-auto p-6">
          {isConnected ? (
            <div className="text-center py-20">
              <i className="fas fa-calendar-alt text-6xl text-primary mb-4"></i>
              <h3 className="text-xl font-semibold text-foreground mb-2">Your Google Calendar</h3>
              {events.length === 0 ? (
                <p className="text-muted-foreground">No upcoming events found.</p>
              ) : (
                <ul className="mt-6 space-y-4">
                  {events.map(event => (
                    <li key={event.id} className="bg-card rounded p-4 shadow">
                      <div className="font-bold text-lg mb-1">{event.summary}</div>
                      <div className="text-sm text-muted-foreground">
                        {event.start?.dateTime || event.start?.date}
                        {event.location && <> &mdash; {event.location}</>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="text-center py-20">
              <i className="fab fa-google text-6xl text-muted-foreground mb-4"></i>
              <h3 className="text-xl font-semibold text-foreground mb-2">Connect Your Google Calendar</h3>
              <p className="text-muted-foreground">
                To view and manage your events, connect your Google Calendar.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
