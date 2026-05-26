import { useEffect, useState } from "react";
import { X, Save, Palette, Layout, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Template } from "@/types";

interface TemplateSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: Record<string, string>;
  currentTemplate: string;
  templates?: Template[];
  onThemeChange: (theme: Record<string, string>) => void;
  onTemplateChange: (templateId: string) => void;
  onSave: () => Promise<void>;
}

const themeFields = [
  { key: "accentColor", label: "Accent Color", type: "color", default: "#2563eb" },
  { key: "headingColor", label: "Heading Color", type: "color", default: "#111827" },
  { key: "textColor", label: "Text Color", type: "color", default: "#111827" },
  { key: "backgroundColor", label: "Background Color", type: "color", default: "#ffffff" },
  { key: "fontFamily", label: "Font Family", type: "select", options: [
    "Inter, ui-sans-serif, system-ui",
    "Georgia, serif",
    "Arial, sans-serif",
    "Poppins, sans-serif",
    "Times New Roman, serif",
  ], default: "Inter, ui-sans-serif, system-ui" },
  { key: "nameFontSize", label: "Name Font Size (px)", type: "number", default: "24" },
  { key: "headingFontSize", label: "Heading Font Size (px)", type: "number", default: "14" },
  { key: "bodyFontSize", label: "Body Font Size (px)", type: "number", default: "11" },
  { key: "sectionSpacing", label: "Section Spacing", type: "select", options: ["small", "medium", "large"], default: "medium" },
  { key: "gradientStart", label: "Gradient Start Color", type: "color", default: "" },
  { key: "gradientEnd", label: "Gradient End Color", type: "color", default: "" },
  { key: "gradientDirection", label: "Gradient Direction", type: "select", options: [
    "to-right", "to-left", "to-bottom", "to-top", "diagonal"
  ], default: "to-right" },
];

export default function TemplateSettingsModal({
  isOpen,
  onClose,
  currentTheme,
  currentTemplate,
  templates,
  onThemeChange,
  onTemplateChange,
  onSave,
}: TemplateSettingsModalProps) {
  const [theme, setTheme] = useState<Record<string, string>>({});
  const [selectedTemplate, setSelectedTemplate] = useState(currentTemplate);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTheme(currentTheme);
      setSelectedTemplate(currentTemplate);
    }
  }, [isOpen, currentTheme, currentTemplate]);

  const handleThemeChange = (key: string, value: string) => {
    const newTheme = { ...theme, [key]: value };
    setTheme(newTheme);
    onThemeChange(newTheme);
  };

  const handleTemplateSelect = (templateSlug: string) => {
    setSelectedTemplate(templateSlug);
    onTemplateChange(templateSlug);
    
    // Apply the template's default theme if available
    const template = templates?.find(t => t.slug === templateSlug);
    if (template?.defaultTheme) {
      const newTheme = { ...template.defaultTheme };
      setTheme(newTheme);
      onThemeChange(newTheme);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave();
    setIsSaving(false);
    onClose();
  };

  const handleCopyTheme = () => {
    navigator.clipboard.writeText(JSON.stringify(theme, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePasteTheme = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = JSON.parse(text);
      setTheme(parsed);
      onThemeChange(parsed);
    } catch {
      // Invalid JSON
    }
  };

  const handleResetToTemplate = () => {
    const template = templates?.find(t => t.slug === selectedTemplate);
    if (template?.defaultTheme) {
      const newTheme = { ...template.defaultTheme };
      setTheme(newTheme);
      onThemeChange(newTheme);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Template Settings</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              <h3 className="font-semibold">Select Template</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates?.map((template) => (
                <div
                  key={template._id}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    selectedTemplate === template.slug
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "hover:border-primary/50"
                  } ${template.locked ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => !template.locked && handleTemplateSelect(template.slug)}
                >
                  <div className="h-20 bg-gradient-to-br from-blue-100 to-violet-100 rounded mb-2 flex items-center justify-center">
                    <span className="text-xs font-medium text-muted-foreground">{template.name}</span>
                  </div>
                  <p className="text-sm font-medium">{template.name}</p>
                  {template.isPremium && (
                    <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded">Premium</span>
                  )}
                  {selectedTemplate === template.slug && (
                    <Check className="h-4 w-4 text-primary absolute top-2 right-2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Theme Customization */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <h3 className="font-semibold">Theme Customization</h3>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyTheme}>
                  {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" onClick={handlePasteTheme}>
                  Paste
                </Button>
                <Button variant="outline" size="sm" onClick={handleResetToTemplate}>
                  Reset to Template
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {themeFields.map((field) => (
                <div key={field.key}>
                  <label className="text-sm font-medium">{field.label}</label>
                  {field.type === "color" ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={theme[field.key] || field.default}
                        onChange={(e) => handleThemeChange(field.key, e.target.value)}
                        className="h-10 w-12 rounded border border-border"
                      />
                      <Input
                        value={theme[field.key] || field.default}
                        onChange={(e) => handleThemeChange(field.key, e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  ) : field.type === "select" ? (
                    <select
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      value={theme[field.key] || field.default}
                      onChange={(e) => handleThemeChange(field.key, e.target.value)}
                    >
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {field.key === "fontFamily" ? opt.split(",")[0] : opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={field.type}
                      value={theme[field.key] || field.default}
                      onChange={(e) => handleThemeChange(field.key, e.target.value)}
                      className="mt-1"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preview Note */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p>
              Changes to theme settings are applied in real-time to the preview. 
              Click "Save Settings" to persist changes to your resume.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}