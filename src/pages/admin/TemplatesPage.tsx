import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Save, X, Trash2, Settings, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import type { Template } from "@/types";

interface ExtendedTemplate extends Template {
  isActive?: boolean;
  sortOrder?: number;
  layout?: string;
}

const defaultThemeKeys = [
  { key: "accentColor", label: "Accent Color", type: "color", default: "#2563eb" },
  { key: "headingColor", label: "Heading Color", type: "color", default: "#111827" },
  { key: "textColor", label: "Text Color", type: "color", default: "#111827" },
  { key: "backgroundColor", label: "Background Color", type: "color", default: "#ffffff" },
  { key: "fontFamily", label: "Font Family", type: "text", default: "Inter, ui-sans-serif, system-ui" },
  { key: "nameFontSize", label: "Name Font Size (px)", type: "number", default: "24" },
  { key: "headingFontSize", label: "Heading Font Size (px)", type: "number", default: "14" },
  { key: "bodyFontSize", label: "Body Font Size (px)", type: "number", default: "11" },
  { key: "sectionSpacing", label: "Section Spacing", type: "select", options: ["small", "medium", "large"], default: "medium" },
  { key: "gradientStart", label: "Gradient Start Color", type: "color", default: "" },
  { key: "gradientEnd", label: "Gradient End Color", type: "color", default: "" },
  { key: "gradientDirection", label: "Gradient Direction", type: "select", options: ["to-right", "to-left", "to-bottom", "to-top", "diagonal"], default: "to-right" },
];

const layoutOptions = [
  { value: "single-column", label: "Single Column" },
  { value: "two-column", label: "Two Column" },
  { value: "sidebar-left", label: "Sidebar Left" },
  { value: "sidebar-right", label: "Sidebar Right" },
];

const categoryOptions = [
  { value: "ats", label: "ATS" },
  { value: "modern", label: "Modern" },
  { value: "bangladeshi", label: "Bangladeshi" },
  { value: "creative", label: "Creative" },
];

export default function AdminTemplatesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState<ExtendedTemplate | null>(null);
  const [editForm, setEditForm] = useState<Partial<ExtendedTemplate>>({});
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["admin-templates"],
    queryFn: async () => {
      const { data } = await api.get("/admin/templates");
      return data.data as ExtendedTemplate[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newTemplate: Partial<ExtendedTemplate>) => {
      const { data } = await api.post("/admin/templates", newTemplate);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
      toast.add("Template created successfully!", "success");
      setEditingTemplate(null);
      setEditForm({});
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.add(msg || "Failed to create template", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ExtendedTemplate> }) => {
      const { data } = await api.patch(`/admin/templates/${id}`, updates);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
      toast.add("Template updated successfully!", "success");
      setEditingTemplate(null);
      setEditForm({});
      setShowThemeEditor(false);
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.add(msg || "Failed to update template", "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/templates/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
      toast.add("Template deleted successfully!", "success");
      setDeleteConfirmId(null);
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.add(msg || "Failed to delete template", "error");
    },
  });

  const handleSave = () => {
    if (!editForm.name?.trim()) {
      toast.add("Template name is required", "error");
      return;
    }
    if (!editForm.slug?.trim()) {
      toast.add("Template slug is required", "error");
      return;
    }

    if (editingTemplate?._id) {
      updateMutation.mutate({ id: editingTemplate._id, updates: editForm });
    } else {
      createMutation.mutate(editForm);
    }
  };

  const handleCancel = () => {
    setEditingTemplate(null);
    setEditForm({});
    setShowThemeEditor(false);
  };

  const handleEdit = (template: ExtendedTemplate) => {
    setEditingTemplate(template);
    setEditForm(template);
    setShowThemeEditor(false);
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setEditForm({
      name: "",
      slug: "",
      description: "",
      category: "ats",
      thumbnail: "",
      isPremium: false,
      isActive: true,
      sortOrder: templates?.length || 0,
      layout: "single-column",
      defaultTheme: {},
    });
    setShowThemeEditor(false);
  };

  const handleOpenThemeEditor = (template: ExtendedTemplate) => {
    setEditingTemplate(template);
    setEditForm({
      ...template,
      defaultTheme: template.defaultTheme || {},
    });
    setShowThemeEditor(true);
  };

  const handleSaveTheme = () => {
    if (editingTemplate?._id) {
      updateMutation.mutate({
        id: editingTemplate._id,
        updates: { defaultTheme: editForm.defaultTheme },
      });
    }
  };

  const handleCopyTheme = () => {
    if (editForm.defaultTheme) {
      navigator.clipboard.writeText(JSON.stringify(editForm.defaultTheme, null, 2));
      toast.add("Theme copied to clipboard!", "success");
    }
  };

  const handlePasteTheme = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = JSON.parse(text);
      setEditForm({ ...editForm, defaultTheme: parsed });
      toast.add("Theme pasted successfully!", "success");
    } catch {
      toast.add("Invalid theme JSON in clipboard", "error");
    }
  };

  const updateDefaultTheme = (key: string, value: string) => {
    setEditForm({
      ...editForm,
      defaultTheme: { ...editForm.defaultTheme, [key]: value },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Template Management</h1>
          <p className="text-muted">Manage resume templates available to users</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Template Management</h1>
          <p className="text-muted">Manage resume templates available to users</p>
        </div>
        <Button variant="gradient" onClick={handleNewTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>

      {/* Edit/Create Form */}
      {(editingTemplate || editForm.name) && !showThemeEditor && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>{editingTemplate?._id ? "Edit Template" : "New Template"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Template Name *</label>
                <Input
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g., Modern Professional"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Slug *</label>
                <Input
                  value={editForm.slug || ""}
                  onChange={(e) => setEditForm({ ...editForm, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  placeholder="e.g., modern-professional"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={editForm.category || "ats"}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Layout</label>
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={editForm.layout || "single-column"}
                  onChange={(e) => setEditForm({ ...editForm, layout: e.target.value })}
                >
                  {layoutOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={editForm.description || ""}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Short description of the template"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Thumbnail URL</label>
                <Input
                  value={editForm.thumbnail || ""}
                  onChange={(e) => setEditForm({ ...editForm, thumbnail: e.target.value })}
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.isPremium || false}
                  onChange={(e) => setEditForm({ ...editForm, isPremium: e.target.checked })}
                  className="rounded border-border"
                />
                <span className="text-sm font-medium">Premium Template</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.isActive !== false}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="rounded border-border"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>

            <div className="flex gap-2">
              <Button variant="gradient" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => editingTemplate?._id && setShowThemeEditor(true)}
                disabled={!editingTemplate?._id}
              >
                <Settings className="h-4 w-4 mr-2" />
                Theme Settings
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Theme Editor */}
      {showThemeEditor && editingTemplate && (
        <Card className="border-primary">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Theme Settings - {editingTemplate.name}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyTheme}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handlePasteTheme}>
                <PasteIcon className="h-4 w-4 mr-2" />
                Paste
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {defaultThemeKeys.map((field) => (
                <div key={field.key}>
                  <label className="text-sm font-medium">{field.label}</label>
                  {field.type === "color" ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={editForm.defaultTheme?.[field.key] || field.default}
                        onChange={(e) => updateDefaultTheme(field.key, e.target.value)}
                        className="h-10 w-12 rounded border border-border"
                      />
                      <Input
                        value={editForm.defaultTheme?.[field.key] || field.default}
                        onChange={(e) => updateDefaultTheme(field.key, e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  ) : field.type === "select" ? (
                    <select
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      value={editForm.defaultTheme?.[field.key] || field.default}
                      onChange={(e) => updateDefaultTheme(field.key, e.target.value)}
                    >
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === "number" ? (
                    <Input
                      type="number"
                      value={editForm.defaultTheme?.[field.key] || field.default}
                      onChange={(e) => updateDefaultTheme(field.key, e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <Input
                      value={editForm.defaultTheme?.[field.key] || field.default}
                      onChange={(e) => updateDefaultTheme(field.key, e.target.value)}
                      className="mt-1"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="gradient" onClick={handleSaveTheme} disabled={updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Save Theme
              </Button>
              <Button variant="outline" onClick={() => setShowThemeEditor(false)}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates?.map((template) => (
          <Card key={template._id} className={deleteConfirmId === template._id ? "border-red-500" : ""}>
            <CardContent className="pt-6">
              {template.thumbnail ? (
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
              ) : (
                <div className="w-full h-32 bg-secondary rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-muted-foreground">No preview</span>
                </div>
              )}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{template.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                  {template.category && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {template.category}
                    </Badge>
                  )}
                </div>
                {template.isPremium && (
                  <Badge variant="premium" className="text-xs">Premium</Badge>
                )}
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-1">
                  <Badge variant={template.isActive ? "outline" : "secondary"} className="text-xs">
                    {template.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {template.layout && (
                    <Badge variant="outline" className="text-xs">
                      {template.layout}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenThemeEditor(template)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Theme
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(template)}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                {deleteConfirmId === template._id ? (
                  <>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(template._id)}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteConfirmId(null)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteConfirmId(template._id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!templates || templates.length === 0) && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No templates found. Create your first template!</p>
        </div>
      )}
    </div>
  );
}

function PasteIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}