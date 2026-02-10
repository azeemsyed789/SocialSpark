import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Calendar } from "../components/ui/calendar";
import { Select } from "../components/ui/select";

// Fetch connected accounts
function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await fetch("/api/accounts");
      if (!res.ok) throw new Error("Failed to fetch accounts");
      return res.json();
    },
  });
}

export default function SchedulePostPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: accounts, isLoading } = useAccounts();
  const [selectedAccount, setSelectedAccount] = useState("");
  const [content, setContent] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [status, setStatus] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/calendar/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selectedAccount,
          content,
          scheduledAt,
        }),
      });
      if (!res.ok) throw new Error("Failed to schedule post");
      return res.json();
    },
    onSuccess: () => {
      setStatus("success");
      queryClient.invalidateQueries({ queryKey: ["calendar-slots"] });
      setTimeout(() => navigate("/dashboard"), 1200);
    },
    onError: () => setStatus("error"),
  });

  return (
    <div className="max-w-xl mx-auto mt-10">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Schedule a Post</h2>
        {isLoading ? (
          <div>Loading accounts...</div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            className="space-y-4"
          >
            <Select
              value={selectedAccount}
              onValueChange={setSelectedAccount}
              required
            >
              <option value="">Select Account</option>
              {accounts?.map((acc: any) => (
                <option key={acc.id} value={acc.id}>
                  {acc.platform}: {acc.username || acc.displayName}
                </option>
              ))}
            </Select>
            <Textarea
              placeholder="Write your post content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
            <Button type="submit" disabled={mutation.status === "pending"}>
              {mutation.status === "pending" ? "Scheduling..." : "Schedule Post"}
            </Button>
            {status === "success" && (
              <div className="text-green-600">Post scheduled!</div>
            )}
            {status === "error" && (
              <div className="text-red-600">Failed to schedule post.</div>
            )}
          </form>
        )}
      </Card>
    </div>
  );
}
