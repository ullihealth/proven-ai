import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { GovernanceHeader } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Course, CourseVisualSettings, CardBackgroundMode, CardTextTheme, CardOverlayEffect, VisualPreset, CourseType, LifecycleState, CoursePriceTier } from "@/lib/courses/types";
import { courseTypeLabels, lifecycleStateLabels, defaultVisualSettings, defaultGradientColors, overlayEffectLabels } from "@/lib/courses/types";
import { AIOverlayEffects } from "@/components/courses/AIOverlayEffects";
import { CourseCardCustomizer } from "@/components/courses/CourseCardCustomizer";
import { computePriceTier, getPriceTierLabel } from "@/lib/courses/entitlements";
import {
  getCourses,
  getCourseById,
  saveCourse,
  deleteCourse,
  getCourseVisualSettings,
  saveCourseVisualSettings,
  resetCourseVisualSettings,
  getAllPresets,
  savePreset,
  deletePreset,
  applySettingsToAllCourses,
} from "@/lib/courses/coursesStore";
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

  const handleImageUpload = (field: 'backgroundImage' | 'logoUrl') => {
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

  const removeImage = (field: 'backgroundImage' | 'logoUrl') => {
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

// ==================== MAIN PAGE ====================

const CourseManagement = () => {
  const [courses, setCourses] = useState(getCourses);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Course editor
  const [courseEditorOpen, setCourseEditorOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  
  // Visual editor
  const [visualEditorOpen, setVisualEditorOpen] = useState(false);
  const [visualEditingCourse, setVisualEditingCourse] = useState<Course | null>(null);
  
  // Card customizer
  const [cardCustomizerOpen, setCardCustomizerOpen] = useState(false);

  const refreshData = () => {
    setCourses(getCourses());
  };

  const filteredCourses = searchQuery.trim()
    ? courses.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.capabilityTags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : courses;

  const handleSaveCourse = (course: Course) => {
    saveCourse(course);
    refreshData();
  };

  const handleDeleteCourse = (id: string) => {
    deleteCourse(id);
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
          {/* Customize Cards Button */}
          <Dialog open={cardCustomizerOpen} onOpenChange={setCardCustomizerOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Customize Cards
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Customize Course Cards</DialogTitle>
                <DialogDescription>
                  Adjust colors, shadows, and badge styles for all course cards.
                </DialogDescription>
              </DialogHeader>
              <CourseCardCustomizer onClose={() => setCardCustomizerOpen(false)} />
            </DialogContent>
          </Dialog>
          
          {/* Add Course Button */}
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
