import { useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { Check, RotateCcw, Upload, X, BookOpen } from "lucide-react";
import { courses } from "@/data/coursesData";
import { getCourseVisualSettings } from "@/lib/courses/coursesStore";
import {
  getControlCentreSettings,
  saveControlCentreSettings,
  resetControlCentreSettings,
  type FeaturedSlot,
  type ControlCentreSettings,
} from "@/lib/controlCentre/controlCentreStore";

const allCourses = courses; // full catalog (free + deep)

/**
 * Admin page: Control Centre Settings
 *
 * Lets the admin choose which 2 courses appear in the Featured Courses section
 * of the Control Centre, and optionally override each thumbnail with an
 * uploaded image (e.g. a brief video thumbnail or promotional graphic).
 */

const SlotEditor = ({
  index,
  slot,
  onChange,
}: {
  index: number;
  slot: FeaturedSlot;
  onChange: (updated: FeaturedSlot) => void;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);

  // Resolve thumbnail preview
  const course = allCourses.find((c) => c.id === slot.courseId);
  const courseVisual = course ? getCourseVisualSettings(course.id) : null;
  const previewThumb =
    slot.thumbnailOverride || courseVisual?.thumbnailUrl || null;
  const displayTitle = slot.titleOverride || course?.title || "(no course selected)";

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ ...slot, thumbnailOverride: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">
        Slot {index + 1}
      </h3>

      {/* Course picker */}
      <div>
        <label className="block text-xs text-muted-foreground mb-1">
          Course
        </label>
        <select
          value={slot.courseId}
          onChange={(e) => onChange({ ...slot, courseId: e.target.value, titleOverride: null, descriptionOverride: null })}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">— Select a course —</option>
          {allCourses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} ({c.courseType} · {c.lifecycleState})
            </option>
          ))}
        </select>
      </div>

      {/* Title override */}
      <div>
        <label className="block text-xs text-muted-foreground mb-1">
          Title override{" "}
          <span className="text-[10px] text-muted-foreground/60">(leave blank to use course title)</span>
        </label>
        <input
          value={slot.titleOverride || ""}
          onChange={(e) => onChange({ ...slot, titleOverride: e.target.value || null })}
          placeholder={course?.title || ""}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Description override */}
      <div>
        <label className="block text-xs text-muted-foreground mb-1">
          Description override{" "}
          <span className="text-[10px] text-muted-foreground/60">(leave blank to use course description)</span>
        </label>
        <input
          value={slot.descriptionOverride || ""}
          onChange={(e) => onChange({ ...slot, descriptionOverride: e.target.value || null })}
          placeholder={course?.description || ""}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Thumbnail override */}
      <div>
        <label className="block text-xs text-muted-foreground mb-1">
          Thumbnail override{" "}
          <span className="text-[10px] text-muted-foreground/60">(upload image to replace course thumbnail)</span>
        </label>

        {/* Preview */}
        <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 border border-border mb-2">
          {previewThumb ? (
            <img src={previewThumb} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/90 rounded-full p-3">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Upload className="h-3 w-3" /> Upload image
          </button>
          {slot.thumbnailOverride && (
            <button
              onClick={() => onChange({ ...slot, thumbnailOverride: null })}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <X className="h-3 w-3" /> Remove override
            </button>
          )}
        </div>
      </div>

      {/* Mini live preview */}
      <div className="pt-2 border-t border-border">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Live preview</p>
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden max-w-xs">
          <div className="relative h-24 bg-gradient-to-br from-[#2563EB]/10 to-[#7C3AED]/10 overflow-hidden">
            {previewThumb ? (
              <img src={previewThumb} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 rounded-full p-2">
                  <BookOpen className="h-4 w-4 text-[#6B7280]" />
                </div>
              </div>
            )}
          </div>
          <div className="p-3">
            <p className="text-[13px] font-semibold text-[#111827] line-clamp-1">{displayTitle}</p>
            <p className="text-[11px] text-[#6B7280] line-clamp-1 mt-0.5">
              {slot.descriptionOverride || course?.description || ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ControlCentreSettingsPage = () => {
  const [settings, setSettings] = useState<ControlCentreSettings>(getControlCentreSettings);
  const [saved, setSaved] = useState(false);

  const updateSlot = (index: 0 | 1 | 2, updated: FeaturedSlot) => {
    const next = { ...settings };
    next.featuredSlots = [...settings.featuredSlots] as [FeaturedSlot, FeaturedSlot, FeaturedSlot];
    next.featuredSlots[index] = updated;
    setSettings(next);
    setSaved(false);
  };

  const handleSave = () => {
    saveControlCentreSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetControlCentreSettings();
    setSettings(getControlCentreSettings());
    setSaved(false);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Control Centre Settings"
        description="Configure which courses and thumbnails appear in the Featured Courses section. Slot 1 is the flagship hero (60% width). Slots 2 & 3 stack on the right (40% width)."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
        <SlotEditor index={0} slot={settings.featuredSlots[0]} onChange={(s) => updateSlot(0, s)} />
        <SlotEditor index={1} slot={settings.featuredSlots[1]} onChange={(s) => updateSlot(1, s)} />
        <SlotEditor index={2} slot={settings.featuredSlots[2]} onChange={(s) => updateSlot(2, s)} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Check className="h-4 w-4" />
          {saved ? "Saved!" : "Save"}
        </button>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="h-4 w-4" /> Reset to defaults
        </button>
      </div>
    </AppLayout>
  );
};

export default ControlCentreSettingsPage;
