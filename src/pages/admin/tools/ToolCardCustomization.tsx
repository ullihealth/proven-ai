import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { GovernanceHeader } from "@/components/admin/GovernanceHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { 
  Save, 
  RotateCcw, 
  Palette, 
  Image as ImageIcon, 
  Trash2, 
  Upload,
  Star,
  ArrowRight,
  Check,
  X
} from "lucide-react";
import { toast } from "sonner";
import {
  ToolCardSettings,
  ShadowDirection,
  getCoreToolsCardSettings,
  getDirectoryCardSettings,
  saveCoreToolsCardSettings,
  saveDirectoryCardSettings,
  getAllToolPresets,
  saveCustomToolPreset,
  deleteCustomToolPreset,
  getToolLogos,
  saveToolLogo,
  deleteToolLogo,
  DEFAULT_CORE_TOOLS_SETTINGS,
  DEFAULT_DIRECTORY_SETTINGS,
  SHADOW_DIRECTIONS,
  hslToCss,
  shadowFromIntensity,
} from "@/lib/tools";
import { toolsData } from "@/data/toolsData";
import { directoryTools } from "@/data/directoryToolsData";

// Convert HSL string to hex
const hslToHex = (hsl: string): string => {
  try {
    // Parse HSL values
    const parts = hsl.split(/\s+/);
    if (parts.length < 3) return "#ffffff";
    
    const h = parseFloat(parts[0]) || 0;
    const s = parseFloat(parts[1]) / 100 || 0;
    const l = parseFloat(parts[2].split('/')[0]) / 100 || 0;
    
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  } catch {
    return "#ffffff";
  }
};

// Convert hex to HSL string
const hexToHsl = (hex: string): string => {
  try {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "0 0% 100%";
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
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
  } catch {
    return "0 0% 100%";
  }
};

// Color picker component with hex input
const ColorPicker = ({ 
  label, 
  value, 
  onChange 
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void;
}) => {
  const hexValue = hslToHex(value);
  
  const handleHexInput = (inputHex: string) => {
    // Allow partial input while typing
    let cleanHex = inputHex.replace(/[^a-fA-F0-9#]/g, '');
    
    // Add # if missing
    if (!cleanHex.startsWith('#')) {
      cleanHex = '#' + cleanHex;
    }
    
    // Only convert if we have a valid 6-character hex
    if (/^#[a-fA-F0-9]{6}$/i.test(cleanHex)) {
      onChange(hexToHsl(cleanHex));
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={hexValue.toUpperCase()}
          onChange={(e) => handleHexInput(e.target.value)}
          className="w-20 h-8 px-2 text-xs font-mono uppercase"
          placeholder="#FFFFFF"
        />
        <div 
          className="w-8 h-8 rounded border border-border flex-shrink-0"
          style={{ backgroundColor: hslToCss(value) }}
        />
        <input
          type="color"
          value={hexValue}
          onChange={(e) => onChange(hexToHsl(e.target.value))}
          className="w-10 h-8 cursor-pointer rounded border-0 flex-shrink-0"
        />
      </div>
    </div>
  );
};

// Preview card component for Core Tools
const CoreToolPreview = ({ settings, logo }: { settings: ToolCardSettings; logo?: string }) => (
  <div 
    className="p-4 rounded-xl"
    style={{ backgroundColor: hslToCss(settings.pageBackground ?? "210 20% 98%") }}
  >
    <div 
      className="p-4 rounded-xl border transition-all"
      style={{
        backgroundColor: hslToCss(settings.cardBackground),
        borderColor: hslToCss(settings.cardBorder),
        boxShadow: shadowFromIntensity(settings.cardShadow ?? 0, settings.cardShadowDirection ?? 180),
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span 
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
              style={{
                backgroundColor: hslToCss(settings.badgeBackground),
                color: hslToCss(settings.badgeTextColor),
              }}
            >
              <Star className="h-3 w-3" />
              Core
            </span>
            <span className="text-xs" style={{ color: hslToCss(settings.descriptionColor) }}>
              Category
            </span>
          </div>
          <div className="flex items-center gap-3">
            {logo && (
              <img src={logo} alt="Tool logo" className="w-8 h-8 rounded object-contain" />
            )}
            <h3 
              className="text-lg font-semibold"
              style={{ color: hslToCss(settings.titleColor) }}
            >
              Example Tool
            </h3>
          </div>
          <p 
            className="mt-2 text-sm leading-relaxed"
            style={{ color: hslToCss(settings.descriptionColor) }}
          >
            This is a preview of how your tool cards will look with the current settings.
          </p>
          
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div 
              className="p-2 rounded-lg border"
              style={{
                backgroundColor: hslToCss(settings.subCardPositiveBackground),
                borderColor: hslToCss(settings.subCardPositiveBorder),
                boxShadow: shadowFromIntensity(settings.subCardShadow ?? 0, settings.subCardShadowDirection ?? 180),
              }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: hslToCss(settings.subCardTitleColor) }}>
                Use when you...
              </p>
              <div className="flex items-start gap-1">
                <Check className="h-3 w-3 mt-0.5" style={{ color: hslToCss(settings.positiveAccent) }} />
                <span className="text-xs" style={{ color: hslToCss(settings.subCardTextColor) }}>
                  Example use case
                </span>
              </div>
            </div>
            <div 
              className="p-2 rounded-lg border"
              style={{
                backgroundColor: hslToCss(settings.subCardNegativeBackground),
                borderColor: hslToCss(settings.subCardNegativeBorder),
                boxShadow: shadowFromIntensity(settings.subCardShadow ?? 0, settings.subCardShadowDirection ?? 180),
              }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: hslToCss(settings.subCardTitleColor) }}>
                Skip if you...
              </p>
              <div className="flex items-start gap-1">
                <X className="h-3 w-3 mt-0.5" style={{ color: hslToCss(settings.negativeAccent) }} />
                <span className="text-xs" style={{ color: hslToCss(settings.subCardTextColor) }}>
                  Example skip case
                </span>
              </div>
            </div>
          </div>
        </div>
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${hslToCss(settings.accentColor)}20` }}
        >
          <ArrowRight className="h-4 w-4" style={{ color: hslToCss(settings.accentColor) }} />
        </div>
      </div>
    </div>
  </div>
);

// Preview card for Directory
const DirectoryPreview = ({ settings, logo }: { settings: ToolCardSettings; logo?: string }) => (
  <div 
    className="p-3 rounded-xl"
    style={{ backgroundColor: hslToCss(settings.pageBackground ?? "210 20% 98%") }}
  >
    <div 
      className="p-3 rounded-xl border transition-all"
      style={{
        backgroundColor: hslToCss(settings.cardBackground),
        borderColor: hslToCss(settings.cardBorder),
        boxShadow: shadowFromIntensity(settings.cardShadow ?? 0, settings.cardShadowDirection ?? 180),
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {logo && (
              <img src={logo} alt="Tool logo" className="w-6 h-6 rounded object-contain" />
            )}
            <h3 
              className="font-semibold text-base"
              style={{ color: hslToCss(settings.titleColor) }}
            >
              Example Tool
            </h3>
            <span 
              className="px-1.5 py-0.5 rounded text-xs font-medium"
              style={{
                backgroundColor: hslToCss(settings.badgeBackground),
                color: hslToCss(settings.badgeTextColor),
              }}
            >
              Recommended
            </span>
          </div>
          <p 
            className="mt-1.5 text-sm leading-relaxed"
            style={{ color: hslToCss(settings.descriptionColor) }}
          >
            Best for a specific use case that matters to users
          </p>
        </div>
        <div 
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${hslToCss(settings.accentColor)}20` }}
        >
          <ArrowRight className="h-3.5 w-3.5" style={{ color: hslToCss(settings.accentColor) }} />
        </div>
      </div>
    </div>
  </div>
);

// Settings editor component
const SettingsEditor = ({ 
  settings, 
  onChange,
  defaultSettings,
}: { 
  settings: ToolCardSettings; 
  onChange: (settings: ToolCardSettings) => void;
  defaultSettings: ToolCardSettings;
}) => {
  const presets = getAllToolPresets();

  return (
    <div className="space-y-6">
      {/* Preset selector */}
      <div className="space-y-2">
        <Label>Apply Preset</Label>
        <Select onValueChange={(id) => {
          const preset = presets.find(p => p.id === id);
          if (preset) {
            onChange(preset.settings);
            toast.success(`Applied "${preset.name}" preset`);
          }
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Select a preset..." />
          </SelectTrigger>
          <SelectContent>
            {presets.map(preset => (
              <SelectItem key={preset.id} value={preset.id}>
                {preset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Page Background */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Page Background</h4>
        <ColorPicker 
          label="Background Color" 
          value={settings.pageBackground ?? "210 20% 98%"} 
          onChange={(v) => onChange({ ...settings, pageBackground: v })} 
        />
      </div>

      <Separator />

      {/* Intro Callout */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Intro Callout</h4>
        <ColorPicker 
          label="Background" 
          value={settings.calloutBackground ?? "217 91% 60% / 0.05"} 
          onChange={(v) => onChange({ ...settings, calloutBackground: v })} 
        />
        <ColorPicker 
          label="Border" 
          value={settings.calloutBorder ?? "217 91% 60% / 0.1"} 
          onChange={(v) => onChange({ ...settings, calloutBorder: v })} 
        />
        <ColorPicker 
          label="Icon Background" 
          value={settings.calloutIconBackground ?? "217 91% 60% / 0.1"} 
          onChange={(v) => onChange({ ...settings, calloutIconBackground: v })} 
        />
        <ColorPicker 
          label="Title Color" 
          value={settings.calloutTitleColor ?? "222 47% 11%"} 
          onChange={(v) => onChange({ ...settings, calloutTitleColor: v })} 
        />
        <ColorPicker 
          label="Text Color" 
          value={settings.calloutTextColor ?? "220 9% 46%"} 
          onChange={(v) => onChange({ ...settings, calloutTextColor: v })} 
        />
      </div>

      <Separator />

      {/* Main Card */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Main Card</h4>
        <ColorPicker 
          label="Background" 
          value={settings.cardBackground} 
          onChange={(v) => onChange({ ...settings, cardBackground: v })} 
        />
        <ColorPicker 
          label="Border" 
          value={settings.cardBorder} 
          onChange={(v) => onChange({ ...settings, cardBorder: v })} 
        />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Shadow / 3D Depth</Label>
            <span className="text-xs text-muted-foreground">{settings.cardShadow ?? 0}%</span>
          </div>
          <Slider
            value={[settings.cardShadow ?? 0]}
            onValueChange={(v) => onChange({ ...settings, cardShadow: v[0] })}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Shadow Direction</Label>
          <Select 
            value={String(settings.cardShadowDirection ?? 180)}
            onValueChange={(v) => onChange({ ...settings, cardShadowDirection: Number(v) as ShadowDirection })}
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHADOW_DIRECTIONS.map(dir => (
                <SelectItem key={dir.value} value={String(dir.value)} className="text-xs">
                  {dir.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Sub Cards */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Sub Cards (Use / Skip)</h4>
        <ColorPicker 
          label="Positive Background" 
          value={settings.subCardPositiveBackground} 
          onChange={(v) => onChange({ ...settings, subCardPositiveBackground: v })} 
        />
        <ColorPicker 
          label="Positive Border" 
          value={settings.subCardPositiveBorder} 
          onChange={(v) => onChange({ ...settings, subCardPositiveBorder: v })} 
        />
        <ColorPicker 
          label="Negative Background" 
          value={settings.subCardNegativeBackground} 
          onChange={(v) => onChange({ ...settings, subCardNegativeBackground: v })} 
        />
        <ColorPicker 
          label="Negative Border" 
          value={settings.subCardNegativeBorder} 
          onChange={(v) => onChange({ ...settings, subCardNegativeBorder: v })} 
        />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Shadow / 3D Depth</Label>
            <span className="text-xs text-muted-foreground">{settings.subCardShadow ?? 0}%</span>
          </div>
          <Slider
            value={[settings.subCardShadow ?? 0]}
            onValueChange={(v) => onChange({ ...settings, subCardShadow: v[0] })}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Shadow Direction</Label>
          <Select 
            value={String(settings.subCardShadowDirection ?? 180)}
            onValueChange={(v) => onChange({ ...settings, subCardShadowDirection: Number(v) as ShadowDirection })}
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHADOW_DIRECTIONS.map(dir => (
                <SelectItem key={dir.value} value={String(dir.value)} className="text-xs">
                  {dir.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Text Colors */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Text Colors</h4>
        <ColorPicker 
          label="Title" 
          value={settings.titleColor} 
          onChange={(v) => onChange({ ...settings, titleColor: v })} 
        />
        <ColorPicker 
          label="Description" 
          value={settings.descriptionColor} 
          onChange={(v) => onChange({ ...settings, descriptionColor: v })} 
        />
        <ColorPicker 
          label="Sub Card Title" 
          value={settings.subCardTitleColor} 
          onChange={(v) => onChange({ ...settings, subCardTitleColor: v })} 
        />
        <ColorPicker 
          label="Sub Card Text" 
          value={settings.subCardTextColor} 
          onChange={(v) => onChange({ ...settings, subCardTextColor: v })} 
        />
      </div>

      <Separator />

      {/* Accents & Badge */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Accents & Badge</h4>
        <ColorPicker 
          label="Primary Accent" 
          value={settings.accentColor} 
          onChange={(v) => onChange({ ...settings, accentColor: v })} 
        />
        <ColorPicker 
          label="Positive Accent" 
          value={settings.positiveAccent} 
          onChange={(v) => onChange({ ...settings, positiveAccent: v })} 
        />
        <ColorPicker 
          label="Negative Accent" 
          value={settings.negativeAccent} 
          onChange={(v) => onChange({ ...settings, negativeAccent: v })} 
        />
        <ColorPicker 
          label="Badge Background" 
          value={settings.badgeBackground} 
          onChange={(v) => onChange({ ...settings, badgeBackground: v })} 
        />
        <ColorPicker 
          label="Badge Text" 
          value={settings.badgeTextColor} 
          onChange={(v) => onChange({ ...settings, badgeTextColor: v })} 
        />
      </div>

      {/* Reset button */}
      <Button 
        variant="outline" 
        className="w-full gap-2"
        onClick={() => {
          onChange(defaultSettings);
          toast.success("Reset to defaults");
        }}
      >
        <RotateCcw className="h-4 w-4" />
        Reset to Defaults
      </Button>
    </div>
  );
};

// Logo manager component
const LogoManager = () => {
  const [logos, setLogos] = useState(getToolLogos());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);

  const allTools = [
    ...toolsData.map(t => ({ id: t.id, name: t.name, type: 'core' })),
    ...directoryTools
      .filter(t => !toolsData.some(ct => ct.id === t.id))
      .map(t => ({ id: t.id, name: t.name, type: 'directory' })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedToolId) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 500 * 1024) {
      toast.error("Image must be under 500KB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      saveToolLogo(selectedToolId, dataUrl);
      setLogos(getToolLogos());
      setSelectedToolId(null);
      toast.success("Logo uploaded successfully");
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (toolId: string) => {
    deleteToolLogo(toolId);
    setLogos(getToolLogos());
    toast.success("Logo removed");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={selectedToolId || ""} onValueChange={setSelectedToolId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a tool to add logo..." />
          </SelectTrigger>
          <SelectContent>
            {allTools.map(tool => (
              <SelectItem key={tool.id} value={tool.id}>
                {tool.name} 
                <span className="text-muted-foreground ml-1 text-xs">
                  ({tool.type})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button 
          variant="outline" 
          size="icon"
          disabled={!selectedToolId}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Upload logos under 500KB. Recommended size: 64x64px or 128x128px.
      </p>

      <Separator />

      {logos.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No logos uploaded yet. Select a tool above to add its logo.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {logos.map(logo => {
            const tool = allTools.find(t => t.id === logo.toolId);
            return (
              <div 
                key={logo.toolId}
                className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card"
              >
                <img 
                  src={logo.logoUrl} 
                  alt={tool?.name || 'Tool logo'} 
                  className="w-8 h-8 rounded object-contain"
                />
                <span className="flex-1 text-sm truncate">
                  {tool?.name || logo.toolId}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(logo.toolId)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ToolCardCustomization = () => {
  const [coreSettings, setCoreSettings] = useState<ToolCardSettings>(getCoreToolsCardSettings());
  const [directorySettings, setDirectorySettings] = useState<ToolCardSettings>(getDirectoryCardSettings());
  const [hasChanges, setHasChanges] = useState(false);
  const [savePresetOpen, setSavePresetOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [activeTab, setActiveTab] = useState<"core" | "directory">("core");

  useEffect(() => {
    setHasChanges(true);
  }, [coreSettings, directorySettings]);

  const handleSave = () => {
    saveCoreToolsCardSettings(coreSettings);
    saveDirectoryCardSettings(directorySettings);
    setHasChanges(false);
    toast.success("Settings saved successfully");
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }
    const settings = activeTab === "core" ? coreSettings : directorySettings;
    saveCustomToolPreset(presetName.trim(), settings);
    setSavePresetOpen(false);
    setPresetName("");
    toast.success(`Preset "${presetName}" saved`);
  };

  return (
    <AppLayout>
      <GovernanceHeader 
        title="Tool Card Customization" 
        description="Customize the appearance of tool cards on Core Tools and Browse All Tools pages."
        showBackButton
      />

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={handleSave} className="gap-2" disabled={!hasChanges}>
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
        
        <Dialog open={savePresetOpen} onOpenChange={setSavePresetOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Palette className="h-4 w-4" />
              Save as Preset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Preset</DialogTitle>
              <DialogDescription>
                Save current {activeTab === "core" ? "Core Tools" : "Directory"} settings as a reusable preset.
              </DialogDescription>
            </DialogHeader>
            <Input
              placeholder="Preset name..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setSavePresetOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePreset}>Save Preset</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "core" | "directory")} className="mt-6">
        <TabsList>
          <TabsTrigger value="core">Core Tools Page</TabsTrigger>
          <TabsTrigger value="directory">Tools Directory</TabsTrigger>
          <TabsTrigger value="logos">Tool Logos</TabsTrigger>
        </TabsList>

        <TabsContent value="core" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Card Settings</CardTitle>
                <CardDescription>
                  Customize colors for Core Tools page cards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <SettingsEditor 
                    settings={coreSettings}
                    onChange={setCoreSettings}
                    defaultSettings={DEFAULT_CORE_TOOLS_SETTINGS}
                  />
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
                <CardDescription>
                  Live preview of your Core Tools card
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <CoreToolPreview settings={coreSettings} />
                <CoreToolPreview settings={coreSettings} logo="https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="directory" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Card Settings</CardTitle>
                <CardDescription>
                  Customize colors for Tools Directory page cards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <SettingsEditor 
                    settings={directorySettings}
                    onChange={setDirectorySettings}
                    defaultSettings={DEFAULT_DIRECTORY_SETTINGS}
                  />
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
                <CardDescription>
                  Live preview of your Directory card
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <DirectoryPreview settings={directorySettings} />
                <DirectoryPreview settings={directorySettings} logo="https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" />
                <DirectoryPreview settings={directorySettings} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="h-4 w-4" />
                Tool Logos
              </CardTitle>
              <CardDescription>
                Upload logos for individual tools. Logos will appear on both Core Tools and Directory cards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LogoManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default ToolCardCustomization;
