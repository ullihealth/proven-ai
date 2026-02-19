import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { GovernanceHeader } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical, 
  FileText,
  FolderOpen,
  Search,
  X,
  Palette,
  RotateCcw,
  Save,
  Clock,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  Guide,
  GuideCluster,
  GuideLifecycleState,
  GuideDifficulty,
  lifecycleStateLabels,
  difficultyLabels,
  defaultGuide,
} from "@/lib/guides/types";
import {
  getGuides,
  getClusters,
  saveGuide,
  deleteGuide,
  saveCluster,
  deleteCluster,
  getGuidesForCluster,
  reorderGuidesInCluster,
  getAllTags,
} from "@/lib/guides/guidesStore";
import {
  GuideCardSettings,
  ShadowDirection,
  DifficultyBadgeStyle,
  getGuideCardSettings,
  saveGuideCardSettings,
  getAllGuidePresets,
  saveCustomGuidePreset,
  deleteCustomGuidePreset,
  DEFAULT_GUIDE_CARD_SETTINGS,
  SHADOW_DIRECTIONS,
  hslToCss,
  shadowFromIntensity,
} from "@/lib/guides/guideCardCustomization";

// Convert HSL string to hex for color input
const hslToHex = (hsl: string): string => {
  if (!hsl) return "#3b82f6";
  const cleanHsl = hsl.split('/')[0].trim();
  const parts = cleanHsl.split(' ').map(p => parseFloat(p));
  if (parts.length < 3 || parts.some(isNaN)) return "#3b82f6";
  
  const h = parts[0], s = parts[1] / 100, l = parts[2] / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Convert hex to HSL string
const hexToHsl = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "217 91% 60%";
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

// ==================== GUIDE EDITOR ====================

interface GuideEditorProps {
  guide: Guide | null;
  clusters: GuideCluster[];
  onSave: (guide: Guide) => void;
  onClose: () => void;
}

function GuideEditor({ guide, clusters, onSave, onClose }: GuideEditorProps) {
  const isNew = !guide;
  const [formData, setFormData] = useState<Guide>(() => {
    if (guide) return { ...guide };
    return {
      id: crypto.randomUUID(),
      slug: '',
      title: '',
      description: '',
      ...defaultGuide,
    };
  });
  const [newTag, setNewTag] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    // Auto-generate slug if empty
    if (!formData.slug.trim()) {
      formData.slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
    
    onSave(formData);
    toast.success(isNew ? 'Guide created' : 'Guide updated');
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Guide title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="auto-generated-from-title"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of the guide"
            rows={2}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="whoFor">Who this is for</Label>
            <Input
              id="whoFor"
              value={formData.whoFor}
              onChange={(e) => setFormData({ ...formData, whoFor: e.target.value })}
              placeholder="Target audience"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whyMatters">Why it matters</Label>
            <Input
              id="whyMatters"
              value={formData.whyMatters}
              onChange={(e) => setFormData({ ...formData, whyMatters: e.target.value })}
              placeholder="Key benefit or outcome"
            />
          </div>
        </div>
      </div>

      {/* Classification */}
      <div className="space-y-4">
        <h4 className="font-medium">Classification</h4>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Lifecycle State</Label>
            <Select
              value={formData.lifecycleState}
              onValueChange={(v) => setFormData({ ...formData, lifecycleState: v as GuideLifecycleState })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">{lifecycleStateLabels.current}</SelectItem>
                <SelectItem value="reference">{lifecycleStateLabels.reference}</SelectItem>
                <SelectItem value="legacy">{lifecycleStateLabels.legacy}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select
              value={formData.difficulty}
              onValueChange={(v) => setFormData({ ...formData, difficulty: v as GuideDifficulty })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">{difficultyLabels.beginner}</SelectItem>
                <SelectItem value="intermediate">{difficultyLabels.intermediate}</SelectItem>
                <SelectItem value="advanced">{difficultyLabels.advanced}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Primary Cluster</Label>
            <Select
              value={formData.primaryClusterId || 'none'}
              onValueChange={(v) => setFormData({ ...formData, primaryClusterId: v === 'none' ? null : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {clusters.map(cluster => (
                  <SelectItem key={cluster.id} value={cluster.id}>{cluster.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add a tag"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <Button type="button" variant="outline" onClick={addTag}>Add</Button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button type="button" onClick={() => removeTag(tag)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Visibility */}
      <div className="space-y-4">
        <h4 className="font-medium">Visibility</h4>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="showInCluster"
              checked={formData.showInCluster}
              onCheckedChange={(checked) => setFormData({ ...formData, showInCluster: !!checked })}
            />
            <Label htmlFor="showInCluster" className="font-normal">
              Show in cluster view (landing page)
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="showInDiscovery"
              checked={formData.showInDiscovery}
              onCheckedChange={(checked) => setFormData({ ...formData, showInDiscovery: !!checked })}
            />
            <Label htmlFor="showInDiscovery" className="font-normal">
              Show in discovery view (browse all)
            </Label>
          </div>
        </div>
      </div>

      {/* Optional thumbnail */}
      <div className="space-y-2">
        <Label htmlFor="thumbnail">Thumbnail URL (optional)</Label>
        <Input
          id="thumbnail"
          value={formData.thumbnailUrl || ''}
          onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">{isNew ? 'Create Guide' : 'Save Changes'}</Button>
      </DialogFooter>
    </form>
  );
}

// ==================== CLUSTER EDITOR ====================

interface ClusterEditorProps {
  cluster: GuideCluster | null;
  onSave: (cluster: GuideCluster) => void;
  onClose: () => void;
}

function ClusterEditor({ cluster, onSave, onClose }: ClusterEditorProps) {
  const isNew = !cluster;
  const [formData, setFormData] = useState<GuideCluster>(() => {
    if (cluster) return { ...cluster };
    return {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      order: 999,
      maxGuides: 5,
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    onSave(formData);
    toast.success(isNew ? 'Cluster created' : 'Cluster updated');
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="clusterTitle">Cluster Title *</Label>
        <Input
          id="clusterTitle"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Getting Started"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="clusterDesc">Description</Label>
        <Textarea
          id="clusterDesc"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of this cluster"
          rows={2}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="maxGuides">Max Guides to Display</Label>
        <Input
          id="maxGuides"
          type="number"
          min={1}
          max={10}
          value={formData.maxGuides}
          onChange={(e) => setFormData({ ...formData, maxGuides: parseInt(e.target.value) || 5 })}
        />
        <p className="text-xs text-muted-foreground">Recommended: 5-7 guides per cluster</p>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">{isNew ? 'Create Cluster' : 'Save Changes'}</Button>
      </DialogFooter>
    </form>
  );
}

// ==================== CLUSTER ORDER MANAGER ====================

interface ClusterOrderManagerProps {
  cluster: GuideCluster;
  onClose: () => void;
}

function ClusterOrderManager({ cluster, onClose }: ClusterOrderManagerProps) {
  const [guides, setGuides] = useState(() => 
    getGuidesForCluster(cluster.id)
  );

  const moveGuide = (index: number, direction: 'up' | 'down') => {
    const newGuides = [...guides];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newGuides.length) return;
    
    [newGuides[index], newGuides[newIndex]] = [newGuides[newIndex], newGuides[index]];
    setGuides(newGuides);
  };

  const handleSave = async () => {
    await reorderGuidesInCluster(cluster.id, guides.map(g => g.id));
    toast.success('Guide order saved');
    onClose();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Drag or use arrows to reorder guides within "{cluster.title}"
      </p>
      
      {guides.length > 0 ? (
        <div className="space-y-2">
          {guides.map((guide, index) => (
            <div 
              key={guide.id} 
              className="flex items-center gap-2 rounded-lg border border-border bg-card p-3"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm">{guide.title}</span>
              <div className="flex gap-1">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => moveGuide(index, 'up')}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => moveGuide(index, 'down')}
                  disabled={index === guides.length - 1}
                >
                  ↓
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No guides assigned to this cluster yet.
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save Order</Button>
      </DialogFooter>
    </div>
  );
}

// ==================== CARD CUSTOMIZATION ====================

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  const hexValue = hslToHex(value);
  
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <input
          type="color"
          value={hexValue}
          onChange={(e) => onChange(hexToHsl(e.target.value))}
          className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent"
        />
        <Input
          value={hexValue}
          onChange={(e) => {
            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
              onChange(hexToHsl(e.target.value));
            }
          }}
          placeholder="#3b82f6"
          className="font-mono text-xs"
        />
      </div>
    </div>
  );
}

function GuideCardCustomizer() {
  const [settings, setSettings] = useState<GuideCardSettings>(getGuideCardSettings);
  const [presetName, setPresetName] = useState("");
  const [showSavePreset, setShowSavePreset] = useState(false);
  const presets = getAllGuidePresets();

  const updateSetting = async <K extends keyof GuideCardSettings>(
    key: K,
    value: GuideCardSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveGuideCardSettings(newSettings);
  };

  const applyPreset = async (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setSettings(preset.settings);
      await saveGuideCardSettings(preset.settings);
      toast.success(`Applied "${preset.name}" preset`);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }
    await saveCustomGuidePreset(presetName.trim(), settings);
    toast.success("Preset saved");
    setPresetName("");
    setShowSavePreset(false);
  };

  const resetToDefault = async () => {
    setSettings(DEFAULT_GUIDE_CARD_SETTINGS);
    await saveGuideCardSettings(DEFAULT_GUIDE_CARD_SETTINGS);
    toast.success("Reset to defaults");
  };

  // Sample guide for preview
  const sampleGuide = {
    title: "Getting Started with AI Tools",
    description: "Learn the fundamentals of using AI assistants effectively in your daily workflow.",
    whoFor: "Beginners",
    lastUpdated: "2026-01-15",
    difficulty: "beginner" as const,
    lifecycleState: "current" as const,
    tags: ["AI", "Productivity", "Basics"],
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Controls */}
      <div className="space-y-6">
        {/* Presets */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Presets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {presets.map(preset => (
                <Button
                  key={preset.id}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset.id)}
                  className="text-xs"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
            <Separator />
            <div className="flex gap-2">
              {showSavePreset ? (
                <>
                  <Input
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Preset name..."
                    className="text-xs"
                  />
                  <Button size="sm" onClick={handleSavePreset}>
                    <Save className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowSavePreset(false)}>
                    <X className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSavePreset(true)}
                    className="text-xs gap-1"
                  >
                    <Save className="h-3 w-3" />
                    Save Preset
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetToDefault}
                    className="text-xs gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Page Background */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Page Background</CardTitle>
          </CardHeader>
          <CardContent>
            <ColorInput
              label="Background Color"
              value={settings.pageBackground}
              onChange={(v) => updateSetting("pageBackground", v)}
            />
          </CardContent>
        </Card>

        {/* Main Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Main Card</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorInput
                label="Background"
                value={settings.cardBackground}
                onChange={(v) => updateSetting("cardBackground", v)}
              />
              <ColorInput
                label="Border"
                value={settings.cardBorder}
                onChange={(v) => updateSetting("cardBorder", v)}
              />
              <ColorInput
                label="Hover Border"
                value={settings.cardHoverBorder}
                onChange={(v) => updateSetting("cardHoverBorder", v)}
              />
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Shadow Intensity</Label>
                  <span className="text-xs text-muted-foreground">{settings.cardShadow}%</span>
                </div>
                <Slider
                  value={[settings.cardShadow]}
                  onValueChange={([v]) => updateSetting("cardShadow", v)}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Shadow Direction</Label>
                <Select
                  value={String(settings.cardShadowDirection)}
                  onValueChange={(v) => updateSetting("cardShadowDirection", Number(v) as ShadowDirection)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHADOW_DIRECTIONS.map(dir => (
                      <SelectItem key={dir.value} value={String(dir.value)}>
                        {dir.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Typography</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorInput
                label="Title"
                value={settings.titleColor}
                onChange={(v) => updateSetting("titleColor", v)}
              />
              <ColorInput
                label="Description"
                value={settings.descriptionColor}
                onChange={(v) => updateSetting("descriptionColor", v)}
              />
              <ColorInput
                label="Meta Text"
                value={settings.metaColor}
                onChange={(v) => updateSetting("metaColor", v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Difficulty Badges</CardTitle>
            <CardDescription className="text-xs">Independent colors for each difficulty level</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Beginner */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span 
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: hslToCss(settings.beginnerBadge.background),
                    border: `1px solid ${hslToCss(settings.beginnerBadge.border)}`,
                    color: hslToCss(settings.beginnerBadge.text),
                  }}
                >
                  Beginner
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <ColorInput
                  label="Background"
                  value={settings.beginnerBadge.background}
                  onChange={(v) => setSettings(prev => ({ ...prev, beginnerBadge: { ...prev.beginnerBadge, background: v } }))}
                />
                <ColorInput
                  label="Border"
                  value={settings.beginnerBadge.border}
                  onChange={(v) => setSettings(prev => ({ ...prev, beginnerBadge: { ...prev.beginnerBadge, border: v } }))}
                />
                <ColorInput
                  label="Text"
                  value={settings.beginnerBadge.text}
                  onChange={(v) => setSettings(prev => ({ ...prev, beginnerBadge: { ...prev.beginnerBadge, text: v } }))}
                />
              </div>
            </div>
            <Separator />
            {/* Intermediate */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span 
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: hslToCss(settings.intermediateBadge.background),
                    border: `1px solid ${hslToCss(settings.intermediateBadge.border)}`,
                    color: hslToCss(settings.intermediateBadge.text),
                  }}
                >
                  Intermediate
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <ColorInput
                  label="Background"
                  value={settings.intermediateBadge.background}
                  onChange={(v) => setSettings(prev => ({ ...prev, intermediateBadge: { ...prev.intermediateBadge, background: v } }))}
                />
                <ColorInput
                  label="Border"
                  value={settings.intermediateBadge.border}
                  onChange={(v) => setSettings(prev => ({ ...prev, intermediateBadge: { ...prev.intermediateBadge, border: v } }))}
                />
                <ColorInput
                  label="Text"
                  value={settings.intermediateBadge.text}
                  onChange={(v) => setSettings(prev => ({ ...prev, intermediateBadge: { ...prev.intermediateBadge, text: v } }))}
                />
              </div>
            </div>
            <Separator />
            {/* Advanced */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span 
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: hslToCss(settings.advancedBadge.background),
                    border: `1px solid ${hslToCss(settings.advancedBadge.border)}`,
                    color: hslToCss(settings.advancedBadge.text),
                  }}
                >
                  Advanced
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <ColorInput
                  label="Background"
                  value={settings.advancedBadge.background}
                  onChange={(v) => setSettings(prev => ({ ...prev, advancedBadge: { ...prev.advancedBadge, background: v } }))}
                />
                <ColorInput
                  label="Border"
                  value={settings.advancedBadge.border}
                  onChange={(v) => setSettings(prev => ({ ...prev, advancedBadge: { ...prev.advancedBadge, border: v } }))}
                />
                <ColorInput
                  label="Text"
                  value={settings.advancedBadge.text}
                  onChange={(v) => setSettings(prev => ({ ...prev, advancedBadge: { ...prev.advancedBadge, text: v } }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lifecycle Badge */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Lifecycle Badge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <ColorInput
                label="Background"
                value={settings.lifecycleBadgeBackground}
                onChange={(v) => updateSetting("lifecycleBadgeBackground", v)}
              />
              <ColorInput
                label="Border"
                value={settings.lifecycleBadgeBorder}
                onChange={(v) => updateSetting("lifecycleBadgeBorder", v)}
              />
              <ColorInput
                label="Text"
                value={settings.lifecycleBadgeText}
                onChange={(v) => updateSetting("lifecycleBadgeText", v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorInput
                label="Background"
                value={settings.tagBackground}
                onChange={(v) => updateSetting("tagBackground", v)}
              />
              <ColorInput
                label="Text"
                value={settings.tagText}
                onChange={(v) => updateSetting("tagText", v)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Preview */}
      <div className="lg:sticky lg:top-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Live Preview</CardTitle>
            <CardDescription className="text-xs">
              Changes are saved automatically
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="rounded-lg p-6"
              style={{ backgroundColor: hslToCss(settings.pageBackground) }}
            >
              {/* Preview card */}
              <div
                className="rounded-lg p-4 transition-all"
                style={{
                  backgroundColor: hslToCss(settings.cardBackground),
                  border: `1px solid ${hslToCss(settings.cardBorder)}`,
                  boxShadow: shadowFromIntensity(settings.cardShadow, settings.cardShadowDirection),
                }}
              >
                {/* Badges row - show all difficulty levels */}
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: hslToCss(settings.beginnerBadge.background),
                      border: `1px solid ${hslToCss(settings.beginnerBadge.border)}`,
                      color: hslToCss(settings.beginnerBadge.text),
                    }}
                  >
                    Beginner
                  </span>
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: hslToCss(settings.intermediateBadge.background),
                      border: `1px solid ${hslToCss(settings.intermediateBadge.border)}`,
                      color: hslToCss(settings.intermediateBadge.text),
                    }}
                  >
                    Intermediate
                  </span>
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: hslToCss(settings.advancedBadge.background),
                      border: `1px solid ${hslToCss(settings.advancedBadge.border)}`,
                      color: hslToCss(settings.advancedBadge.text),
                    }}
                  >
                    Advanced
                  </span>
                </div>
                {/* Lifecycle badge */}
                <div className="mb-2">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: hslToCss(settings.lifecycleBadgeBackground),
                      border: `1px solid ${hslToCss(settings.lifecycleBadgeBorder)}`,
                      color: hslToCss(settings.lifecycleBadgeText),
                    }}
                  >
                    {lifecycleStateLabels[sampleGuide.lifecycleState]}
                  </span>
                </div>

                {/* Title */}
                <h3 
                  className="mb-2 font-semibold"
                  style={{ color: hslToCss(settings.titleColor) }}
                >
                  {sampleGuide.title}
                </h3>

                {/* Description */}
                <p 
                  className="mb-3 text-sm"
                  style={{ color: hslToCss(settings.descriptionColor) }}
                >
                  {sampleGuide.description}
                </p>

                {/* Meta */}
                <div 
                  className="flex flex-wrap items-center gap-3 text-xs"
                  style={{ color: hslToCss(settings.metaColor) }}
                >
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {sampleGuide.whoFor}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {sampleGuide.lastUpdated}
                  </span>
                </div>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {sampleGuide.tags.map(tag => (
                    <span
                      key={tag}
                      className="rounded-full px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: hslToCss(settings.tagBackground),
                        color: hslToCss(settings.tagText),
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================

const GuideManagement = () => {
  const [guides, setGuides] = useState(getGuides);
  const [clusters, setClusters] = useState(getClusters);
  const [activeTab, setActiveTab] = useState('guides');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Guide editor
  const [guideEditorOpen, setGuideEditorOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  
  // Cluster editor
  const [clusterEditorOpen, setClusterEditorOpen] = useState(false);
  const [editingCluster, setEditingCluster] = useState<GuideCluster | null>(null);
  
  // Cluster order manager
  const [orderManagerOpen, setOrderManagerOpen] = useState(false);
  const [orderingCluster, setOrderingCluster] = useState<GuideCluster | null>(null);

  const refreshData = () => {
    setGuides(getGuides());
    setClusters(getClusters());
  };

  // Filter guides by search
  const filteredGuides = useMemo(() => {
    if (!searchQuery.trim()) return guides;
    const q = searchQuery.toLowerCase();
    return guides.filter(g => 
      g.title.toLowerCase().includes(q) || 
      g.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [guides, searchQuery]);

  // Guide actions
  const handleSaveGuide = async (guide: Guide) => {
    await saveGuide(guide);
    refreshData();
  };

  const handleDeleteGuide = async (id: string) => {
    await deleteGuide(id);
    refreshData();
    toast.success('Guide deleted');
  };

  // Cluster actions
  const handleSaveCluster = async (cluster: GuideCluster) => {
    await saveCluster(cluster);
    refreshData();
  };

  const handleDeleteCluster = async (id: string) => {
    await deleteCluster(id);
    refreshData();
    toast.success('Cluster deleted');
  };

  return (
    <AppLayout>
      <GovernanceHeader
        title="Guide Management"
        description="Create, edit, and organize guides and clusters for the Guides & Resources section."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="guides" className="gap-2">
            <FileText className="h-4 w-4" />
            Guides ({guides.length})
          </TabsTrigger>
          <TabsTrigger value="clusters" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Clusters ({clusters.length})
          </TabsTrigger>
          <TabsTrigger value="customize" className="gap-2">
            <Palette className="h-4 w-4" />
            Customize Cards
          </TabsTrigger>
        </TabsList>

        {/* GUIDES TAB */}
        <TabsContent value="guides" className="space-y-4">
          {/* Actions bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search guides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Dialog open={guideEditorOpen} onOpenChange={setGuideEditorOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingGuide(null)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Guide
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingGuide ? 'Edit Guide' : 'Create New Guide'}</DialogTitle>
                  <DialogDescription>
                    {editingGuide ? 'Update guide details and settings.' : 'Add a new guide to the library.'}
                  </DialogDescription>
                </DialogHeader>
                <GuideEditor
                  guide={editingGuide}
                  clusters={clusters}
                  onSave={handleSaveGuide}
                  onClose={() => setGuideEditorOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Guides table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Cluster</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGuides.length > 0 ? (
                    filteredGuides.map(guide => (
                      <TableRow key={guide.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{guide.title}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {guide.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={guide.lifecycleState === 'current' ? 'default' : 'secondary'}
                            className={guide.lifecycleState === 'legacy' ? 'opacity-60' : ''}
                          >
                            {lifecycleStateLabels[guide.lifecycleState]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {difficultyLabels[guide.difficulty]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {guide.primaryClusterId ? (
                            clusters.find(c => c.id === guide.primaryClusterId)?.title || '—'
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {guide.showInCluster && <Badge variant="outline" className="text-xs">Cluster</Badge>}
                            {guide.showInDiscovery && <Badge variant="outline" className="text-xs">Discovery</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setEditingGuide(guide);
                                setGuideEditorOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Guide</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{guide.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteGuide(guide.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? 'No guides match your search.' : 'No guides yet. Create your first guide.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CLUSTERS TAB */}
        <TabsContent value="clusters" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={clusterEditorOpen} onOpenChange={setClusterEditorOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingCluster(null)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Cluster
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCluster ? 'Edit Cluster' : 'Create New Cluster'}</DialogTitle>
                  <DialogDescription>
                    {editingCluster ? 'Update cluster details.' : 'Create a new cluster to group related guides.'}
                  </DialogDescription>
                </DialogHeader>
                <ClusterEditor
                  cluster={editingCluster}
                  onSave={handleSaveCluster}
                  onClose={() => setClusterEditorOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clusters.map(cluster => {
              const clusterGuides = getGuidesForCluster(cluster.id);
              return (
                <Card key={cluster.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{cluster.title}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {clusterGuides.length} / {cluster.maxGuides} guides
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setEditingCluster(cluster);
                            setClusterEditorOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Cluster</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove the cluster. Guides in this cluster will be unassigned.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCluster(cluster.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3">
                      {cluster.description || 'No description'}
                    </p>
                    
                    <Dialog open={orderManagerOpen && orderingCluster?.id === cluster.id} onOpenChange={(open) => {
                      setOrderManagerOpen(open);
                      if (!open) setOrderingCluster(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full gap-2"
                          onClick={() => setOrderingCluster(cluster)}
                        >
                          <GripVertical className="h-4 w-4" />
                          Manage Order
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reorder Guides</DialogTitle>
                          <DialogDescription>
                            Arrange guides in "{cluster.title}"
                          </DialogDescription>
                        </DialogHeader>
                        {orderingCluster && (
                          <ClusterOrderManager
                            cluster={orderingCluster}
                            onClose={() => {
                              setOrderManagerOpen(false);
                              setOrderingCluster(null);
                              refreshData();
                            }}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {clusters.length === 0 && (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
              <FolderOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-medium">No clusters yet</h3>
              <p className="text-sm text-muted-foreground">
                Create clusters to organize your guides on the landing page.
              </p>
            </div>
          )}
        </TabsContent>

        {/* CUSTOMIZE CARDS TAB */}
        <TabsContent value="customize" className="space-y-4">
          <GuideCardCustomizer />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default GuideManagement;
