import { useState, useCallback, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { GovernanceHeader } from "@/components/admin";
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
import { Save, RotateCcw, ArrowUp, ArrowDown, X } from "lucide-react";
import {
  getFooterConfig,
  saveFooterConfig,
  SECTION_INDEX_ROUTES,
  type FooterConfig,
  type SectionMode,
  type FooterSelectedItem,
} from "@/lib/footer/footerStore";
import { getCourses, loadCourses } from "@/lib/courses/coursesStore";

/* ── Available entities for each dynamic section ── */
function getCourseOptions(): FooterSelectedItem[] {
  return getCourses().map((c) => ({
    id: c.id,
    label: c.title,
    href: c.href,
  }));
}

// TODO: Replace with real publications data when available
const PUBLICATION_OPTIONS: FooterSelectedItem[] = [
  { id: "guides", label: "Guides Library", href: "/learn/guides" },
  { id: "guides-discover", label: "Discover Guides", href: "/learn/guides/discover" },
  { id: "prompts", label: "Prompt Library", href: "/learn/prompts" },
  { id: "glossary", label: "AI Glossary", href: "/glossary" },
];

// TODO: Replace with real apps data when available
const APP_OPTIONS: FooterSelectedItem[] = [
  { id: "core-tools", label: "Core Tools", href: "/core-tools" },
  { id: "tools-directory", label: "Tools Directory", href: "/tools/directory" },
];

const MAX_ITEMS = 5;

/* ═══════════════════════════════════════════
   Admin Footer Settings
   ═══════════════════════════════════════════ */
export default function FooterSettings() {
  const [config, setConfig] = useState<FooterConfig>(getFooterConfig);
  const [courseOptions, setCourseOptions] = useState<FooterSelectedItem[]>(getCourseOptions);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadCourses().then(() => setCourseOptions(getCourseOptions()));
  }, []);

  const handleSave = () => {
    saveFooterConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    localStorage.removeItem("provenai_footer_config");
    setConfig(getFooterConfig());
    setSaved(false);
  };

  return (
    <AppLayout>
      <GovernanceHeader
        title="Footer Settings"
        description="Configure the dynamic footer columns (Courses, Publications, Apps) and social links."
      />

      <div className="space-y-10 max-w-3xl">
        {/* Dynamic section editors */}
        <DynamicSectionEditor
          label="Courses"
          indexRoute={SECTION_INDEX_ROUTES.courses}
          options={courseOptions}
          section={config.courses}
          onChange={(s) => { setConfig((prev) => ({ ...prev, courses: s })); setSaved(false); }}
        />
        <DynamicSectionEditor
          label="Publications"
          indexRoute={SECTION_INDEX_ROUTES.publications}
          options={PUBLICATION_OPTIONS}
          section={config.publications}
          onChange={(s) => { setConfig((prev) => ({ ...prev, publications: s })); setSaved(false); }}
        />
        <DynamicSectionEditor
          label="Apps"
          indexRoute={SECTION_INDEX_ROUTES.apps}
          options={APP_OPTIONS}
          section={config.apps}
          onChange={(s) => { setConfig((prev) => ({ ...prev, apps: s })); setSaved(false); }}
        />

        {/* Social links */}
        <SocialEditor
          social={config.social}
          onChange={(s) => { setConfig((prev) => ({ ...prev, social: s })); setSaved(false); }}
        />
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
    </AppLayout>
  );
}

/* ── Dynamic Section Editor ── */
function DynamicSectionEditor({
  label,
  indexRoute,
  options,
  section,
  onChange,
}: {
  label: string;
  indexRoute: string;
  options: FooterSelectedItem[];
  section: FooterConfig["courses"];
  onChange: (s: FooterConfig["courses"]) => void;
}) {
  const addItem = useCallback(
    (id: string) => {
      if (section.selectedItems.length >= MAX_ITEMS) return;
      const item = options.find((o) => o.id === id);
      if (!item || section.selectedItems.some((s) => s.id === id)) return;
      onChange({ ...section, selectedItems: [...section.selectedItems, item] });
    },
    [section, options, onChange]
  );

  const removeItem = useCallback(
    (id: string) => {
      onChange({
        ...section,
        selectedItems: section.selectedItems.filter((s) => s.id !== id),
      });
    },
    [section, onChange]
  );

  const moveItem = useCallback(
    (index: number, dir: -1 | 1) => {
      const items = [...section.selectedItems];
      const target = index + dir;
      if (target < 0 || target >= items.length) return;
      [items[index], items[target]] = [items[target], items[index]];
      onChange({ ...section, selectedItems: items });
    },
    [section, onChange]
  );

  const availableToAdd = options.filter(
    (o) => !section.selectedItems.some((s) => s.id === o.id)
  );

  return (
    <div className="border rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{label}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Heading links to <code className="bg-muted px-1 py-0.5 rounded text-[11px]">{indexRoute}</code>
          </p>
        </div>
        <Select
          value={section.mode}
          onValueChange={(v) => onChange({ ...section, mode: v as SectionMode })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="index_only">Index only</SelectItem>
            <SelectItem value="show_selected">Show selected items</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {section.mode === "show_selected" && (
        <>
          {/* Selected items list with reorder/remove */}
          {section.selectedItems.length > 0 && (
            <ul className="space-y-1">
              {section.selectedItems.map((item, i) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 bg-muted/50 rounded px-3 py-1.5 text-sm"
                >
                  <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                  <span className="flex-1 truncate">{item.label}</span>
                  <button
                    type="button"
                    onClick={() => moveItem(i, -1)}
                    disabled={i === 0}
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(i, 1)}
                    disabled={i === section.selectedItems.length - 1}
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-0.5 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Add picker */}
          {availableToAdd.length > 0 && section.selectedItems.length < MAX_ITEMS && (
            <Select onValueChange={addItem} value="">
              <SelectTrigger className="w-full">
                <SelectValue placeholder={`Add ${label.toLowerCase()}…`} />
              </SelectTrigger>
              <SelectContent>
                {availableToAdd.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {section.selectedItems.length >= MAX_ITEMS && (
            <p className="text-xs text-muted-foreground">
              Maximum {MAX_ITEMS} items reached.
            </p>
          )}
        </>
      )}
    </div>
  );
}

/* ── Social Links Editor ── */
function SocialEditor({
  social,
  onChange,
}: {
  social: FooterConfig["social"];
  onChange: (s: FooterConfig["social"]) => void;
}) {
  const update = (key: keyof FooterConfig["social"], value: string) => {
    onChange({ ...social, [key]: value || undefined });
  };

  return (
    <div className="border rounded-lg p-5 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Social Links</h3>
      <p className="text-xs text-muted-foreground -mt-2">
        Leave blank to hide from footer. Links open in a new tab.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(
          [
            ["facebook", "Facebook URL"],
            ["youtube", "YouTube URL"],
            ["x", "X (Twitter) URL"],
            ["linkedin", "LinkedIn URL"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="space-y-1">
            <Label className="text-xs">{label}</Label>
            <Input
              value={social[key] ?? ""}
              onChange={(e) => update(key, e.target.value)}
              placeholder={`https://…`}
              className="text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
