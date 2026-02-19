import { useState, useRef, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { GovernanceHeader } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadImage, deleteImage } from "@/lib/image/imageApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, Image as ImageIcon, Save, RotateCcw, Loader2 } from "lucide-react";
import {
  getEditorsPicks,
  saveEditorsPicks,
  resetEditorsPicks,
  LINK_TARGETS,
  type EditorPick,
} from "@/lib/editorsPicks/editorsPicksStore";

/**
 * Admin page for managing the two Top Topics shown on the Control Centre.
 * Upload thumbnails, set headlines, summaries, metadata, and link targets.
 */

export default function EditorsPicksManagement() {
  const [picks, setPicks] = useState<EditorPick[]>(getEditorsPicks);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const update = useCallback(
    (id: string, partial: Partial<EditorPick>) => {
      setPicks((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...partial } : p))
      );
      setSaved(false);
    },
    []
  );

  const handleSave = async () => {
    const ok = await saveEditorsPicks(picks);
    if (ok) {
      setSaved(true);
      setSaveError(false);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setSaveError(true);
    }
  };

  const handleReset = async () => {
    await resetEditorsPicks();
    setPicks(getEditorsPicks());
    setSaved(false);
    setSaveError(false);
  };

  return (
    <AppLayout>
      <GovernanceHeader
        title="Top Topics"
        description="Manage the two curated editorial rows on the Control Centre."
      />

      <div className="space-y-10 max-w-3xl">
        {picks.map((pick, i) => (
          <PickEditor
            key={pick.id}
            pick={pick}
            index={i}
            onUpdate={update}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-8">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          {saved ? "Saved ✓" : "Save Changes"}
        </Button>
        <Button variant="outline" onClick={handleReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>

      {saveError && (
        <div className="mt-3 bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm text-destructive max-w-xl">
          <strong>Save failed</strong> — browser storage is full. Try removing unused images or clearing old settings.
        </div>
      )}
    </AppLayout>
  );
}

/* ── Single pick editor ── */

function PickEditor({
  pick,
  index,
  onUpdate,
}: {
  pick: EditorPick;
  index: number;
  onUpdate: (id: string, partial: Partial<EditorPick>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const imageKey = `topic-pick-${index}`;
    const url = await uploadImage(imageKey, file, { maxWidth: 800, maxHeight: 600, quality: 0.75 });
    setUploading(false);
    if (url) {
      onUpdate(pick.id, { thumbnailUrl: url });
    }
    // Reset so same file can be re-selected
    e.target.value = "";
  };

  const clearThumbnail = async () => {
    const imageKey = `topic-pick-${index}`;
    await deleteImage(imageKey);
    onUpdate(pick.id, { thumbnailUrl: "" });
  };

  return (
    <section>
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Pick {index + 1} — {index === 0 ? "Image Left" : "Image Right"}
      </h3>

      {/* Thumbnail upload */}
      <div className="mb-5">
        <Label className="text-xs text-muted-foreground mb-2 block">
          Thumbnail (16:9 recommended)
        </Label>

        {pick.thumbnailUrl ? (
          <div className="relative w-full max-w-sm rounded overflow-hidden border border-border">
            <div className="relative" style={{ paddingBottom: "56.25%" }}>
              <img
                src={pick.thumbnailUrl}
                alt="Thumbnail preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <button
              onClick={clearThumbnail}
              className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-3 w-full max-w-sm h-28 rounded border border-dashed border-border hover:border-foreground/30 transition-colors justify-center text-muted-foreground"
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <ImageIcon className="h-6 w-6" />
            )}
            <span className="text-sm">{uploading ? "Uploading…" : "Click to upload image"}</span>
          </button>
        )}

        {pick.thumbnailUrl && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 gap-2"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            Replace
          </Button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {/* Headline */}
      <div className="mb-4">
        <Label htmlFor={`headline-${pick.id}`} className="text-xs text-muted-foreground mb-1 block">
          Headline
        </Label>
        <Input
          id={`headline-${pick.id}`}
          value={pick.headline}
          onChange={(e) => onUpdate(pick.id, { headline: e.target.value })}
          placeholder="Headline text"
        />
      </div>

      {/* Summary */}
      <div className="mb-4">
        <Label htmlFor={`summary-${pick.id}`} className="text-xs text-muted-foreground mb-1 block">
          Summary (one line)
        </Label>
        <Input
          id={`summary-${pick.id}`}
          value={pick.summary}
          onChange={(e) => onUpdate(pick.id, { summary: e.target.value })}
          placeholder="Brief summary"
        />
      </div>

      {/* Meta */}
      <div className="mb-4">
        <Label htmlFor={`meta-${pick.id}`} className="text-xs text-muted-foreground mb-1 block">
          Metadata (optional — e.g. "5 min read")
        </Label>
        <Input
          id={`meta-${pick.id}`}
          value={pick.meta}
          onChange={(e) => onUpdate(pick.id, { meta: e.target.value })}
          placeholder="5 min read"
        />
      </div>

      {/* Link target */}
      <div className="mb-4">
        <Label className="text-xs text-muted-foreground mb-1 block">
          Links to
        </Label>
        <Select
          value={pick.href}
          onValueChange={(v) => onUpdate(pick.id, { href: v })}
        >
          <SelectTrigger className="w-full max-w-sm">
            <SelectValue placeholder="Select page" />
          </SelectTrigger>
          <SelectContent>
            {LINK_TARGETS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom URL override */}
      <div>
        <Label htmlFor={`href-${pick.id}`} className="text-xs text-muted-foreground mb-1 block">
          Or enter a custom path
        </Label>
        <Input
          id={`href-${pick.id}`}
          value={pick.href}
          onChange={(e) => onUpdate(pick.id, { href: e.target.value })}
          placeholder="/daily/monday"
          className="max-w-sm"
        />
      </div>

      {index === 0 && (
        <div className="h-px bg-border mt-8" />
      )}
    </section>
  );
}
