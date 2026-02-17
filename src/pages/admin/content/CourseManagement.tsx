import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { GovernanceHeader } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { 
  Clock, 
  ArrowRight, 
  Upload, 
  RotateCcw, 
  X, 
  Image as ImageIcon, 
  Sparkles, 
  Save, 
  Copy, 
  Trash2,
  Plus,
  Edit,
  Palette,
  Search,
  BookOpen,
  GripVertical,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Course, CourseVisualSettings, CardBackgroundMode, CardTextTheme, CardOverlayEffect, VisualPreset, CourseType, LifecycleState, CoursePriceTier, CourseDifficulty } from "@/lib/courses/types";
import { courseTypeLabels, lifecycleStateLabels, defaultVisualSettings, defaultGradientColors, overlayEffectLabels, difficultyLabels } from "@/lib/courses/types";
import { AIOverlayEffects } from "@/components/courses/AIOverlayEffects";
import { computePriceTier, getPriceTierLabel } from "@/lib/courses/entitlements";
import {
  getCourses,
  getCourseById,
  saveCourse,
  deleteCourse,
  loadCourses,
  getCourseVisualSettings,
  saveCourseVisualSettings,
  resetCourseVisualSettings,
  getAllPresets,
  savePreset,
  deletePreset,
  applySettingsToAllCourses,
} from "@/lib/courses/coursesStore";
import {
  CourseCardSettings,
  ShadowDirection,
  getCourseCardSettings,
  saveCourseCardSettings,
  getAllCoursePresets,
  saveCustomCoursePreset,
  deleteCustomCoursePreset,
  DEFAULT_COURSE_CARD_SETTINGS,
  SHADOW_DIRECTIONS,
  hslToCss,
  shadowFromIntensity,
  getDifficultyBadgeStyles,
  getLifecycleBadgeStyles,
} from "@/lib/courses/courseCardCustomization";
import {
  getLearningPaths,
  saveLearningPath,
  deleteLearningPath,
  LearningPathWithSettings,
} from "@/lib/courses/learningPathStore";
import { toast } from "sonner";

// ==================== COURSE EDITOR ====================

interface CourseEditorProps {
  course: Course | null;
  onSave: (course: Course) => void;
  onClose: () => void;
}

function CourseEditor({ course, onSave, onClose }: CourseEditorProps) {
  const isNew = !course;
  const [formData, setFormData] = useState<Course>(() => {
    if (course) return { ...course };
    return {
      id: crypto.randomUUID(),
      slug: '',
      title: '',
      description: '',
      estimatedTime: '30 min',
      courseType: 'short' as CourseType,
      lifecycleState: 'current' as LifecycleState,
      capabilityTags: [],
      lastUpdated: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      href: '',
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
    
    // Auto-generate href if empty
    if (!formData.href.trim()) {
      formData.href = `/learn/courses/${formData.slug}`;
    }
    
    onSave(formData);
    toast.success(isNew ? 'Course created' : 'Course updated');
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && formData.capabilityTags && !formData.capabilityTags.includes(newTag.trim())) {
      setFormData({ ...formData, capabilityTags: [...(formData.capabilityTags || []), newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, capabilityTags: formData.capabilityTags?.filter(t => t !== tag) || [] });
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
              placeholder="Course title"
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
            placeholder="Brief description of the course"
            rows={2}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="estimatedTime">Estimated Time</Label>
            <Input
              id="estimatedTime"
              value={formData.estimatedTime}
              onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
              placeholder="e.g., 30 min, 2 hours"
            />
          </div>
          <div className="space-y-2">
            <Label>Course Type</Label>
            <Select
              value={formData.courseType}
              onValueChange={(v) => setFormData({ ...formData, courseType: v as CourseType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">{courseTypeLabels.short}</SelectItem>
                <SelectItem value="deep">{courseTypeLabels.deep}</SelectItem>
                <SelectItem value="reference">{courseTypeLabels.reference}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Lifecycle State</Label>
            <Select
              value={formData.lifecycleState}
              onValueChange={(v) => setFormData({ ...formData, lifecycleState: v as LifecycleState })}
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
        </div>

        {/* Difficulty Level */}
        <div className="space-y-2">
          <Label>Difficulty Level</Label>
          <Select
            value={formData.difficulty || 'beginner'}
            onValueChange={(v) => setFormData({ ...formData, difficulty: v as CourseDifficulty })}
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

        {/* Release Date for Monetization */}
        <div className="space-y-2">
          <Label htmlFor="releaseDate">Release Date (for pricing)</Label>
          <Input
            id="releaseDate"
            type="date"
            value={formData.releaseDate || ''}
            onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Price tier is computed from release date: 0-3 months = $497, 3-6 months = $247, 6+ months = Included
          </p>
          {formData.releaseDate && (
            <Badge variant="outline" className="mt-1">
              Computed: {getPriceTierLabel(computePriceTier(formData.releaseDate))}
            </Badge>
          )}
        </div>
      </div>

      {/* Capability Tags */}
      <div className="space-y-2">
        <Label>Capability Tags (max 6)</Label>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add a tag"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            disabled={(formData.capabilityTags?.length || 0) >= 6}
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={addTag}
            disabled={(formData.capabilityTags?.length || 0) >= 6}
          >
            Add
          </Button>
        </div>
        {formData.capabilityTags && formData.capabilityTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.capabilityTags.map(tag => (
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

      {/* URL */}
      <div className="space-y-2">
        <Label htmlFor="href">URL Path</Label>
        <Input
          id="href"
          value={formData.href}
          onChange={(e) => setFormData({ ...formData, href: e.target.value })}
          placeholder="/learn/courses/your-course-slug"
        />
        <p className="text-xs text-muted-foreground">
          Auto-generated from slug if left empty
        </p>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">{isNew ? 'Create Course' : 'Save Changes'}</Button>
      </DialogFooter>
    </form>
  );
}

// ==================== VISUAL SETTINGS EDITOR ====================

interface VisualSettingsEditorProps {
  course: Course;
  onClose: () => void;
  allCourses: Course[];
}

function VisualSettingsEditor({ course, onClose, allCourses }: VisualSettingsEditorProps) {
  const [visualSettings, setVisualSettings] = useState<CourseVisualSettings>(() => 
    getCourseVisualSettings(course.id)
  );
  const [presets, setPresets] = useState<VisualPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState("");
  const [showSavePresetInput, setShowSavePresetInput] = useState(false);

  useEffect(() => {
    setPresets(getAllPresets());
  }, []);

  const handleSave = () => {
    saveCourseVisualSettings(course.id, visualSettings);
    toast.success("Visual settings saved");
    onClose();
  };

  const handleReset = () => {
    resetCourseVisualSettings(course.id);
    setVisualSettings(defaultVisualSettings);
    toast.success("Settings reset to defaults");
  };

  const handleSaveAsPreset = () => {
    if (!newPresetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }
    savePreset(newPresetName.trim(), visualSettings);
    setPresets(getAllPresets());
    setNewPresetName("");
    setShowSavePresetInput(false);
    toast.success(`Preset saved`);
  };

  const handleApplyPreset = (preset: VisualPreset) => {
    setVisualSettings({ ...preset.settings });
    toast.success(`Applied preset "${preset.name}"`);
  };

  const handleDeletePreset = (presetId: string, presetName: string) => {
    deletePreset(presetId);
    setPresets(getAllPresets());
    toast.success(`Preset deleted`);
  };

  const handleApplyToAll = () => {
    applySettingsToAllCourses(allCourses.map(c => c.id), visualSettings);
    toast.success(`Applied to all ${allCourses.length} courses`);
    onClose();
  };

  const handleImageUpload = (field: 'backgroundImage' | 'logoUrl' | 'thumbnailUrl') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          setVisualSettings(prev => ({ ...prev, [field]: dataUrl }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const removeImage = (field: 'backgroundImage' | 'logoUrl' | 'thumbnailUrl') => {
    setVisualSettings(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6 mt-4">
          {/* Background Mode */}
          <div className="space-y-2">
            <Label>Background Mode</Label>
            <Select
              value={visualSettings.backgroundMode}
              onValueChange={(value: CardBackgroundMode) =>
                setVisualSettings(prev => ({ ...prev, backgroundMode: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plain">Plain (Light)</SelectItem>
                <SelectItem value="gradient">Gradient (Dark)</SelectItem>
                <SelectItem value="image">Background Image</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Gradient Colors */}
          {visualSettings.backgroundMode === 'gradient' && (
            <div className="space-y-4">
              <Label>Gradient Colors</Label>
              <div className="grid grid-cols-3 gap-4">
                {(['gradientFrom', 'gradientVia', 'gradientTo'] as const).map((key, i) => (
                  <div key={key} className="space-y-2">
                    <span className="text-xs text-muted-foreground">{['From', 'Via', 'To'][i]}</span>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={visualSettings[key] || Object.values(defaultGradientColors)[i]}
                        onChange={(e) => setVisualSettings(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={visualSettings[key] || Object.values(defaultGradientColors)[i]}
                        onChange={(e) => setVisualSettings(prev => ({ ...prev, [key]: e.target.value }))}
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Overlay Effect */}
          {visualSettings.backgroundMode === 'gradient' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <Label>AI Overlay Effect</Label>
              </div>
              <Select
                value={visualSettings.overlayEffect || 'none'}
                onValueChange={(value: CardOverlayEffect) =>
                  setVisualSettings(prev => ({ ...prev, overlayEffect: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(overlayEffectLabels) as CardOverlayEffect[]).map((effect) => (
                    <SelectItem key={effect} value={effect}>
                      {overlayEffectLabels[effect]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Background Image */}
          {visualSettings.backgroundMode === 'image' && (
            <div className="space-y-2">
              <Label>Background Image</Label>
              {visualSettings.backgroundImage ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted">
                  <img src={visualSettings.backgroundImage} alt="" className="w-full h-full object-cover" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => removeImage('backgroundImage')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-32 border-dashed"
                  onClick={() => handleImageUpload('backgroundImage')}
                >
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload</span>
                  </div>
                </Button>
              )}
            </div>
          )}

          {/* Overlay Strength */}
          {visualSettings.backgroundMode === 'image' && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Overlay Strength</Label>
                <span className="text-sm text-muted-foreground">{visualSettings.overlayStrength}%</span>
              </div>
              <Slider
                value={[visualSettings.overlayStrength]}
                onValueChange={([value]) => setVisualSettings(prev => ({ ...prev, overlayStrength: value }))}
                min={0}
                max={80}
                step={5}
              />
            </div>
          )}

          {/* Text Theme */}
          <div className="space-y-2">
            <Label>Text Theme</Label>
            <Select
              value={visualSettings.textTheme}
              onValueChange={(value: CardTextTheme) =>
                setVisualSettings(prev => ({ ...prev, textTheme: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark Text (Light Background)</SelectItem>
                <SelectItem value="light">Light Text (Dark Background)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Accent Color */}
          <div className="space-y-2">
            <Label>Accent Color (optional)</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={visualSettings.accentColor || '#2563eb'}
                onChange={(e) => setVisualSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                placeholder="#2563eb"
                value={visualSettings.accentColor || ''}
                onChange={(e) => setVisualSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                className="flex-1"
              />
              {visualSettings.accentColor && (
                <Button variant="ghost" size="icon" onClick={() => setVisualSettings(prev => ({ ...prev, accentColor: undefined }))}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logo/Icon (optional)</Label>
            <div className="flex items-center gap-4">
              {visualSettings.logoUrl ? (
                <div className="relative">
                  <img src={visualSettings.logoUrl} alt="" className="h-12 w-12 rounded-lg object-contain bg-muted" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => removeImage('logoUrl')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" className="h-12 w-12" onClick={() => handleImageUpload('logoUrl')}>
                  <Upload className="h-4 w-4" />
                </Button>
              )}
              <p className="text-sm text-muted-foreground">Small icon shown at top-left of card</p>
            </div>
          </div>

          <Separator />

          {/* Course Thumbnail */}
          <div className="space-y-2">
            <Label>Course Thumbnail</Label>
            <p className="text-xs text-muted-foreground">16:9 cover image used on course cards, directory tiles, and the Control Centre.</p>
            {visualSettings.thumbnailUrl ? (
              <div className="relative w-full rounded-lg overflow-hidden bg-muted" style={{ aspectRatio: '16/9' }}>
                <img src={visualSettings.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => removeImage('thumbnailUrl')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full border-dashed"
                style={{ aspectRatio: '16/9', maxHeight: '160px' }}
                onClick={() => handleImageUpload('thumbnailUrl')}
              >
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload thumbnail (16:9 recommended)</span>
                </div>
              </Button>
            )}
          </div>

          {/* Card Title Override */}
          <div className="space-y-2">
            <Label>Card Title (optional)</Label>
            <p className="text-xs text-muted-foreground">Override the course title shown on cards and tiles. Leave blank to use default course title.</p>
            <Input
              placeholder={course.title}
              value={visualSettings.cardTitle || ''}
              onChange={(e) => setVisualSettings(prev => ({ ...prev, cardTitle: e.target.value || undefined }))}
            />
          </div>
        </TabsContent>

        {/* Presets Tab */}
        <TabsContent value="presets" className="space-y-6 mt-4">
          <div className="space-y-3">
            <Label className="text-base font-medium">Save Current Settings as Preset</Label>
            {showSavePresetInput ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter preset name..."
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveAsPreset()}
                  autoFocus
                />
                <Button onClick={handleSaveAsPreset} size="sm">
                  <Save className="h-4 w-4 mr-2" />Save
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setShowSavePresetInput(false); setNewPresetName(""); }}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setShowSavePresetInput(true)}>
                <Save className="h-4 w-4 mr-2" />Save as New Preset
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Saved Presets</Label>
            {presets.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                No presets saved yet.
              </p>
            ) : (
              <div className="grid gap-2">
                {presets.map((preset) => (
                  <div key={preset.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium text-sm">{preset.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{preset.settings.backgroundMode}</Badge>
                        {preset.settings.overlayEffect && preset.settings.overlayEffect !== 'none' && (
                          <Badge variant="outline" className="text-xs">{overlayEffectLabels[preset.settings.overlayEffect]}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleApplyPreset(preset)}>
                        <Copy className="h-4 w-4 mr-1" />Apply
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeletePreset(preset.id, preset.name)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t">
            <Label className="text-base font-medium">Bulk Apply</Label>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Sparkles className="h-4 w-4 mr-2" />Apply to All Courses
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apply to all courses?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will overwrite settings for all {allCourses.length} courses.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleApplyToAll}>Apply to All</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <div className="bg-background p-8 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-4">Card preview with current settings:</p>
            <div className="max-w-sm">
              <CourseCardPreview course={course} visualSettings={visualSettings} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="ghost" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />Reset
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    </div>
  );
}

// ==================== HSL/HEX CONVERSION ====================

const hslToHex = (hsl: string): string => {
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

// ==================== COLOR INPUT ====================

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

// ==================== CARD CUSTOMIZER TABS ====================

interface CardCustomizerTabsProps {
  courses: Course[];
}

function CardCustomizerTabs({ courses }: CardCustomizerTabsProps) {
  return (
    <Tabs defaultValue="course-cards" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="course-cards">Course Cards</TabsTrigger>
        <TabsTrigger value="path-style">Path Cards Style</TabsTrigger>
        <TabsTrigger value="path-content">Path Content</TabsTrigger>
      </TabsList>

      <TabsContent value="course-cards">
        <CourseCardCustomizer />
      </TabsContent>

      <TabsContent value="path-style">
        <LearningPathCardCustomizer />
      </TabsContent>

      <TabsContent value="path-content">
        <LearningPathManager courses={courses} />
      </TabsContent>
    </Tabs>
  );
}

// ==================== COURSE CARD CUSTOMIZER ====================

function CourseCardCustomizer() {
  const [settings, setSettings] = useState<CourseCardSettings>(getCourseCardSettings);
  const [presetName, setPresetName] = useState("");
  const [showSavePreset, setShowSavePreset] = useState(false);
  const presets = getAllCoursePresets();

  const updateSetting = <K extends keyof CourseCardSettings>(
    key: K,
    value: CourseCardSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveCourseCardSettings(newSettings);
  };

  const applyPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setSettings(preset.settings);
      saveCourseCardSettings(preset.settings);
      toast.success(`Applied "${preset.name}" preset`);
    }
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }
    saveCustomCoursePreset(presetName.trim(), settings);
    toast.success("Preset saved");
    setPresetName("");
    setShowSavePreset(false);
  };

  const resetToDefault = () => {
    setSettings(DEFAULT_COURSE_CARD_SETTINGS);
    saveCourseCardSettings(DEFAULT_COURSE_CARD_SETTINGS);
    toast.success("Reset to defaults");
  };

  // Sample course for preview
  const sampleCourse = {
    title: "Mastering ChatGPT for Productivity",
    description: "Learn advanced techniques to maximize your AI-powered workflows.",
    estimatedTime: "2 hours",
    courseType: "deep" as const,
    lifecycleState: "current" as const,
    difficulty: "intermediate" as const,
    capabilityTags: ["ChatGPT", "Productivity", "Automation"],
    lastUpdated: "January 2026",
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Controls */}
      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
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

        {/* Page & Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Page & Card</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ColorInput
              label="Page Background"
              value={settings.pageBackground}
              onChange={(v) => updateSetting("pageBackground", v)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorInput
                label="Card Background"
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
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorInput
                label="Title"
                value={settings.titleColor}
                onChange={(v) => updateSetting("titleColor", v)}
              />
              <div className="space-y-1.5">
                <Label className="text-xs">Title Size</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[settings.titleTypography.fontSize]}
                    onValueChange={([v]) => updateSetting("titleTypography", { ...settings.titleTypography, fontSize: v })}
                    min={12}
                    max={24}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-8">{settings.titleTypography.fontSize}px</span>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorInput
                label="Description"
                value={settings.descriptionColor}
                onChange={(v) => updateSetting("descriptionColor", v)}
              />
              <div className="space-y-1.5">
                <Label className="text-xs">Description Size</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[settings.descriptionTypography.fontSize]}
                    onValueChange={([v]) => updateSetting("descriptionTypography", { ...settings.descriptionTypography, fontSize: v })}
                    min={10}
                    max={18}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-8">{settings.descriptionTypography.fontSize}px</span>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorInput
                label="Meta Text"
                value={settings.metaColor}
                onChange={(v) => updateSetting("metaColor", v)}
              />
              <div className="space-y-1.5">
                <Label className="text-xs">Meta Size</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[settings.metaTypography.fontSize]}
                    onValueChange={([v]) => updateSetting("metaTypography", { ...settings.metaTypography, fontSize: v })}
                    min={10}
                    max={16}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-8">{settings.metaTypography.fontSize}px</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Difficulty Badges */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Difficulty Badges</CardTitle>
            <CardDescription className="text-xs">Independent colors for each level</CardDescription>
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
                  onChange={(v) => setSettings(prev => { const n = { ...prev, beginnerBadge: { ...prev.beginnerBadge, background: v } }; saveCourseCardSettings(n); return n; })}
                />
                <ColorInput
                  label="Border"
                  value={settings.beginnerBadge.border}
                  onChange={(v) => setSettings(prev => { const n = { ...prev, beginnerBadge: { ...prev.beginnerBadge, border: v } }; saveCourseCardSettings(n); return n; })}
                />
                <ColorInput
                  label="Text"
                  value={settings.beginnerBadge.text}
                  onChange={(v) => setSettings(prev => { const n = { ...prev, beginnerBadge: { ...prev.beginnerBadge, text: v } }; saveCourseCardSettings(n); return n; })}
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
                  onChange={(v) => setSettings(prev => { const n = { ...prev, intermediateBadge: { ...prev.intermediateBadge, background: v } }; saveCourseCardSettings(n); return n; })}
                />
                <ColorInput
                  label="Border"
                  value={settings.intermediateBadge.border}
                  onChange={(v) => setSettings(prev => { const n = { ...prev, intermediateBadge: { ...prev.intermediateBadge, border: v } }; saveCourseCardSettings(n); return n; })}
                />
                <ColorInput
                  label="Text"
                  value={settings.intermediateBadge.text}
                  onChange={(v) => setSettings(prev => { const n = { ...prev, intermediateBadge: { ...prev.intermediateBadge, text: v } }; saveCourseCardSettings(n); return n; })}
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
                  onChange={(v) => setSettings(prev => { const n = { ...prev, advancedBadge: { ...prev.advancedBadge, background: v } }; saveCourseCardSettings(n); return n; })}
                />
                <ColorInput
                  label="Border"
                  value={settings.advancedBadge.border}
                  onChange={(v) => setSettings(prev => { const n = { ...prev, advancedBadge: { ...prev.advancedBadge, border: v } }; saveCourseCardSettings(n); return n; })}
                />
                <ColorInput
                  label="Text"
                  value={settings.advancedBadge.text}
                  onChange={(v) => setSettings(prev => { const n = { ...prev, advancedBadge: { ...prev.advancedBadge, text: v } }; saveCourseCardSettings(n); return n; })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lifecycle Badges */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Lifecycle Badges</CardTitle>
            <CardDescription className="text-xs">Toggle visibility and customize colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: hslToCss(settings.currentBadge.background),
                    border: `1px solid ${hslToCss(settings.currentBadge.border)}`,
                    color: hslToCss(settings.currentBadge.text),
                  }}
                >
                  Current
                </span>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Show</Label>
                  <Switch
                    checked={settings.showCurrentBadge}
                    onCheckedChange={(v) => updateSetting("showCurrentBadge", v)}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <ColorInput
                  label="Background"
                  value={settings.currentBadge.background}
                  onChange={(v) => setSettings(prev => { const n = { ...prev, currentBadge: { ...prev.currentBadge, background: v } }; saveCourseCardSettings(n); return n; })}
                />
                <ColorInput
                  label="Border"
                  value={settings.currentBadge.border}
                  onChange={(v) => setSettings(prev => { const n = { ...prev, currentBadge: { ...prev.currentBadge, border: v } }; saveCourseCardSettings(n); return n; })}
                />
                <ColorInput
                  label="Text"
                  value={settings.currentBadge.text}
                  onChange={(v) => setSettings(prev => { const n = { ...prev, currentBadge: { ...prev.currentBadge, text: v } }; saveCourseCardSettings(n); return n; })}
                />
              </div>
            </div>
            <Separator />
            {/* Reference */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: hslToCss(settings.referenceBadge.background),
                    border: `1px solid ${hslToCss(settings.referenceBadge.border)}`,
                    color: hslToCss(settings.referenceBadge.text),
                  }}
                >
                  Stable Reference
                </span>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Show</Label>
                  <Switch
                    checked={settings.showReferenceBadge}
                    onCheckedChange={(v) => updateSetting("showReferenceBadge", v)}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <ColorInput
                  label="Background"
                  value={settings.referenceBadge.background}
                  onChange={(v) => setSettings(prev => { const n = { ...prev, referenceBadge: { ...prev.referenceBadge, background: v } }; saveCourseCardSettings(n); return n; })}
                />
                <ColorInput
                  label="Border"
                  value={settings.referenceBadge.border}
                  onChange={(v) => setSettings(prev => { const n = { ...prev, referenceBadge: { ...prev.referenceBadge, border: v } }; saveCourseCardSettings(n); return n; })}
                />
                <ColorInput
                  label="Text"
                  value={settings.referenceBadge.text}
                  onChange={(v) => setSettings(prev => { const n = { ...prev, referenceBadge: { ...prev.referenceBadge, text: v } }; saveCourseCardSettings(n); return n; })}
                />
              </div>
            </div>
            <Separator />
            {/* Legacy */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: hslToCss(settings.legacyBadge.background),
                    border: `1px solid ${hslToCss(settings.legacyBadge.border)}`,
                    color: hslToCss(settings.legacyBadge.text),
                  }}
                >
                  Legacy
                </span>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Show</Label>
                  <Switch
                    checked={settings.showLegacyBadge}
                    onCheckedChange={(v) => updateSetting("showLegacyBadge", v)}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <ColorInput
                  label="Background"
                  value={settings.legacyBadge.background}
                  onChange={(v) => setSettings(prev => { const n = { ...prev, legacyBadge: { ...prev.legacyBadge, background: v } }; saveCourseCardSettings(n); return n; })}
                />
                <ColorInput
                  label="Border"
                  value={settings.legacyBadge.border}
                  onChange={(v) => setSettings(prev => { const n = { ...prev, legacyBadge: { ...prev.legacyBadge, border: v } }; saveCourseCardSettings(n); return n; })}
                />
                <ColorInput
                  label="Text"
                  value={settings.legacyBadge.text}
                  onChange={(v) => setSettings(prev => { const n = { ...prev, legacyBadge: { ...prev.legacyBadge, text: v } }; saveCourseCardSettings(n); return n; })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Preview */}
      <div className="lg:sticky lg:top-4 h-fit">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Live Preview</CardTitle>
            <CardDescription className="text-xs">Changes save automatically</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="rounded-lg p-6"
              style={{ backgroundColor: hslToCss(settings.pageBackground) }}
            >
              <div
                className="rounded-xl p-5 transition-all"
                style={{
                  backgroundColor: hslToCss(settings.cardBackground),
                  border: `1px solid ${hslToCss(settings.cardBorder)}`,
                  boxShadow: shadowFromIntensity(settings.cardShadow, settings.cardShadowDirection),
                }}
              >
                {/* All difficulty badges preview */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {(['beginner', 'intermediate', 'advanced'] as const).map(diff => {
                    const badgeStyle = getDifficultyBadgeStyles(settings, diff);
                    return (
                      <span
                        key={diff}
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: hslToCss(badgeStyle.background),
                          border: `1px solid ${hslToCss(badgeStyle.border)}`,
                          color: hslToCss(badgeStyle.text),
                        }}
                      >
                        {difficultyLabels[diff]}
                      </span>
                    );
                  })}
                </div>
                {/* All lifecycle badges preview */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {(['current', 'reference', 'legacy'] as const).map(lc => {
                    const badgeStyle = getLifecycleBadgeStyles(settings, lc);
                    return (
                      <span
                        key={lc}
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: hslToCss(badgeStyle.background),
                          border: `1px solid ${hslToCss(badgeStyle.border)}`,
                          color: hslToCss(badgeStyle.text),
                        }}
                      >
                        {lifecycleStateLabels[lc]}
                      </span>
                    );
                  })}
                </div>
                <h3
                  className="mb-2 font-semibold line-clamp-2"
                  style={{
                    color: hslToCss(settings.titleColor),
                    fontSize: `${settings.titleTypography.fontSize}px`,
                    fontWeight: settings.titleTypography.fontWeight,
                  }}
                >
                  {sampleCourse.title}
                </h3>
                <p
                  className="mb-3 line-clamp-1"
                  style={{
                    color: hslToCss(settings.descriptionColor),
                    fontSize: `${settings.descriptionTypography.fontSize}px`,
                    fontWeight: settings.descriptionTypography.fontWeight,
                  }}
                >
                  {sampleCourse.description}
                </p>
                <div
                  className="flex flex-wrap items-center gap-2"
                  style={{
                    color: hslToCss(settings.metaColor),
                    fontSize: `${settings.metaTypography.fontSize}px`,
                    fontWeight: settings.metaTypography.fontWeight,
                  }}
                >
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {sampleCourse.estimatedTime}
                  </span>
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
                    style={{
                      backgroundColor: hslToCss(settings.courseTypeBadgeBackground),
                      border: `1px solid ${hslToCss(settings.courseTypeBadgeBorder)}`,
                      color: hslToCss(settings.courseTypeBadgeText),
                    }}
                  >
                    {courseTypeLabels[sampleCourse.courseType]}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ==================== LEARNING PATH CARD CUSTOMIZER ====================

import {
  LearningPathCardSettings,
  LPBackgroundMode,
  LPTextTheme,
  getLearningPathCardSettings,
  saveLearningPathCardSettings,
  getAllLearningPathPresets,
  saveCustomLearningPathPreset,
  deleteCustomLearningPathPreset,
  DEFAULT_LEARNING_PATH_CARD_SETTINGS,
  DEFAULT_LP_GRADIENT_COLORS,
  SHADOW_DIRECTIONS as LP_SHADOW_DIRECTIONS,
  hslToCss as lpHslToCss,
  shadowFromIntensity as lpShadowFromIntensity,
  ShadowDirection as LPShadowDirection,
} from "@/lib/courses/learningPathCardCustomization";

function LearningPathCardCustomizer() {
  const [settings, setSettings] = useState<LearningPathCardSettings>(getLearningPathCardSettings);
  const [presetName, setPresetName] = useState("");
  const [showSavePreset, setShowSavePreset] = useState(false);
  const presets = getAllLearningPathPresets();

  const updateSetting = <K extends keyof LearningPathCardSettings>(
    key: K,
    value: LearningPathCardSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveLearningPathCardSettings(newSettings);
  };

  const applyPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setSettings(preset.settings);
      saveLearningPathCardSettings(preset.settings);
      toast.success(`Applied "${preset.name}" preset`);
    }
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }
    saveCustomLearningPathPreset(presetName.trim(), settings);
    toast.success("Preset saved");
    setPresetName("");
    setShowSavePreset(false);
  };

  const resetToDefault = () => {
    setSettings(DEFAULT_LEARNING_PATH_CARD_SETTINGS);
    saveLearningPathCardSettings(DEFAULT_LEARNING_PATH_CARD_SETTINGS);
    toast.success("Reset to defaults");
  };

  const isPlainMode = settings.backgroundMode === 'plain';
  const isDarkText = isPlainMode || settings.textTheme === 'dark';

  // Preview card styles
  const getPreviewCardStyle = () => {
    if (settings.backgroundMode === 'plain') {
      return {
        backgroundColor: lpHslToCss(settings.cardBackground),
        borderColor: lpHslToCss(settings.cardBorder),
        boxShadow: lpShadowFromIntensity(settings.shadowIntensity, settings.shadowDirection),
      };
    }
    if (settings.backgroundMode === 'gradient') {
      return {
        background: `linear-gradient(to bottom right, ${settings.gradientFrom}, ${settings.gradientVia}, ${settings.gradientTo})`,
        borderColor: 'rgba(255,255,255,0.1)',
        boxShadow: lpShadowFromIntensity(settings.shadowIntensity, settings.shadowDirection),
      };
    }
    return {
      boxShadow: lpShadowFromIntensity(settings.shadowIntensity, settings.shadowDirection),
      borderColor: 'rgba(255,255,255,0.1)',
    };
  };

  const getImageFilter = () => {
    const brightness = 1 + (settings.imageBrightness / 100);
    return `brightness(${brightness})`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Controls */}
      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {/* Presets */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Presets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Select onValueChange={applyPreset}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a preset" />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name} {preset.isBuiltIn ? "(Built-in)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={resetToDefault}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            
            {showSavePreset ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Preset name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                />
                <Button size="sm" onClick={handleSavePreset}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowSavePreset(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="w-full" onClick={() => setShowSavePreset(true)}>
                Save Current as Preset
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Background Mode */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Background Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {(['plain', 'gradient', 'image'] as LPBackgroundMode[]).map((mode) => (
                <Button
                  key={mode}
                  variant={settings.backgroundMode === mode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSetting('backgroundMode', mode)}
                  className="capitalize"
                >
                  {mode}
                </Button>
              ))}
            </div>

            {/* Gradient controls */}
            {settings.backgroundMode === 'gradient' && (
              <div className="space-y-3 pt-2 border-t">
                <div className="space-y-2">
                  <Label className="text-xs">Gradient From</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.gradientFrom}
                      onChange={(e) => updateSetting('gradientFrom', e.target.value)}
                      className="w-12 h-8 p-1"
                    />
                    <Input
                      value={settings.gradientFrom}
                      onChange={(e) => updateSetting('gradientFrom', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Gradient Via</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.gradientVia}
                      onChange={(e) => updateSetting('gradientVia', e.target.value)}
                      className="w-12 h-8 p-1"
                    />
                    <Input
                      value={settings.gradientVia}
                      onChange={(e) => updateSetting('gradientVia', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Gradient To</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.gradientTo}
                      onChange={(e) => updateSetting('gradientTo', e.target.value)}
                      className="w-12 h-8 p-1"
                    />
                    <Input
                      value={settings.gradientTo}
                      onChange={(e) => updateSetting('gradientTo', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Image controls */}
            {settings.backgroundMode === 'image' && (
              <div className="space-y-3 pt-2 border-t">
                <div className="space-y-2">
                  <Label className="text-xs">Background Image</Label>
                  {settings.backgroundImage ? (
                    <div className="relative w-full h-24 rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={settings.backgroundImage} 
                        alt="Background preview" 
                        className="w-full h-full object-cover" 
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => updateSetting('backgroundImage', '')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-24 border-dashed"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            if (file.size > 500 * 1024) {
                              toast.error('Image must be under 500KB');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              updateSetting('backgroundImage', event.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        };
                        input.click();
                      }}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Upload Image</span>
                        <span className="text-[10px] text-muted-foreground">Max 500KB</span>
                      </div>
                    </Button>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={settings.backgroundImage.startsWith('data:') ? '' : settings.backgroundImage}
                      onChange={(e) => updateSetting('backgroundImage', e.target.value)}
                      placeholder="Or paste image URL..."
                      className="text-xs h-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Overlay Strength</Label>
                    <span className="text-xs text-muted-foreground">{settings.overlayStrength}%</span>
                  </div>
                  <Slider
                    value={[settings.overlayStrength]}
                    onValueChange={([v]) => updateSetting('overlayStrength', v)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Brightness</Label>
                    <span className="text-xs text-muted-foreground">{settings.imageBrightness}%</span>
                  </div>
                  <Slider
                    value={[settings.imageBrightness]}
                    onValueChange={([v]) => updateSetting('imageBrightness', v)}
                    min={-50}
                    max={50}
                    step={5}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Exposure (White Lift)</Label>
                    <span className="text-xs text-muted-foreground">{settings.imageExposure}%</span>
                  </div>
                  <Slider
                    value={[settings.imageExposure]}
                    onValueChange={([v]) => updateSetting('imageExposure', v)}
                    min={0}
                    max={60}
                    step={5}
                  />
                </div>
              </div>
            )}

            {/* Text theme for gradient/image modes */}
            {settings.backgroundMode !== 'plain' && (
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-xs">Text Theme</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['dark', 'light'] as LPTextTheme[]).map((theme) => (
                    <Button
                      key={theme}
                      variant={settings.textTheme === theme ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSetting('textTheme', theme)}
                      className="capitalize"
                    >
                      {theme === 'dark' ? 'Dark Text' : 'Light Text'}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Typography - Title */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Title Typography</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Font Size</Label>
                <span className="text-xs text-muted-foreground">{settings.titleFontSize}px</span>
              </div>
              <Slider
                value={[settings.titleFontSize]}
                onValueChange={([v]) => updateSetting("titleFontSize", v)}
                min={14}
                max={24}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Font Weight</Label>
              <Select
                value={String(settings.titleFontWeight)}
                onValueChange={(v) => updateSetting("titleFontWeight", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="400">Regular (400)</SelectItem>
                  <SelectItem value="500">Medium (500)</SelectItem>
                  <SelectItem value="600">Semibold (600)</SelectItem>
                  <SelectItem value="700">Bold (700)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isPlainMode && (
              <div className="space-y-2">
                <Label className="text-xs">Color (HSL)</Label>
                <Input
                  value={settings.titleColor}
                  onChange={(e) => updateSetting("titleColor", e.target.value)}
                  placeholder="0 0% 9%"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Typography - Description */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Description Typography</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Font Size</Label>
                <span className="text-xs text-muted-foreground">{settings.descriptionFontSize}px</span>
              </div>
              <Slider
                value={[settings.descriptionFontSize]}
                onValueChange={([v]) => updateSetting("descriptionFontSize", v)}
                min={10}
                max={18}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Font Weight</Label>
              <Select
                value={String(settings.descriptionFontWeight)}
                onValueChange={(v) => updateSetting("descriptionFontWeight", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="400">Regular (400)</SelectItem>
                  <SelectItem value="500">Medium (500)</SelectItem>
                  <SelectItem value="600">Semibold (600)</SelectItem>
                  <SelectItem value="700">Bold (700)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isPlainMode && (
              <div className="space-y-2">
                <Label className="text-xs">Color (HSL)</Label>
                <Input
                  value={settings.descriptionColor}
                  onChange={(e) => updateSetting("descriptionColor", e.target.value)}
                  placeholder="0 0% 45%"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Typography - Meta */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Meta Typography</CardTitle>
            <CardDescription className="text-xs">Course count text</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Font Size</Label>
                <span className="text-xs text-muted-foreground">{settings.metaFontSize}px</span>
              </div>
              <Slider
                value={[settings.metaFontSize]}
                onValueChange={([v]) => updateSetting("metaFontSize", v)}
                min={10}
                max={16}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Font Weight</Label>
              <Select
                value={String(settings.metaFontWeight)}
                onValueChange={(v) => updateSetting("metaFontWeight", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="400">Regular (400)</SelectItem>
                  <SelectItem value="500">Medium (500)</SelectItem>
                  <SelectItem value="600">Semibold (600)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isPlainMode && (
              <div className="space-y-2">
                <Label className="text-xs">Color (HSL)</Label>
                <Input
                  value={settings.metaColor}
                  onChange={(e) => updateSetting("metaColor", e.target.value)}
                  placeholder="0 0% 55%"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card Styling (Plain mode only) */}
        {isPlainMode && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Card Styling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Background (HSL)</Label>
                <Input
                  value={settings.cardBackground}
                  onChange={(e) => updateSetting("cardBackground", e.target.value)}
                  placeholder="0 0% 100%"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Border (HSL)</Label>
                <Input
                  value={settings.cardBorder}
                  onChange={(e) => updateSetting("cardBorder", e.target.value)}
                  placeholder="0 0% 90%"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shadow */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Shadow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Shadow Intensity</Label>
                <span className="text-xs text-muted-foreground">{settings.shadowIntensity}%</span>
              </div>
              <Slider
                value={[settings.shadowIntensity]}
                onValueChange={([v]) => updateSetting("shadowIntensity", v)}
                min={0}
                max={100}
                step={5}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Shadow Direction</Label>
              <Select
                value={String(settings.shadowDirection)}
                onValueChange={(v) => updateSetting("shadowDirection", Number(v) as LPShadowDirection)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LP_SHADOW_DIRECTIONS.map((dir) => (
                    <SelectItem key={dir.value} value={String(dir.value)}>
                      {dir.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Preview</h4>
        <div
          className={cn(
            "rounded-xl border overflow-hidden relative",
            !isPlainMode && "border-white/10"
          )}
          style={getPreviewCardStyle()}
        >
          {/* Background image preview */}
          {settings.backgroundMode === 'image' && settings.backgroundImage && (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ 
                  backgroundImage: `url(${settings.backgroundImage})`,
                  filter: getImageFilter(),
                }}
              />
              <div
                className="absolute inset-0 bg-black"
                style={{ opacity: settings.overlayStrength / 100 }}
              />
              {settings.imageExposure > 0 && (
                <div
                  className="absolute inset-0 bg-white"
                  style={{ opacity: settings.imageExposure / 100 }}
                />
              )}
            </>
          )}

          <div className="p-4 relative z-10">
            <h3
              className={!isPlainMode ? (isDarkText ? '' : 'text-white') : ''}
              style={{
                fontSize: `${settings.titleFontSize}px`,
                fontWeight: settings.titleFontWeight,
                color: isPlainMode ? lpHslToCss(settings.titleColor) : undefined,
              }}
            >
              Complete Beginner
            </h3>
            <p
              className={cn("mt-1", !isPlainMode ? (isDarkText ? '' : 'text-white/90') : '')}
              style={{
                fontSize: `${settings.descriptionFontSize}px`,
                fontWeight: settings.descriptionFontWeight,
                color: isPlainMode ? lpHslToCss(settings.descriptionColor) : undefined,
              }}
            >
              Never used AI before? Start here for a gentle introduction.
            </p>
            <p
              className={cn("mt-2", !isPlainMode ? (isDarkText ? '' : 'text-white/80') : '')}
              style={{
                fontSize: `${settings.metaFontSize}px`,
                fontWeight: settings.metaFontWeight,
                color: isPlainMode ? lpHslToCss(settings.metaColor) : undefined,
              }}
            >
              3 courses
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== LEARNING PATH MANAGER ====================

interface LearningPathManagerProps {
  courses: Course[];
}

function LearningPathManager({ courses }: LearningPathManagerProps) {
  const [paths, setPaths] = useState(getLearningPaths);
  const [editingPath, setEditingPath] = useState<LearningPathWithSettings | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const refreshPaths = () => setPaths(getLearningPaths());

  const handleSave = (path: LearningPathWithSettings) => {
    saveLearningPath(path);
    refreshPaths();
    toast.success("Learning path saved");
    setIsEditorOpen(false);
    setEditingPath(null);
  };

  const handleDelete = (id: string) => {
    deleteLearningPath(id);
    refreshPaths();
    toast.success("Learning path deleted");
  };

  const movePath = (index: number, direction: 'up' | 'down') => {
    const newPaths = [...paths];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newPaths.length) return;
    [newPaths[index], newPaths[newIndex]] = [newPaths[newIndex], newPaths[index]];
    newPaths.forEach(p => saveLearningPath(p));
    setPaths(newPaths);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">Learning Paths</h3>
          <p className="text-sm text-muted-foreground">Manage Suggested Starting Points content</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditingPath(null);
            setIsEditorOpen(true);
          }}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Path
        </Button>
      </div>

      <div className="space-y-2">
        {paths.map((path, index) => (
          <div
            key={path.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{path.title}</p>
              <p className="text-xs text-muted-foreground truncate">{path.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {path.courseIds.length} courses
                </Badge>
                {path.defaultOpen && (
                  <Badge variant="secondary" className="text-xs">Auto-expand</Badge>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => movePath(index, 'up')} disabled={index === 0}>
                ↑
              </Button>
              <Button size="sm" variant="ghost" onClick={() => movePath(index, 'down')} disabled={index === paths.length - 1}>
                ↓
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingPath(path);
                  setIsEditorOpen(true);
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
                    <AlertDialogTitle>Delete Learning Path</AlertDialogTitle>
                    <AlertDialogDescription>
                      Delete "{path.title}"? This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(path.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPath ? 'Edit Learning Path' : 'New Learning Path'}</DialogTitle>
          </DialogHeader>
          <LearningPathEditor
            path={editingPath}
            courses={courses}
            onSave={handleSave}
            onClose={() => {
              setIsEditorOpen(false);
              setEditingPath(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== LEARNING PATH EDITOR ====================

interface LearningPathEditorProps {
  path: LearningPathWithSettings | null;
  courses: Course[];
  onSave: (path: LearningPathWithSettings) => void;
  onClose: () => void;
}

function LearningPathEditor({ path, courses, onSave, onClose }: LearningPathEditorProps) {
  const [formData, setFormData] = useState<LearningPathWithSettings>(() => {
    if (path) return { ...path };
    return {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      courseIds: [],
      defaultOpen: false,
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    onSave(formData);
  };

  const toggleCourse = (courseId: string) => {
    setFormData(prev => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter(id => id !== courseId)
        : [...prev.courseIds, courseId],
    }));
  };

  const moveCourse = (index: number, direction: 'up' | 'down') => {
    const newIds = [...formData.courseIds];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newIds.length) return;
    [newIds[index], newIds[newIndex]] = [newIds[newIndex], newIds[index]];
    setFormData(prev => ({ ...prev, courseIds: newIds }));
  };

  const selectedCourses = formData.courseIds
    .map(id => courses.find(c => c.id === id))
    .filter((c): c is Course => c !== undefined);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pathTitle">Title *</Label>
        <Input
          id="pathTitle"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Complete Beginner"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pathDesc">Description</Label>
        <Textarea
          id="pathDesc"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of this learning path"
          rows={2}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="defaultOpen"
          checked={formData.defaultOpen}
          onCheckedChange={(checked) => setFormData({ ...formData, defaultOpen: !!checked })}
        />
        <Label htmlFor="defaultOpen" className="font-normal">
          Auto-expand (show courses by default)
        </Label>
      </div>

      <div className="space-y-2">
        <Label>Courses in Path ({formData.courseIds.length} selected)</Label>
        
        {/* Selected courses with reorder */}
        {selectedCourses.length > 0 && (
          <div className="space-y-1 mb-3">
            {selectedCourses.map((course, index) => (
              <div key={course.id} className="flex items-center gap-2 p-2 rounded border border-border bg-muted/50">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm truncate">{course.title}</span>
                <Button type="button" size="sm" variant="ghost" onClick={() => moveCourse(index, 'up')} disabled={index === 0}>
                  ↑
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => moveCourse(index, 'down')} disabled={index === selectedCourses.length - 1}>
                  ↓
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => toggleCourse(course.id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {/* Available courses */}
        <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
          {courses.filter(c => !formData.courseIds.includes(c.id)).map(course => (
            <div
              key={course.id}
              className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
              onClick={() => toggleCourse(course.id)}
            >
              <Checkbox checked={false} />
              <span className="text-sm">{course.title}</span>
            </div>
          ))}
          {courses.filter(c => !formData.courseIds.includes(c.id)).length === 0 && (
            <p className="text-sm text-muted-foreground py-2 text-center">All courses selected</p>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  );
}

// ==================== MAIN PAGE ====================

const CourseManagement = () => {
  const [courses, setCourses] = useState<Course[]>(getCourses);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Course editor
  const [courseEditorOpen, setCourseEditorOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  
  // Visual editor
  const [visualEditorOpen, setVisualEditorOpen] = useState(false);
  const [visualEditingCourse, setVisualEditingCourse] = useState<Course | null>(null);
  
  // Card customizer
  const [cardCustomizerOpen, setCardCustomizerOpen] = useState(false);

  useEffect(() => {
    loadCourses().then(() => setCourses(getCourses()));
  }, []);

  const refreshData = () => {
    setCourses(getCourses());
  };

  const filteredCourses = searchQuery.trim()
    ? courses.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.capabilityTags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : courses;

  const handleSaveCourse = async (course: Course) => {
    await saveCourse(course);
    refreshData();
  };

  const handleDeleteCourse = async (id: string) => {
    await deleteCourse(id);
    refreshData();
    toast.success('Course deleted');
  };

  return (
    <AppLayout>
      <GovernanceHeader
        title="Course Management"
        description="Create, edit, and customize visual settings for courses."
      />

      {/* Actions bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <Dialog open={cardCustomizerOpen} onOpenChange={setCardCustomizerOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Palette className="h-4 w-4" />
                Customize Cards
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Customize Cards</DialogTitle>
                <DialogDescription>
                  Customize the appearance of course cards and learning paths.
                </DialogDescription>
              </DialogHeader>
              <CardCustomizerTabs courses={courses} />
            </DialogContent>
          </Dialog>

          <Dialog open={courseEditorOpen} onOpenChange={setCourseEditorOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingCourse(null)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
                <DialogDescription>
                  {editingCourse ? 'Update course details.' : 'Add a new course to the library.'}
                </DialogDescription>
              </DialogHeader>
              <CourseEditor
                course={editingCourse}
                onSave={handleSaveCourse}
                onClose={() => setCourseEditorOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Courses table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.length > 0 ? (
                filteredCourses.map(course => {
                  const stored = getCourseVisualSettings(course.id);
                  const hasCustomVisuals = stored.backgroundMode !== 'plain' || 
                                           stored.backgroundImage || 
                                           stored.logoUrl ||
                                           stored.accentColor;
                  
                  return (
                    <TableRow key={course.id}>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{course.title}</p>
                            {hasCustomVisuals && (
                              <Badge variant="secondary" className="text-xs">Customized</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                            {course.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {course.estimatedTime}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{courseTypeLabels[course.courseType]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={course.lifecycleState === 'current' ? 'default' : 'secondary'}
                          className={course.lifecycleState === 'legacy' ? 'opacity-60' : ''}
                        >
                          {lifecycleStateLabels[course.lifecycleState]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setEditingCourse(course);
                              setCourseEditorOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setVisualEditingCourse(course);
                              setVisualEditorOpen(true);
                            }}
                          >
                            <Palette className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Course</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Delete "{course.title}"? This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteCourse(course.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No courses match your search.' : 'No courses yet. Create your first course.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Visual Settings Editor Dialog */}
      <Dialog open={visualEditorOpen} onOpenChange={setVisualEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Visual Settings</DialogTitle>
            <DialogDescription>{visualEditingCourse?.title}</DialogDescription>
          </DialogHeader>
          {visualEditingCourse && (
            <VisualSettingsEditor
              course={visualEditingCourse}
              onClose={() => setVisualEditorOpen(false)}
              allCourses={courses}
            />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

// ==================== PREVIEW COMPONENT ====================

interface CourseCardPreviewProps {
  course: Course;
  visualSettings: CourseVisualSettings;
}

const CourseCardPreview = ({ course, visualSettings }: CourseCardPreviewProps) => {
  const { title, description, estimatedTime, courseType, lifecycleState, capabilityTags = [], lastUpdated } = course;
  const { backgroundMode, backgroundImage, overlayStrength, textTheme, accentColor, logoUrl, gradientFrom, gradientVia, gradientTo, overlayEffect = 'none' } = visualSettings;

  const displayTags = capabilityTags.slice(0, 6);
  const isDarkText = textTheme === 'dark';
  const textPrimary = isDarkText ? 'text-foreground' : 'text-white';
  const textSecondary = isDarkText ? 'text-muted-foreground' : 'text-white/90';
  const textMuted = isDarkText ? 'text-muted-foreground/70' : 'text-white/80';

  const gradientStyle = backgroundMode === 'gradient' ? {
    background: `linear-gradient(to bottom right, ${gradientFrom || defaultGradientColors.from}, ${gradientVia || defaultGradientColors.via}, ${gradientTo || defaultGradientColors.to})`
  } : undefined;

  return (
    <div
      className={cn(
        "relative flex flex-col h-full rounded-xl overflow-hidden border shadow-sm",
        backgroundMode === 'plain' ? 'bg-card border-border' : 'border-white/10'
      )}
      style={{ ...gradientStyle, ...(accentColor ? { borderColor: accentColor } : {}) }}
    >
      {backgroundMode === 'image' && backgroundImage && (
        <>
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImage})` }} />
          <div className="absolute inset-0 bg-black" style={{ opacity: overlayStrength / 100 }} />
        </>
      )}

      {backgroundMode === 'gradient' && overlayEffect !== 'none' && (
        <AIOverlayEffects effect={overlayEffect} />
      )}

      <div className="relative z-20 flex flex-col h-full p-5">
        {logoUrl && <img src={logoUrl} alt="" className="h-8 w-8 rounded-lg object-contain mb-3" />}
        <h3 className={cn("text-base font-medium line-clamp-2", textPrimary)}>{title}</h3>
        <p className={cn("mt-2 text-sm line-clamp-1", textSecondary)}>{description}</p>
        <div className={cn("mt-3 flex flex-wrap items-center gap-2 text-xs", textMuted)}>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{estimatedTime}</span>
          <Badge variant="outline" className={cn("text-xs", isDarkText ? "border-border" : "border-white/20 bg-white/5 text-white/70")}>
            {courseTypeLabels[courseType]}
          </Badge>
          <Badge variant="outline" className={cn("text-xs", lifecycleState === 'current' && "border-primary/40 text-primary")}>
            {lifecycleStateLabels[lifecycleState]}
          </Badge>
        </div>
        {displayTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {displayTags.map((tag) => (
              <Badge key={tag} variant="outline" className={cn("text-xs", isDarkText ? "border-border bg-muted" : "border-white/10 bg-white/5 text-white/60")}>
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <div className="mt-auto pt-4 flex items-center justify-between">
          <span className={cn("text-xs", textMuted)}>Updated {lastUpdated}</span>
          <ArrowRight className={cn("h-4 w-4", textMuted)} />
        </div>
      </div>
    </div>
  );
};

export default CourseManagement;
