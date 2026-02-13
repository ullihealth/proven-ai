import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import {
  Loader2,
  CheckCircle2,
  Save,
  RefreshCw,
  Settings2,
  Eye,
  FileText,
  Image,
  Clock,
} from "lucide-react";

/**
 * Intelligence Settings - Admin control panel for the AI Intelligence briefing layer
 * 
 * Allows configuration of:
 * - Display options (items per category, thumbnails, reading time)
 * - Content options (summary length, excerpt length)
 * - Feature flags (article view, commentary)
 */

interface IntelligenceSettings {
  itemsPerCategory: number;
  showThumbnails: boolean;
  showReadingTime: boolean;
  summaryLength: 'short' | 'medium' | 'long';
  excerptLength: number;
  articleView: 'on' | 'off';
  commentary: 'on' | 'off';
}

const IntelligenceSettingsPage = () => {
  const [settings, setSettings] = useState<IntelligenceSettings>({
    itemsPerCategory: 2,
    showThumbnails: true,
    showReadingTime: true,
    summaryLength: 'medium',
    excerptLength: 400,
    articleView: 'on',
    commentary: 'off',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/briefing/settings");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Save settings
  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    
    try {
      const res = await fetch("/api/admin/briefing/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-16 text-center">
          <Loader2 className="h-5 w-5 text-[#9CA3AF] animate-spin mx-auto" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Intelligence Settings"
        description="Configure display and content options for the AI Intelligence briefing layer"
      />

      <div className="max-w-3xl">
        {error && (
          <div className="mb-6 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-[13px] text-red-800">
            {error}
          </div>
        )}

        {saved && (
          <div className="mb-6 px-4 py-3 rounded-md bg-green-50 border border-green-200 text-[13px] text-green-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Settings saved successfully
          </div>
        )}

        {/* ─── Display Settings ─── */}
        <section className="mb-8 bg-white border border-[#E5E7EB] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-4 w-4 text-[#6B7280]" />
            <h2 className="text-[15px] font-semibold text-[#111827]">Display Settings</h2>
          </div>

          <div className="space-y-5">
            {/* Items per category */}
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-2">
                Items per category
              </label>
              <select
                value={settings.itemsPerCategory}
                onChange={(e) => setSettings({ ...settings, itemsPerCategory: parseInt(e.target.value, 10) })}
                className="w-full max-w-xs px-3 py-2 text-[13px] border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              >
                <option value="1">1 item</option>
                <option value="2">2 items</option>
                <option value="3">3 items</option>
                <option value="4">4 items</option>
                <option value="5">5 items</option>
              </select>
              <p className="mt-1 text-[12px] text-[#6B7280]">
                Maximum number of items shown per category in the right column
              </p>
            </div>

            {/* Show thumbnails */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="showThumbnails"
                checked={settings.showThumbnails}
                onChange={(e) => setSettings({ ...settings, showThumbnails: e.target.checked })}
                className="mt-1 h-4 w-4 text-[#2563EB] border-[#D1D5DB] rounded focus:ring-2 focus:ring-[#2563EB]"
              />
              <div>
                <label htmlFor="showThumbnails" className="block text-[13px] font-medium text-[#374151] cursor-pointer">
                  Show thumbnails
                </label>
                <p className="text-[12px] text-[#6B7280]">
                  Display article images in the intelligence feed
                </p>
              </div>
            </div>

            {/* Show reading time */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="showReadingTime"
                checked={settings.showReadingTime}
                onChange={(e) => setSettings({ ...settings, showReadingTime: e.target.checked })}
                className="mt-1 h-4 w-4 text-[#2563EB] border-[#D1D5DB] rounded focus:ring-2 focus:ring-[#2563EB]"
              />
              <div>
                <label htmlFor="showReadingTime" className="block text-[13px] font-medium text-[#374151] cursor-pointer">
                  Show reading time
                </label>
                <p className="text-[12px] text-[#6B7280]">
                  Display estimated reading time for articles
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Content Settings ─── */}
        <section className="mb-8 bg-white border border-[#E5E7EB] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-4 w-4 text-[#6B7280]" />
            <h2 className="text-[15px] font-semibold text-[#111827]">Content Settings</h2>
          </div>

          <div className="space-y-5">
            {/* Summary length */}
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-2">
                Summary length
              </label>
              <select
                value={settings.summaryLength}
                onChange={(e) => setSettings({ ...settings, summaryLength: e.target.value as 'short' | 'medium' | 'long' })}
                className="w-full max-w-xs px-3 py-2 text-[13px] border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              >
                <option value="short">Short (1-2 sentences)</option>
                <option value="medium">Medium (2-3 sentences)</option>
                <option value="long">Long (3-4 sentences)</option>
              </select>
              <p className="mt-1 text-[12px] text-[#6B7280]">
                Default length for auto-generated summaries
              </p>
            </div>

            {/* Excerpt length */}
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-2">
                Excerpt length
              </label>
              <input
                type="number"
                min="300"
                max="900"
                step="50"
                value={settings.excerptLength}
                onChange={(e) => setSettings({ ...settings, excerptLength: parseInt(e.target.value, 10) })}
                className="w-full max-w-xs px-3 py-2 text-[13px] border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              />
              <p className="mt-1 text-[12px] text-[#6B7280]">
                Character count for article excerpts (300-900 recommended)
              </p>
            </div>
          </div>
        </section>

        {/* ─── Feature Flags ─── */}
        <section className="mb-8 bg-white border border-[#E5E7EB] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="h-4 w-4 text-[#6B7280]" />
            <h2 className="text-[15px] font-semibold text-[#111827]">Features</h2>
          </div>

          <div className="space-y-5">
            {/* Article view */}
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-2">
                In-app article view
              </label>
              <select
                value={settings.articleView}
                onChange={(e) => setSettings({ ...settings, articleView: e.target.value as 'on' | 'off' })}
                className="w-full max-w-xs px-3 py-2 text-[13px] border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              >
                <option value="on">On - Open articles in Proven AI</option>
                <option value="off">Off - Open articles externally</option>
              </select>
              <p className="mt-1 text-[12px] text-[#6B7280]">
                When ON, clicking an item opens our briefing page. When OFF, goes directly to source.
              </p>
            </div>

            {/* Commentary */}
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-2">
                Founder commentary
              </label>
              <select
                value={settings.commentary}
                onChange={(e) => setSettings({ ...settings, commentary: e.target.value as 'on' | 'off' })}
                className="w-full max-w-xs px-3 py-2 text-[13px] border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              >
                <option value="on">On - Show commentary</option>
                <option value="off">Off - Hide commentary</option>
              </select>
              <p className="mt-1 text-[12px] text-[#6B7280]">
                Show or hide the "Why this matters" founder commentary in feeds
              </p>
            </div>
          </div>
        </section>

        {/* ─── Save button ─── */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-[#2563EB] text-white text-[13px] font-medium rounded-md hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </button>

          {saved && (
            <span className="text-[13px] text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </span>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default IntelligenceSettingsPage;
