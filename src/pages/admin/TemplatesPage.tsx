import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Save, X } from "lucide-react";
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
}

export default function AdminTemplatesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState<ExtendedTemplate | null>(null);
  const [editForm, setEditForm] = useState<Partial<ExtendedTemplate>>({});

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
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.add(msg || "Failed to update template", "error");
    },
  });

  const handleSave = () => {
    if (editingTemplate?._id) {
      updateMutation.mutate({ id: editingTemplate._id, updates: editForm });
    } else {
      createMutation.mutate(editForm);
    }
  };

  const handleCancel = () => {
    setEditingTemplate(null);
    setEditForm({});
  };

  const handleEdit = (template: ExtendedTemplate) => {
    setEditingTemplate(template);
    setEditForm(template);
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setEditForm({
      name: "",
      slug: "",
      description: "",
      category: "",
      thumbnail: "",
      isPremium: false,
      isActive: true,
      sortOrder: templates?.length || 0,
      defaultTheme: {},
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

      {(editingTemplate || editForm.name) && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>{editingTemplate?._id ? "Edit Template" : "New Template"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Template Name</label>
                <Input
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g., Modern Professional"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Slug</label>
                <Input
                  value={editForm.slug || ""}
                  onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                  placeholder="e.g., modern-professional"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={editForm.category || ""}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  placeholder="e.g., Professional"
                />
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
            <div className="flex gap-2">
              <Button variant="gradient" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates?.map((template) => (
          <Card key={template._id}>
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
                  <p className="text-sm text-muted-foreground">{template.description}</p>
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
                <span className="text-xs text-muted-foreground">
                  {template.locked ? "Locked" : "Available"}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(template)}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
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