import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from 'react-dropzone';

function DraftsList({ drafts, onEdit, onDelete, onSchedule }: { drafts: any[]; onEdit: (draft: any) => void; onDelete: (id: string) => void; onSchedule: (draft: any) => void }) {
  if (!drafts.length) {
    return (
      <div className="text-center py-20">
        <i className="fas fa-file-alt text-6xl text-muted-foreground mb-4"></i>
        <h3 className="text-xl font-semibold text-foreground mb-2">No Drafts Yet</h3>
        <p className="text-muted-foreground">Start by creating a new post draft.</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {drafts.map((draft) => (
        <div key={draft.id} className="p-4 border rounded-lg flex items-center justify-between">
          <div>
            <div className="font-semibold">{draft.title || "Untitled Draft"}</div>
            <div className="text-xs text-muted-foreground">Last edited: {draft.updatedAt ? new Date(draft.updatedAt).toLocaleString() : "-"}</div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onEdit(draft)}>
              Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onDelete(draft.id)}>
              Delete
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onSchedule(draft)}>
              Schedule Post
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PostEditor({ open, onClose, draft, onSave }: { open: boolean; onClose: () => void; draft?: any; onSave: (data: any) => void }) {
  const [title, setTitle] = useState(draft?.title || "");
  const [content, setContent] = useState(draft?.content || "");
  const [media, setMedia] = useState<File[]>([]);
  const [scheduledAt, setScheduledAt] = useState(draft?.scheduledAt ? draft.scheduledAt.slice(0, 16) : "");
  const { getRootProps, getInputProps, acceptedFiles } = useDropzone({
    accept: {
      'image/*': [],
      'video/*': [],
      'audio/*': [],
      'application/pdf': []
    },
    onDrop: (files: File[]) => setMedia(files)
  });

  const handleSave = () => {
    onSave({
      ...draft,
      title,
      content,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      media
    });
    onClose();
  };

  return open ? (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">{draft ? "Edit Draft" : "New Post"}</h2>
        <input
          className="w-full p-2 border rounded mb-2 text-black placeholder:text-gray-400"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title (optional)"
        />
        <textarea
          className="w-full h-32 p-2 border rounded mb-2 text-black placeholder:text-gray-400"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Write your post..."
        />
        <div {...getRootProps()} className="border-2 border-dashed rounded p-4 mb-2 cursor-pointer text-center">
          <input {...getInputProps()} />
          <p>Drag & drop images, videos, audio, or PDFs here, or click to select files</p>
          {acceptedFiles.length > 0 && (
            <ul className="mt-2 text-xs text-muted-foreground">
              {acceptedFiles.map((file: File) => <li key={file.name}>{file.name}</li>)}
            </ul>
          )}
        </div>
        <input
          type="datetime-local"
          className="w-full p-2 border rounded mb-2 text-black placeholder:text-gray-400"
          value={scheduledAt}
          onChange={e => setScheduledAt(e.target.value)}
        />
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>{draft ? "Update Draft" : "Save Draft"}</Button>
        </div>
      </div>
    </div>
  ) : null;
}

export default function Studio() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<any>(null);
  const queryClient = useQueryClient();
  const { data: drafts = [], isLoading } = useQuery({
    queryKey: ["drafts"],
    queryFn: async () => {
      const res = await fetch("/api/studio/drafts");
      if (!res.ok) throw new Error("Failed to fetch drafts");
      return await res.json();
    }
  });
  const saveDraftMutation = useMutation({
    mutationFn: async (draft: any) => {
      const res = await fetch("/api/studio/drafts", {
        method: draft.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft)
      });
      if (!res.ok) throw new Error("Failed to save draft");
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["drafts"] })
  });
  const scheduleDraftMutation = useMutation({
    mutationFn: async (draft: any) => {
      const res = await fetch("/api/queue/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: draft.content,
          media: draft.media,
          scheduledAt: draft.scheduledAt || new Date().toISOString(),
          draftId: draft.id
        })
      });
      if (!res.ok) throw new Error("Failed to schedule draft");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
    }
  });
  const deleteDraft = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/studio/drafts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete draft");
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["drafts"] })
  });

  function handleSaveDraft(data: any) {
    saveDraftMutation.mutate(data);
  }
  function handleScheduleDraft(draft: any) {
    scheduleDraftMutation.mutate(draft);
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Studio"
          description="Create, edit, and schedule your content."
          actions={
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => { setEditingDraft(null); setEditorOpen(true); }}
              data-testid="button-new-post"
            >
              <i className="fas fa-plus mr-2"></i>
              New Post
            </Button>
          }
        />
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div>Loading drafts...</div>
          ) : (
            <DraftsList drafts={drafts} onEdit={draft => { setEditingDraft(draft); setEditorOpen(true); }} onDelete={id => deleteDraft.mutate(id)} onSchedule={handleScheduleDraft} />
          )}
        </div>
        <PostEditor open={editorOpen} onClose={() => setEditorOpen(false)} draft={editingDraft} onSave={handleSaveDraft} />
      </main>
    </div>
  );
}
