import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RotateCcw, Save, Copy, Trash2, ChevronDown, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getLPCardSettings,
  saveLPCardSettings,
  getAllLPPresets,
  saveCustomLPPreset,
  deleteCustomLPPreset,
  hslToCss,
  shadowFromIntensity,
  SHADOW_DIRECTIONS,
  DEFAULT_LP_CARD_SETTINGS,
  DEFAULT_LP_TYPOGRAPHY,
  type LearningPathCardSettings,
  type ShadowDirection,
  type LearningPathCardPreset,
} from "@/lib/courses/learningPathCardCustomization";

// Font weight options
const FONT_WEIGHTS = [
  { value: 400, label: "Normal (400)" },
  { value: 500, label: "Medium (500)" },
  { value: 600, label: "Semibold (600)" },
  { value: 700, label: "Bold (700)" },
];

// HSL to Hex conversion
function hslToHex(hsl: string): string {
  const parts = hsl.split(" ");
  if (parts.length < 3) return "#888888";
  
  const h = parseFloat(parts[0]) || 0;
  const s = parseFloat(parts[1]) / 100 || 0;
  const l = parseFloat(parts[2].split("/")[0]) / 100 || 0;
  
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Hex to HSL conversion
function hexToHsl(hex: string): string {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Color picker component
function ColorPicker({ 
  label, 
  value, 
  onChange 
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void;
}) {
  const hexValue = useMemo(() => hslToHex(value), [value]);
  
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <Input
          type="color"
          value={hexValue}
          onChange={(e) => onChange(hexToHsl(e.target.value))}
          className="w-10 h-8 p-0.5 cursor-pointer"
        />
        <Input
          type="text"
          value={hexValue}
          onChange={(e) => {
            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
              onChange(hexToHsl(e.target.value));
            }
          }}
          className="flex-1 h-8 text-xs font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

interface LearningPathCardCustomizerProps {
  onClose: () => void;
}

export function LearningPathCardCustomizer({ onClose }: LearningPathCardCustomizerProps) {
  const [settings, setSettings] = useState<LearningPathCardSettings>(getLPCardSettings);
  const [presets, setPresets] = useState<LearningPathCardPreset[]>(getAllLPPresets);
  const [newPresetName, setNewPresetName] = useState("");
  const [showSavePresetInput, setShowSavePresetInput] = useState(false);

  const updateSetting = <K extends keyof LearningPathCardSettings>(
    key: K,
    value: LearningPathCardSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveLPCardSettings(newSettings);
  };

  const handleReset = () => {
    setSettings(DEFAULT_LP_CARD_SETTINGS);
    saveLPCardSettings(DEFAULT_LP_CARD_SETTINGS);
    toast.success("Reset to defaults");
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }
    saveCustomLPPreset(newPresetName.trim(), settings);
    setPresets(getAllLPPresets());
    setNewPresetName("");
    setShowSavePresetInput(false);
    toast.success("Preset saved");
  };

  const handleApplyPreset = (preset: LearningPathCardPreset) => {
    setSettings(preset.settings);
    saveLPCardSettings(preset.settings);
    toast.success(`Applied "${preset.name}"`);
  };

  const handleDeletePreset = (id: string) => {
    if (id.startsWith("custom_")) {
      deleteCustomLPPreset(id);
      setPresets(getAllLPPresets());
      toast.success("Preset deleted");
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6 mt-4">
          {/* Card Appearance */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Card Appearance</h4>
            <div className="grid grid-cols-2 gap-3">
              <ColorPicker
                label="Background"
                value={settings.cardBackground}
                onChange={(v) => updateSetting("cardBackground", v)}
              />
              <ColorPicker
                label="Border"
                value={settings.cardBorder}
                onChange={(v) => updateSetting("cardBorder", v)}
              />
              <ColorPicker
                label="Hover Background"
                value={settings.cardHoverBackground}
                onChange={(v) => updateSetting("cardHoverBackground", v)}
              />
              <ColorPicker
                label="Icon Color"
                value={settings.iconColor}
                onChange={(v) => updateSetting("iconColor", v)}
              />
            </div>
          </div>

          {/* Shadow Controls */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Shadow</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Intensity</span>
                <span>{settings.cardShadow}%</span>
              </div>
              <Slider
                value={[settings.cardShadow]}
                onValueChange={([v]) => updateSetting("cardShadow", v)}
                min={0}
                max={100}
                step={5}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Direction</Label>
              <Select
                value={String(settings.cardShadowDirection)}
                onValueChange={(v) => updateSetting("cardShadowDirection", Number(v) as ShadowDirection)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHADOW_DIRECTIONS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Course List Items */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Course List Items</h4>
            <div className="grid grid-cols-2 gap-3">
              <ColorPicker
                label="Item Background"
                value={settings.courseItemBackground}
                onChange={(v) => updateSetting("courseItemBackground", v)}
              />
              <ColorPicker
                label="Item Hover"
                value={settings.courseItemHoverBackground}
                onChange={(v) => updateSetting("courseItemHoverBackground", v)}
              />
              <ColorPicker
                label="Item Border"
                value={settings.courseItemBorder}
                onChange={(v) => updateSetting("courseItemBorder", v)}
              />
            </div>
          </div>

          {/* Course Number Badge */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Course Number Badge</h4>
            <div className="grid grid-cols-2 gap-3">
              <ColorPicker
                label="Background"
                value={settings.courseNumberBackground}
                onChange={(v) => updateSetting("courseNumberBackground", v)}
              />
              <ColorPicker
                label="Text"
                value={settings.courseNumberText}
                onChange={(v) => updateSetting("courseNumberText", v)}
              />
            </div>
          </div>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-6 mt-4">
          {/* Path Title */}
          <div className="p-3 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Path Title</span>
              <ColorPicker
                label=""
                value={settings.titleColor}
                onChange={(v) => updateSetting("titleColor", v)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Size</span>
                  <span>{settings.titleTypography?.fontSize ?? 16}px</span>
                </div>
                <Slider
                  value={[settings.titleTypography?.fontSize ?? 16]}
                  onValueChange={([v]) => updateSetting("titleTypography", { 
                    ...(settings.titleTypography ?? DEFAULT_LP_TYPOGRAPHY.title), 
                    fontSize: v 
                  })}
                  min={12}
                  max={24}
                  step={1}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Weight</Label>
                <Select
                  value={String(settings.titleTypography?.fontWeight ?? 500)}
                  onValueChange={(v) => updateSetting("titleTypography", { 
                    ...(settings.titleTypography ?? DEFAULT_LP_TYPOGRAPHY.title), 
                    fontWeight: Number(v) 
                  })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_WEIGHTS.map((w) => (
                      <SelectItem key={w.value} value={String(w.value)}>
                        {w.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Path Description */}
          <div className="p-3 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Path Description</span>
              <ColorPicker
                label=""
                value={settings.descriptionColor}
                onChange={(v) => updateSetting("descriptionColor", v)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Size</span>
                  <span>{settings.descriptionTypography?.fontSize ?? 14}px</span>
                </div>
                <Slider
                  value={[settings.descriptionTypography?.fontSize ?? 14]}
                  onValueChange={([v]) => updateSetting("descriptionTypography", { 
                    ...(settings.descriptionTypography ?? DEFAULT_LP_TYPOGRAPHY.description), 
                    fontSize: v 
                  })}
                  min={10}
                  max={18}
                  step={1}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Weight</Label>
                <Select
                  value={String(settings.descriptionTypography?.fontWeight ?? 400)}
                  onValueChange={(v) => updateSetting("descriptionTypography", { 
                    ...(settings.descriptionTypography ?? DEFAULT_LP_TYPOGRAPHY.description), 
                    fontWeight: Number(v) 
                  })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_WEIGHTS.map((w) => (
                      <SelectItem key={w.value} value={String(w.value)}>
                        {w.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Meta/Course Count */}
          <div className="p-3 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Meta Text (Course Count)</span>
              <ColorPicker
                label=""
                value={settings.metaColor}
                onChange={(v) => updateSetting("metaColor", v)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Size</span>
                  <span>{settings.metaTypography?.fontSize ?? 12}px</span>
                </div>
                <Slider
                  value={[settings.metaTypography?.fontSize ?? 12]}
                  onValueChange={([v]) => updateSetting("metaTypography", { 
                    ...(settings.metaTypography ?? DEFAULT_LP_TYPOGRAPHY.meta), 
                    fontSize: v 
                  })}
                  min={10}
                  max={16}
                  step={1}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Weight</Label>
                <Select
                  value={String(settings.metaTypography?.fontWeight ?? 400)}
                  onValueChange={(v) => updateSetting("metaTypography", { 
                    ...(settings.metaTypography ?? DEFAULT_LP_TYPOGRAPHY.meta), 
                    fontWeight: Number(v) 
                  })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_WEIGHTS.map((w) => (
                      <SelectItem key={w.value} value={String(w.value)}>
                        {w.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Course Title */}
          <div className="p-3 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Course Title (in list)</span>
              <ColorPicker
                label=""
                value={settings.courseTitleColor}
                onChange={(v) => updateSetting("courseTitleColor", v)}
              />
            </div>
          </div>

          {/* Course Meta */}
          <div className="p-3 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Course Meta (time)</span>
              <ColorPicker
                label=""
                value={settings.courseMetaColor}
                onChange={(v) => updateSetting("courseMetaColor", v)}
              />
            </div>
          </div>
        </TabsContent>

        {/* Presets Tab */}
        <TabsContent value="presets" className="space-y-4 mt-4">
          <div className="space-y-2">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center justify-between p-2 border rounded-lg"
              >
                <span className="text-sm">{preset.name}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleApplyPreset(preset)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  {preset.id.startsWith("custom_") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePreset(preset.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {showSavePresetInput ? (
            <div className="flex gap-2">
              <Input
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="Preset name..."
                className="h-8"
              />
              <Button size="sm" onClick={handleSavePreset}>
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSavePresetInput(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSavePresetInput(true)}
              className="w-full"
            >
              <Save className="h-3 w-3 mr-1" />
              Save Current as Preset
            </Button>
          )}
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="mt-4">
          <div className="p-4 border rounded-lg bg-muted/30">
            <LearningPathCardPreview settings={settings} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset to Defaults
        </Button>
        <Button size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}

// Preview component
function LearningPathCardPreview({ settings }: { settings: LearningPathCardSettings }) {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        backgroundColor: hslToCss(settings.cardBackground),
        borderColor: hslToCss(settings.cardBorder),
        boxShadow: shadowFromIntensity(settings.cardShadow, settings.cardShadowDirection),
      }}
    >
      {/* Header */}
      <div
        className="w-full p-4 flex items-start gap-3 text-left"
        style={{ backgroundColor: hslToCss(settings.headerBackground) }}
      >
        <div className="mt-0.5">
          <ChevronDown 
            className="h-4 w-4" 
            style={{ color: hslToCss(settings.iconColor) }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 
            style={{
              color: hslToCss(settings.titleColor),
              fontSize: `${settings.titleTypography?.fontSize ?? 16}px`,
              fontWeight: settings.titleTypography?.fontWeight ?? 500,
            }}
          >
            Getting Started with AI
          </h3>
          <p 
            className="mt-1"
            style={{
              color: hslToCss(settings.descriptionColor),
              fontSize: `${settings.descriptionTypography?.fontSize ?? 14}px`,
              fontWeight: settings.descriptionTypography?.fontWeight ?? 400,
            }}
          >
            A beginner-friendly path to understanding AI fundamentals.
          </p>
          <p 
            className="mt-2"
            style={{
              color: hslToCss(settings.metaColor),
              fontSize: `${settings.metaTypography?.fontSize ?? 12}px`,
              fontWeight: settings.metaTypography?.fontWeight ?? 400,
            }}
          >
            3 courses
          </p>
        </div>
      </div>

      {/* Course list */}
      <div style={{ borderTopColor: hslToCss(settings.courseItemBorder), borderTopWidth: 1 }}>
        {[
          { title: "Introduction to AI Concepts", time: "30 min" },
          { title: "Prompt Engineering Basics", time: "45 min" },
        ].map((course, index) => (
          <div
            key={index}
            className="flex items-center gap-3 px-4 py-3"
            style={{
              backgroundColor: hslToCss(settings.courseItemBackground),
              borderBottomColor: hslToCss(settings.courseItemBorder),
              borderBottomWidth: index === 0 ? 1 : 0,
            }}
          >
            <span 
              className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium"
              style={{
                backgroundColor: hslToCss(settings.courseNumberBackground),
                color: hslToCss(settings.courseNumberText),
              }}
            >
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p 
                className="text-sm font-medium truncate"
                style={{ color: hslToCss(settings.courseTitleColor) }}
              >
                {course.title}
              </p>
              <div 
                className="flex items-center gap-2 text-xs mt-0.5"
                style={{ color: hslToCss(settings.courseMetaColor) }}
              >
                <Clock className="h-3 w-3" />
                <span>{course.time}</span>
              </div>
            </div>
            <ArrowRight 
              className="h-4 w-4 flex-shrink-0"
              style={{ color: hslToCss(settings.iconColor) }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
