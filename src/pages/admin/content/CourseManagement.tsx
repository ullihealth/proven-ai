import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, ArrowRight, Upload, RotateCcw, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { courses } from "@/data/coursesData";
import type { Course, CourseVisualSettings, CardBackgroundMode, CardTextTheme } from "@/lib/courses/types";
import { courseTypeLabels, lifecycleStateLabels, defaultVisualSettings, defaultGradientColors } from "@/lib/courses/types";
import {
  getCourseVisualSettings,
  saveCourseVisualSettings,
  resetCourseVisualSettings,
} from "@/lib/courses/coursesStore";
import { toast } from "sonner";

const CourseManagement = () => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [visualSettings, setVisualSettings] = useState<CourseVisualSettings>(defaultVisualSettings);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Load settings when course is selected
  useEffect(() => {
    if (selectedCourse) {
      const stored = getCourseVisualSettings(selectedCourse.id);
      setVisualSettings(stored);
    }
  }, [selectedCourse]);

  const handleOpenEditor = (course: Course) => {
    setSelectedCourse(course);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedCourse) return;
    saveCourseVisualSettings(selectedCourse.id, visualSettings);
    toast.success("Visual settings saved", {
      description: `Settings for "${selectedCourse.title}" have been updated.`,
    });
    setIsDialogOpen(false);
  };

  const handleReset = () => {
    if (!selectedCourse) return;
    resetCourseVisualSettings(selectedCourse.id);
    setVisualSettings(defaultVisualSettings);
    toast.success("Settings reset to defaults");
  };

  const handleImageUpload = (field: 'backgroundImage' | 'logoUrl') => {
    // Create file input
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
    <AppLayout>
      <div className="pb-6 border-b border-border mb-8">
        <h1 className="text-2xl font-semibold text-foreground">
          Course Management
        </h1>
        <p className="mt-1 text-muted-foreground">
          Customize visual settings for course cards.
        </p>
      </div>

      {/* Course List */}
      <div className="space-y-4">
        <div className="grid gap-4">
          {courses.map((course) => {
            const stored = getCourseVisualSettings(course.id);
            const hasCustomSettings = stored.backgroundMode !== 'plain' || 
                                      stored.backgroundImage || 
                                      stored.logoUrl ||
                                      stored.accentColor;
            
            return (
              <Card
                key={course.id}
                className="hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => handleOpenEditor(course)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground truncate">
                        {course.title}
                      </h3>
                      {hasCustomSettings && (
                        <Badge variant="secondary" className="text-xs">
                          Customized
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {course.estimatedTime}
                      </span>
                      <span>{courseTypeLabels[course.courseType]}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          course.lifecycleState === 'current' && "border-primary/40 text-primary"
                        )}
                      >
                        {lifecycleStateLabels[course.lifecycleState]}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Edit Visuals
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Visual Settings Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Visual Settings</DialogTitle>
            <DialogDescription>
              {selectedCourse?.title}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="settings" className="mt-4">
            <TabsList>
              <TabsTrigger value="settings">Settings</TabsTrigger>
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

              {/* Gradient Colors (only for gradient mode) */}
              {visualSettings.backgroundMode === 'gradient' && (
                <div className="space-y-4">
                  <Label>Gradient Colors</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground">From</span>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={visualSettings.gradientFrom || defaultGradientColors.from}
                          onChange={(e) =>
                            setVisualSettings(prev => ({ ...prev, gradientFrom: e.target.value }))
                          }
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={visualSettings.gradientFrom || defaultGradientColors.from}
                          onChange={(e) =>
                            setVisualSettings(prev => ({ ...prev, gradientFrom: e.target.value }))
                          }
                          className="flex-1 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground">Via</span>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={visualSettings.gradientVia || defaultGradientColors.via}
                          onChange={(e) =>
                            setVisualSettings(prev => ({ ...prev, gradientVia: e.target.value }))
                          }
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={visualSettings.gradientVia || defaultGradientColors.via}
                          onChange={(e) =>
                            setVisualSettings(prev => ({ ...prev, gradientVia: e.target.value }))
                          }
                          className="flex-1 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground">To</span>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={visualSettings.gradientTo || defaultGradientColors.to}
                          onChange={(e) =>
                            setVisualSettings(prev => ({ ...prev, gradientTo: e.target.value }))
                          }
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={visualSettings.gradientTo || defaultGradientColors.to}
                          onChange={(e) =>
                            setVisualSettings(prev => ({ ...prev, gradientTo: e.target.value }))
                          }
                          className="flex-1 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVisualSettings(prev => ({
                      ...prev,
                      gradientFrom: defaultGradientColors.from,
                      gradientVia: defaultGradientColors.via,
                      gradientTo: defaultGradientColors.to,
                    }))}
                  >
                    <RotateCcw className="h-3 w-3 mr-2" />
                    Reset to Default Gradient
                  </Button>
                </div>
              )}

              {/* Background Image (only for image mode) */}
              {visualSettings.backgroundMode === 'image' && (
                <div className="space-y-2">
                  <Label>Background Image</Label>
                  {visualSettings.backgroundImage ? (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={visualSettings.backgroundImage}
                        alt="Background preview"
                        className="w-full h-full object-cover"
                      />
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
                        <span className="text-sm text-muted-foreground">
                          Click to upload background image
                        </span>
                      </div>
                    </Button>
                  )}
                </div>
              )}

              {/* Overlay Strength (for image mode only) */}
              {visualSettings.backgroundMode === 'image' && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Overlay Strength</Label>
                    <span className="text-sm text-muted-foreground">
                      {visualSettings.overlayStrength}%
                    </span>
                  </div>
                  <Slider
                    value={[visualSettings.overlayStrength]}
                    onValueChange={([value]) =>
                      setVisualSettings(prev => ({ ...prev, overlayStrength: value }))
                    }
                    min={0}
                    max={80}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Controls how dark the overlay is to ensure text readability over your image.
                  </p>
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
                    onChange={(e) =>
                      setVisualSettings(prev => ({ ...prev, accentColor: e.target.value }))
                    }
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    placeholder="#2563eb"
                    value={visualSettings.accentColor || ''}
                    onChange={(e) =>
                      setVisualSettings(prev => ({ ...prev, accentColor: e.target.value }))
                    }
                    className="flex-1"
                  />
                  {visualSettings.accentColor && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setVisualSettings(prev => ({ ...prev, accentColor: undefined }))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Used for border highlights and focus states.
                </p>
              </div>

              {/* Logo/Icon Upload */}
              <div className="space-y-2">
                <Label>Logo/Icon (optional)</Label>
                <div className="flex items-center gap-4">
                  {visualSettings.logoUrl ? (
                    <div className="relative">
                      <img
                        src={visualSettings.logoUrl}
                        alt="Logo preview"
                        className="h-12 w-12 rounded-lg object-contain bg-muted"
                      />
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
                    <Button
                      variant="outline"
                      className="h-12 w-12"
                      onClick={() => handleImageUpload('logoUrl')}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Small icon shown at top-left of card
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <div className="bg-background p-8 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-4">
                  Card preview with current settings:
                </p>
                {selectedCourse && (
                  <div className="max-w-sm">
                    <CourseCardPreview
                      course={selectedCourse}
                      visualSettings={visualSettings}
                    />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t mt-6">
            <Button variant="ghost" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

// Preview component matching CustomizableCourseCard
interface CourseCardPreviewProps {
  course: Course;
  visualSettings: CourseVisualSettings;
}

const CourseCardPreview = ({ course, visualSettings }: CourseCardPreviewProps) => {
  const {
    title,
    description,
    estimatedTime,
    courseType,
    lifecycleState,
    capabilityTags = [],
    lastUpdated,
  } = course;

  const {
    backgroundMode,
    backgroundImage,
    overlayStrength,
    textTheme,
    accentColor,
    logoUrl,
    gradientFrom,
    gradientVia,
    gradientTo,
  } = visualSettings;

  const displayTags = capabilityTags.slice(0, 6);
  const isDarkText = textTheme === 'dark';
  const textPrimary = isDarkText ? 'text-foreground' : 'text-white';
  const textSecondary = isDarkText ? 'text-muted-foreground' : 'text-white/70';
  const textMuted = isDarkText ? 'text-muted-foreground/70' : 'text-white/50';

  // Build gradient style for custom colors
  const gradientStyle = backgroundMode === 'gradient' ? {
    background: `linear-gradient(to bottom right, ${gradientFrom || defaultGradientColors.from}, ${gradientVia || defaultGradientColors.via}, ${gradientTo || defaultGradientColors.to})`
  } : undefined;

  const getBackgroundClass = () => {
    switch (backgroundMode) {
      case 'gradient':
        return ''; // Using inline style instead
      case 'image':
        return '';
      case 'plain':
      default:
        return 'bg-card';
    }
  };

  const borderStyle = accentColor ? { borderColor: accentColor } : undefined;
  const accentBorderClass = accentColor
    ? ''
    : backgroundMode === 'plain'
      ? 'border-border'
      : 'border-white/10';

  return (
    <div
      className={cn(
        "relative flex flex-col h-full",
        "rounded-xl overflow-hidden",
        "border shadow-sm",
        getBackgroundClass(),
        accentBorderClass
      )}
      style={{ ...borderStyle, ...gradientStyle }}
    >
      {backgroundMode === 'image' && backgroundImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: overlayStrength / 100 }}
          />
        </>
      )}

      {backgroundMode === 'gradient' && (
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent" />
          <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent" />
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full p-5">
        {logoUrl && (
          <div className="mb-3">
            <img
              src={logoUrl}
              alt=""
              className="h-8 w-8 rounded-lg object-contain"
            />
          </div>
        )}

        <h3 className={cn("text-base font-medium line-clamp-2", textPrimary)}>
          {title}
        </h3>

        <p className={cn("mt-2 text-sm line-clamp-1", textSecondary)}>
          {description}
        </p>

        <div className={cn("mt-3 flex flex-wrap items-center gap-2 text-xs", textMuted)}>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {estimatedTime}
          </span>
          <span className={isDarkText ? "text-border" : "text-white/30"}>•</span>
          <Badge
            variant="outline"
            className={cn(
              "text-xs px-2 py-0 font-normal",
              isDarkText
                ? "border-border bg-muted text-muted-foreground"
                : "border-white/20 bg-white/5 text-white/70"
            )}
          >
            {courseTypeLabels[courseType]}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "text-xs px-2 py-0 font-normal",
              isDarkText
                ? cn(
                    "border-border",
                    lifecycleState === 'current' && "border-primary/40 text-primary bg-primary/5"
                  )
                : cn(
                    "border-white/20 bg-white/5",
                    lifecycleState === 'current' && "border-primary/40 text-primary bg-primary/10"
                  )
            )}
          >
            {lifecycleStateLabels[lifecycleState]}
          </Badge>
        </div>

        {displayTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {displayTags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={cn(
                  "text-xs px-2 py-0.5 font-normal",
                  isDarkText
                    ? "border-border bg-muted text-muted-foreground"
                    : "border-white/10 bg-white/5 text-white/60"
                )}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between">
          <span className={cn("text-xs", textMuted)}>
            Updated {lastUpdated}
          </span>
          <ArrowRight className={cn("h-4 w-4", textMuted)} />
        </div>
      </div>
    </div>
  );
};

export default CourseManagement;
