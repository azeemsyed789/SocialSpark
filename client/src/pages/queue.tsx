import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PostJob } from "@/../../shared/schema";
import { useState } from "react";
import { useDropzone } from 'react-dropzone';

function getJobContent(job: any) {
  // Fallback for jobs without content field
  return job && typeof job === 'object' && 'content' in job ? job.content || '' : '';
}

function QueueList({ jobs, onEdit, onDelete, onReschedule }: { jobs: PostJob[]; onEdit: (job: PostJob) => void; onDelete: (id: string) => void; onReschedule: (job: PostJob) => void }) {
  if (!jobs.length) {
    return (
      <div className="text-center py-20">
        <i className="fas fa-list text-6xl text-muted-foreground mb-4"></i>
        <h3 className="text-xl font-semibold text-foreground mb-2">No Scheduled Posts</h3>
        <p className="text-muted-foreground">Your queue is empty. Scheduled posts will appear here.</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div key={job.id} className="p-4 border rounded-lg flex items-center justify-between">
          <div>
            <div className="font-semibold">Scheduled: {job.scheduledAt ? new Date(job.scheduledAt).toLocaleString() : "-"}</div>
            <div className="text-xs text-muted-foreground">Status: {job.status}</div>
            {job.error && <div className="text-xs text-red-500">Error: {job.error}</div>}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onEdit(job)}>Edit</Button>
            <Button size="sm" variant="secondary" onClick={() => onReschedule(job)}>Reschedule</Button>
            <Button size="sm" variant="destructive" onClick={() => onDelete(job.id)}>Delete</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function EditQueueJobModal({ open, job, onClose, onSave }: { open: boolean; job?: any; onClose: () => void; onSave: (data: any) => void }) {
  const [scheduledAt, setScheduledAt] = useState(job?.scheduledAt ? new Date(job.scheduledAt).toISOString().slice(0, 16) : "");
  const [error, setError] = useState("");
  const [content, setContent] = useState(getJobContent(job));
  const [media, setMedia] = useState<File[]>([]);
  const { getRootProps, getInputProps, acceptedFiles } = useDropzone({
    accept: { 'image/*': [], 'video/*': [] },
    onDrop: (files: File[]) => setMedia(files)
  });

  const handleSave = () => {
    if (!scheduledAt) {
      setError("Scheduled time is required");
      return;
    }
    if (!content.trim()) {
      setError("Content is required");
      return;
    }
    onSave({ id: job?.id, scheduledAt: new Date(scheduledAt), content: content || undefined });
    onClose();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Scheduled Post</h2>
        <input
          type="datetime-local"
          className="w-full p-2 border rounded mb-2 text-black placeholder:text-gray-400 focus:ring-2 focus:ring-primary"
          value={scheduledAt}
          onChange={e => setScheduledAt(e.target.value)}
        />
        <textarea
          className="w-full h-32 p-2 border rounded mb-2 text-black placeholder:text-gray-400 focus:ring-2 focus:ring-primary"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Edit post content..."
        />
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}

export default function Queue() {
  const queryClient = useQueryClient();
  const { data: jobs = [], isLoading } = useQuery<PostJob[]>({
    queryKey: ["queue-jobs"],
    queryFn: async () => {
      const res = await fetch("/api/queue/jobs");
      if (!res.ok) throw new Error("Failed to fetch queue jobs");
      return await res.json();
    }
  });
  const addJobMutation = useMutation({
    mutationFn: async (job: any) => {
      const res = await fetch("/api/queue/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job)
      });
      if (!res.ok) throw new Error("Failed to add job to queue");
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["queue-jobs"] })
  });

  const deleteJob = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/queue/jobs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete job");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["queue-jobs"] })
  });

  const updateJob = useMutation({
    mutationFn: async (data: { id?: string; scheduledAt?: Date; content?: string }) => {
      const res = await fetch(`/api/queue/jobs/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: data.scheduledAt, content: data.content })
      });
      if (!res.ok) throw new Error("Failed to update job");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["queue-jobs"] })
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<PostJob | null>(null);

  const handleEdit = (job: PostJob) => {
    setEditingJob(job);
    setEditModalOpen(true);
  };
  const handleReschedule = (job: PostJob) => {
    setEditingJob(job);
    setEditModalOpen(true);
  };
  const handleSaveEdit = (data: { id?: string; scheduledAt?: Date; content?: string }) => {
    updateJob.mutate({
      ...data,
      content: data.content ?? undefined // ensure no null
    });
  };
  function handleAddJob(data: any) {
    addJobMutation.mutate(data);
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Queue"
          description="Monitor and manage your posting queue."
          actions={
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-process-queue"
            >
              <i className="fas fa-play mr-2"></i>
              Process Queue
            </Button>
          }
        />
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div>Loading queue...</div>
          ) : (
            <QueueList jobs={jobs} onEdit={handleEdit} onDelete={id => deleteJob.mutate(id)} onReschedule={handleReschedule} />
          )}
        </div>
        <EditQueueJobModal open={editModalOpen} job={editingJob || undefined} onClose={() => setEditModalOpen(false)} onSave={handleSaveEdit} />
      </main>
    </div>
  );
}
