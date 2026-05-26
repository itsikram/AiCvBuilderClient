import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import api from "@/lib/api";
import { Plus, Edit3, Trash2, Save, X, DollarSign, Check, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface SubscriptionPlan {
  _id: string;
  name: string;
  slug: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  features: string[];
  limits: {
    maxResumes: number;
    maxAiRequests: number;
    watermarkPdf: boolean;
    premiumTemplates: boolean;
    atsChecker: boolean;
    coverLetters: boolean;
    aiOptimization: boolean;
  };
  isActive: boolean;
  sortOrder: number;
}

interface PlanFormData {
  name: string;
  slug: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  features: string[];
  limits: {
    maxResumes: number;
    maxAiRequests: number;
    watermarkPdf: boolean;
    premiumTemplates: boolean;
    atsChecker: boolean;
    coverLetters: boolean;
    aiOptimization: boolean;
  };
  isActive: boolean;
  sortOrder: number;
}

const defaultLimits = {
  maxResumes: 2,
  maxAiRequests: 5,
  watermarkPdf: true,
  premiumTemplates: false,
  atsChecker: false,
  coverLetters: false,
  aiOptimization: false,
};

const defaultPlan: PlanFormData = {
  name: "",
  slug: "",
  description: "",
  priceMonthly: 0,
  priceYearly: 0,
  currency: "BDT",
  features: [],
  limits: { ...defaultLimits },
  isActive: true,
  sortOrder: 0,
};

export default function PlansPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<PlanFormData>(defaultPlan);
  const [newFeature, setNewFeature] = useState("");

  const { data: plans, isLoading } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data } = await api.get("/admin/plans");
      return data.data as SubscriptionPlan[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: PlanFormData) => {
      const { data } = await api.post("/admin/plans", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.add("Plan created successfully!", "success");
      setIsCreating(false);
      setFormData(defaultPlan);
    },
    onError: (error: unknown) => {
      toast.add(error instanceof Error ? error.message : "Failed to create plan", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: PlanFormData }) => {
      const { data } = await api.patch(`/admin/plans/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.add("Plan updated successfully!", "success");
      setEditingPlan(null);
      setFormData(defaultPlan);
    },
    onError: (error: unknown) => {
      toast.add(error instanceof Error ? error.message : "Failed to update plan", "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/admin/plans/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.add("Plan deleted successfully!", "success");
    },
    onError: () => {
      toast.add("Failed to delete plan", "error");
    },
  });

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      currency: plan.currency,
      features: [...plan.features],
      limits: { ...plan.limits },
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
    });
    setIsCreating(false);
  };

  const handleCreate = () => {
    setEditingPlan(null);
    setFormData(defaultPlan);
    setIsCreating(true);
  };

  const handleCancel = () => {
    setEditingPlan(null);
    setIsCreating(false);
    setFormData(defaultPlan);
    setNewFeature("");
  };

  const handleSave = () => {
    if (!formData.name || !formData.slug) {
      toast.add("Plan name and slug are required", "error");
      return;
    }

    if (isCreating) {
      createMutation.mutate(formData);
    } else if (editingPlan) {
      updateMutation.mutate({ id: editingPlan._id, payload: formData });
    }
  };

  const handleFieldChange = (field: keyof PlanFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLimitChange = <K extends keyof typeof defaultLimits>(field: K, value: (typeof defaultLimits)[K]) => {
    setFormData((prev) => ({
      ...prev,
      limits: { ...prev.limits, [field]: value },
    }));
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") {
      action();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscription Plans</h1>
          <p className="text-muted">Manage pricing packages for your platform</p>
        </div>
        {!isCreating && !editingPlan && (
          <Button variant="gradient" onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Plan
          </Button>
        )}
      </div>

      {/* Form for creating/editing plans */}
      {(isCreating || editingPlan) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{isCreating ? "Create New Plan" : `Edit Plan: ${editingPlan?.name}`}</CardTitle>
              <CardDescription>
                {isCreating
                  ? "Add a new subscription plan"
                  : "Update the subscription plan details"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} className="gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                variant="gradient"
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : "Save Changes"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    placeholder="e.g., Premium"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Plan Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleFieldChange("slug", e.target.value)}
                    placeholder="e.g., premium"
                    disabled={!!editingPlan}
                  />
                  <p className="text-xs text-muted">Unique identifier (cannot be changed after creation)</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                    placeholder="Brief description of the plan"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priceMonthly">Monthly Price (৳)</Label>
                  <Input
                    id="priceMonthly"
                    type="number"
                    min="0"
                    value={formData.priceMonthly}
                    onChange={(e) => handleFieldChange("priceMonthly", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priceYearly">Yearly Price (৳)</Label>
                  <Input
                    id="priceYearly"
                    type="number"
                    min="0"
                    value={formData.priceYearly}
                    onChange={(e) => handleFieldChange("priceYearly", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Display Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={(e) => handleFieldChange("sortOrder", Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Limits */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Plan Limits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxResumes">Max Resumes</Label>
                    <Input
                      id="maxResumes"
                      type="number"
                      value={formData.limits.maxResumes}
                      onChange={(e) => handleLimitChange("maxResumes", Number(e.target.value))}
                    />
                    <p className="text-xs text-muted">Use -1 for unlimited</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxAiRequests">Max AI Requests/Month</Label>
                    <Input
                      id="maxAiRequests"
                      type="number"
                      value={formData.limits.maxAiRequests}
                      onChange={(e) => handleLimitChange("maxAiRequests", Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Boolean Limits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label className="font-medium">Watermark PDF</Label>
                      <p className="text-xs text-muted">Add watermark to exported PDFs</p>
                    </div>
                    <Switch
                      checked={formData.limits.watermarkPdf}
                      onCheckedChange={(checked: boolean) => handleLimitChange("watermarkPdf", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label className="font-medium">Premium Templates</Label>
                      <p className="text-xs text-muted">Access to premium templates</p>
                    </div>
                    <Switch
                      checked={formData.limits.premiumTemplates}
                      onCheckedChange={(checked: boolean) => handleLimitChange("premiumTemplates", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label className="font-medium">ATS Checker</Label>
                      <p className="text-xs text-muted">Applicant Tracking System checker</p>
                    </div>
                    <Switch
                      checked={formData.limits.atsChecker}
                      onCheckedChange={(checked: boolean) => handleLimitChange("atsChecker", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label className="font-medium">Cover Letters</Label>
                      <p className="text-xs text-muted">AI-generated cover letters</p>
                    </div>
                    <Switch
                      checked={formData.limits.coverLetters}
                      onCheckedChange={(checked: boolean) => handleLimitChange("coverLetters", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label className="font-medium">AI Optimization</Label>
                      <p className="text-xs text-muted">AI-powered resume optimization</p>
                    </div>
                    <Switch
                      checked={formData.limits.aiOptimization}
                      onCheckedChange={(checked: boolean) => handleLimitChange("aiOptimization", checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Features List
                </h3>
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleAddFeature)}
                    placeholder="Enter a feature (e.g., Unlimited resumes)"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={handleAddFeature}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((feature, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1 px-3 py-1"
                    >
                      {feature}
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  {formData.isActive ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <div>
                    <Label className="font-medium">Plan Status</Label>
                    <p className="text-xs text-muted">
                      {formData.isActive
                        ? "This plan is visible to users"
                        : "This plan is hidden from users"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked: boolean) => handleFieldChange("isActive", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans List */}
      <div className="grid gap-6 md:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <SkeletonCard />
              </CardContent>
            </Card>
          ))
        ) : plans && plans.length > 0 ? (
          plans.map((plan) => (
            <Card key={plan._id} className={!plan.isActive ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {plan.name}
                      {!plan.isActive && (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(plan)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete the "${plan.name}" plan?`)) {
                          deleteMutation.mutate(plan._id);
                        }
                      }}
                      disabled={plan.slug === "free"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted">Monthly</p>
                    <p className="text-lg font-bold">
                      ৳{plan.priceMonthly.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted">Yearly</p>
                    <p className="text-lg font-bold">
                      ৳{plan.priceYearly.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Features:</p>
                  <ul className="text-sm text-muted space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Limits:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between p-2 bg-secondary/50 rounded">
                      <span className="text-muted">Resumes:</span>
                      <span className="font-medium">
                        {plan.limits.maxResumes === -1 ? "Unlimited" : plan.limits.maxResumes}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-secondary/50 rounded">
                      <span className="text-muted">AI Requests:</span>
                      <span className="font-medium">{plan.limits.maxAiRequests}/mo</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No subscription plans found.</p>
            <p className="text-sm mt-2">Click "Create Plan" to add your first plan.</p>
          </div>
        )}
      </div>
    </div>
  );
}