import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, GripVertical, RotateCcw, Save } from "lucide-react";
import {
  getPlatformUpdates,
  savePlatformUpdates,
  resetPlatformUpdates,
  newUpdateId,
  UPDATE_LINK_TARGETS,
  LABEL_PRESETS,
  type PlatformUpdate,
} from "@/lib/platformUpdates/platformUpdatesStore";
import { useToast } from "@/hooks/use-toast";

export default function PlatformUpdatesManagement() {
  const [items, setItems] = useState<PlatformUpdate[]>(getPlatformUpdates);
  const { toast } = useToast();

  /* ── Add a blank item ── */
  const addItem = () => {
    setItems((prev) => [
      {
        id: newUpdateId(),
        label: "NEW",
        title: "",
        href: "",
        date: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  /* ── Remove an item ── */
  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((u) => u.id !== id));
  };

  /* ── Update a field ── */
  const updateField = (
    id: string,
    field: keyof PlatformUpdate,
    value: string
  ) => {
    setItems((prev) =>
      prev.map((u) => (u.id === id ? { ...u, [field]: value } : u))
    );
  };

  /* ── Move item up/down ── */
  const moveItem = (index: number, direction: -1 | 1) => {
    const next = [...items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  };

  /* ── Save ── */
  const save = async () => {
    // Validate: every item needs a title + href
    const invalid = items.find((u) => !u.title.trim() || !u.href);
    if (invalid) {
      toast({
        title: "Missing fields",
        description: "Every update needs a title and a link target.",
        variant: "destructive",
      });
      return;
    }
    await savePlatformUpdates(items);
    toast({ title: "Saved", description: `${items.length} update(s) saved.` });
  };

  /* ── Reset ── */
  const reset = async () => {
    await resetPlatformUpdates();
    setItems(getPlatformUpdates());
    toast({ title: "Reset", description: "Restored default updates." });
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">
              Platform Updates
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Manage the ticker items shown in the Platform Updates section on
              the Control Centre. Users see the most recent items first and can
              scroll to see older updates.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
            <Button size="sm" onClick={save}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save
            </Button>
          </div>
        </div>

        {/* Add button */}
        <Button
          variant="outline"
          size="sm"
          className="mb-4"
          onClick={addItem}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Update
        </Button>

        {/* Items list */}
        <div className="space-y-3">
          {items.length === 0 && (
            <p className="text-sm text-[#9CA3AF] py-8 text-center">
              No updates. Click "Add Update" to create one.
            </p>
          )}

          {items.map((item, index) => (
            <div
              key={item.id}
              className="border border-[#E5E7EB] rounded-lg p-4 bg-white"
            >
              <div className="flex items-start gap-3">
                {/* Reorder handle + controls */}
                <div className="flex flex-col items-center gap-1 pt-1">
                  <GripVertical className="h-4 w-4 text-[#D1D5DB]" />
                  <button
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    className="text-[10px] text-[#6B7280] hover:text-[#111827] disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveItem(index, 1)}
                    disabled={index === items.length - 1}
                    className="text-[10px] text-[#6B7280] hover:text-[#111827] disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>

                {/* Fields */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Label */}
                  <div>
                    <Label className="text-xs text-[#6B7280]">Label</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Select
                        value={item.label}
                        onValueChange={(v) => updateField(item.id, "label", v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LABEL_PRESETS.map((lp) => (
                            <SelectItem key={lp} value={lp}>
                              {lp}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <Label className="text-xs text-[#6B7280]">Date</Label>
                    <Input
                      type="date"
                      className="h-8 text-xs mt-1"
                      value={item.date.slice(0, 10)}
                      onChange={(e) =>
                        updateField(
                          item.id,
                          "date",
                          new Date(e.target.value).toISOString()
                        )
                      }
                    />
                  </div>

                  {/* Title — full width */}
                  <div className="md:col-span-2">
                    <Label className="text-xs text-[#6B7280]">Title</Label>
                    <Input
                      className="h-8 text-sm mt-1"
                      placeholder="e.g. New AI Safety Course now live"
                      value={item.title}
                      onChange={(e) =>
                        updateField(item.id, "title", e.target.value)
                      }
                    />
                  </div>

                  {/* Link target */}
                  <div className="md:col-span-2">
                    <Label className="text-xs text-[#6B7280]">
                      Link Target
                    </Label>
                    <Select
                      value={item.href}
                      onValueChange={(v) => updateField(item.id, "href", v)}
                    >
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue placeholder="Choose destination…" />
                      </SelectTrigger>
                      <SelectContent>
                        {UPDATE_LINK_TARGETS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-[#D1D5DB] hover:text-red-500 transition-colors pt-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Preview row */}
              <div className="mt-3 pt-3 border-t border-[#F3F4F6]">
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1">
                  Preview
                </p>
                <div className="flex items-center gap-2.5 h-8 px-0.5">
                  <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider w-[80px] flex-shrink-0 font-mono">
                    {item.label}
                  </span>
                  <span className="text-[13px] font-medium text-[#1F2937] truncate flex-1">
                    {item.title || "Untitled"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
