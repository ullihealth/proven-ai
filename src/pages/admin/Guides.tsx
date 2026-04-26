import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Guide {
  id: number;
  title: string;
  description: string;
  image_url: string;
  pdf_url: string;
  sort_order: number;
  is_active: number;
}

const EMPTY_FORM = {
  title: "",
  description: "",
  image_url: "",
  pdf_url: "",
  sort_order: 0,
  is_active: true,
};

type FormData = typeof EMPTY_FORM;

const DRAFT_KEY = "proven-ai-guide-draft";

const loadDraft = (): FormData | null => {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as FormData;
    if (!parsed.title && !parsed.image_url && !parsed.pdf_url) return null;
    return parsed;
  } catch {
    return null;
  }
};

export default function GuidesManagement() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [hasDraft, setHasDraft] = useState(() => loadDraft() !== null);

  /* ── Load ── */
  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/guides", { credentials: "include" });
      const data = await res.json();
      if (data.ok) setGuides(data.guides);
      else toast.error("Failed to load guides");
    } catch {
      toast.error("Failed to load guides");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* ── Open dialog ── */
  const openAdd = () => {
    setEditingId(null);
    const draft = loadDraft();
    if (draft) {
      setForm(draft);
      toast.info("Draft restored — continue where you left off");
    } else {
      setForm(EMPTY_FORM);
    }
    setDialogOpen(true);
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    setForm(EMPTY_FORM);
  };

  const openEdit = (guide: Guide) => {
    setEditingId(guide.id);
    setForm({
      title: guide.title,
      description: guide.description || "",
      image_url: guide.image_url,
      pdf_url: guide.pdf_url,
      sort_order: guide.sort_order,
      is_active: guide.is_active === 1,
    });
    setDialogOpen(true);
  };

  /* ── Save ── */
  const save = async () => {
    if (!form.title.trim() || !form.image_url.trim() || !form.pdf_url.trim()) {
      toast.error("Title, Image URL, and PDF URL are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...(editingId !== null && { id: editingId }),
        title: form.title.trim(),
        description: form.description.trim(),
        image_url: form.image_url.trim(),
        pdf_url: form.pdf_url.trim(),
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
      };

      const res = await fetch("/api/admin/guides", {
        method: editingId !== null ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.ok) {
        toast.success(editingId !== null ? "Guide updated" : "Guide created");
        if (editingId === null) {
          localStorage.removeItem(DRAFT_KEY);
          setHasDraft(false);
        }
        setDialogOpen(false);
        await load();
      } else {
        toast.error(data.error || "Save failed");
      }
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
  const deleteGuide = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/guides?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Guide deleted");
        await load();
      } else {
        toast.error("Delete failed");
      }
    } catch {
      toast.error("Delete failed");
    }
  };

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    const next = { ...form, [key]: value };
    if (editingId === null) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      setHasDraft(true);
    }
    setForm(next);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Guides"
        description="Manage downloadable guide cards shown on the Guides page. Set the cover image URL and PDF URL for each guide — upload files to Cloudflare first, then paste the public URLs here."
      />

      <div className="max-w-5xl mx-auto">
        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={openAdd} className="relative">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Guide
            {hasDraft && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400 border-2 border-white" />
            )}
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-sm text-[#9CA3AF] py-8 text-center">Loading…</p>
        ) : guides.length === 0 ? (
          <p className="text-sm text-[#9CA3AF] py-8 text-center">
            No guides yet. Click "Add Guide" to create one.
          </p>
        ) : (
          <div className="rounded-lg border border-[#E5E7EB] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F9FAFB]">
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Image URL</TableHead>
                  <TableHead className="hidden md:table-cell">PDF URL</TableHead>
                  <TableHead className="w-20 text-center">Status</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guides.map((guide) => (
                  <TableRow key={guide.id} className="hover:bg-[#F9FAFB]">
                    <TableCell className="text-center text-xs text-[#9CA3AF]">
                      {guide.sort_order}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm text-[#111827]">{guide.title}</p>
                      {guide.description && (
                        <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-1">{guide.description}</p>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-xs text-[#6B7280] font-mono truncate block max-w-[200px]">
                        {guide.image_url}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-xs text-[#6B7280] font-mono truncate block max-w-[200px]">
                        {guide.pdf_url}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={guide.is_active ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {guide.is_active ? "Active" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => openEdit(guide)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete guide?</AlertDialogTitle>
                              <AlertDialogDescription>
                                "{guide.title}" will be permanently removed.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => deleteGuide(guide.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId !== null ? "Edit Guide" : "Add Guide"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="g-title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="g-title"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="e.g. Getting Started with ChatGPT"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="g-desc">Description</Label>
              <Textarea
                id="g-desc"
                rows={2}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Short description shown on the card"
                className="resize-none"
              />
            </div>

            {/* Image URL */}
            <div className="space-y-1.5">
              <Label htmlFor="g-image">
                Cloudflare Image URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="g-image"
                value={form.image_url}
                onChange={(e) => setField("image_url", e.target.value)}
                placeholder="https://pub-xxx.r2.dev/guides/cover.jpg"
              />
              <p className="text-xs text-[#9CA3AF]">
                Upload to Cloudflare R2, then paste the public URL here.
              </p>
            </div>

            {/* PDF URL */}
            <div className="space-y-1.5">
              <Label htmlFor="g-pdf">
                Cloudflare PDF URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="g-pdf"
                value={form.pdf_url}
                onChange={(e) => setField("pdf_url", e.target.value)}
                placeholder="https://pub-xxx.r2.dev/guides/guide.pdf"
              />
            </div>

            {/* Sort order + Active */}
            <div className="flex items-end gap-4">
              <div className="space-y-1.5 w-28">
                <Label htmlFor="g-order">Sort Order</Label>
                <Input
                  id="g-order"
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) => setField("sort_order", Number(e.target.value))}
                />
              </div>
              <div className="flex items-center gap-2 pb-1">
                <Switch
                  id="g-active"
                  checked={form.is_active}
                  onCheckedChange={(v) => setField("is_active", v)}
                />
                <Label htmlFor="g-active" className="cursor-pointer">
                  Active (visible on site)
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center">
            {editingId === null && hasDraft && (
              <button
                type="button"
                onClick={clearDraft}
                className="text-xs text-[#9CA3AF] hover:text-red-500 underline underline-offset-2 mr-auto"
              >
                Clear draft
              </button>
            )}
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : editingId !== null ? "Save Changes" : "Create Guide"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
