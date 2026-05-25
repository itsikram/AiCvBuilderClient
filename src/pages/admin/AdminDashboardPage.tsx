import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, FileText, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useMemo, useState } from "react";

interface BlogFormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string;
  language: "en" | "bn";
  isPublished: boolean;
}

const initialBlogForm: BlogFormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  tags: "",
  language: "en",
  isPublished: true,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/admin/dashboard");
      return data.data;
    },
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await api.get("/admin/users");
      return data.data;
    },
  });

  const { data: blogsData, isLoading: blogsLoading } = useQuery({
    queryKey: ["admin-blogs"],
    queryFn: async () => {
      const { data } = await api.get("/admin/blogs");
      return data.data as Array<{
        _id: string;
        title: string;
        slug: string;
        excerpt: string;
        content?: string;
        publishedAt?: string;
        isPublished?: boolean;
        coverImage?: string;
        language?: "en" | "bn";
        tags?: string[];
      }>;
    },
  });

  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [blogForm, setBlogForm] = useState<BlogFormState>(initialBlogForm);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

  const isFormValid = useMemo(() => {
    return Boolean(blogForm.title && blogForm.excerpt && blogForm.content);
  }, [blogForm]);

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, plan, expiresAt }: { userId: string; plan: string; expiresAt?: string }) => {
      const { data } = await api.patch(`/admin/users/${userId}/subscription`, { plan, expiresAt });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setEditingUser(null);
      setSelectedPlan("");
      setExpiresAt("");
    },
  });

  const resetBlogForm = () => {
    setBlogForm(initialBlogForm);
    setCoverImageFile(null);
    setEditingBlogId(null);
  };

  const startEditBlog = (blog: NonNullable<typeof blogsData>[number]) => {
    setEditingBlogId(blog._id);
    setBlogForm({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content || "",
      coverImage: blog.coverImage || "",
      tags: Array.isArray(blog.tags) ? blog.tags.join(", ") : "",
      language: blog.language || "en",
      isPublished: Boolean(blog.isPublished),
    });
    setCoverImageFile(null);
  };

  const buildBlogPayload = () => ({
    title: blogForm.title,
    slug: blogForm.slug || slugify(blogForm.title),
    excerpt: blogForm.excerpt,
    content: blogForm.content,
    coverImage: blogForm.coverImage || undefined,
    tags: blogForm.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    language: blogForm.language,
    isPublished: blogForm.isPublished,
  });

  const buildBlogFormData = () => {
    const formData = new FormData();
    const payload = buildBlogPayload();
    const existingBlog = editingBlogId
      ? blogsData?.find((blog) => blog._id === editingBlogId)
      : undefined;

    formData.append("title", payload.title);
    formData.append("slug", payload.slug);
    formData.append("excerpt", payload.excerpt);
    formData.append("content", payload.content);
    formData.append("tags", payload.tags.join(","));
    formData.append("language", payload.language);
    formData.append("isPublished", String(payload.isPublished));

    if (payload.coverImage) {
      formData.append("coverImage", payload.coverImage);
    }

    if (coverImageFile) {
      formData.append("coverImage", coverImageFile);
    }

    if (payload.isPublished && !existingBlog?.publishedAt) {
      formData.append("publishedAt", new Date().toISOString());
    }

    return formData;
  };

  const createBlogMutation = useMutation({
    mutationFn: async () => {
      const formData = buildBlogFormData();
      const { data } = await api.post("/admin/blogs", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    },
    onSuccess: () => {
      toast.add("Blog uploaded successfully", "success");
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      resetBlogForm();
    },
    onError: () => {
      toast.add("Failed to upload blog", "error");
    },
  });

  const updateBlogMutation = useMutation({
    mutationFn: async () => {
      const formData = buildBlogFormData();
      const { data } = await api.patch(`/admin/blogs/${editingBlogId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    },
    onSuccess: () => {
      toast.add("Blog updated successfully", "success");
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      resetBlogForm();
    },
    onError: () => {
      toast.add("Failed to update blog", "error");
    },
  });

  const stats = [
    { label: "Total Users", value: data?.totalUsers ?? 0, icon: Users },
    { label: "Total Resumes", value: data?.totalResumes ?? 0, icon: FileText },
    { label: "Revenue (BDT)", value: formatCurrency(data?.totalRevenue ?? 0), icon: DollarSign },
    { label: "AI Requests", value: data?.stats?.totals?.totalAiRequests ?? 0, icon: TrendingUp },
  ];

  const handleSaveBlog = () => {
    if (!isFormValid) {
      toast.add("Please fill in the required blog fields", "error");
      return;
    }

    if (editingBlogId) {
      updateBlogMutation.mutate();
      return;
    }

    createBlogMutation.mutate();
  };

  return (
    <div className="space-y-8">
      <div id="overview">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              {isLoading ? (
                <Skeleton className="h-16" />
              ) : (
                <>
                  <stat.icon className="h-8 w-8 text-primary mb-2" />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted">{stat.label}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card id="content">
        <CardHeader>
          <CardTitle>{editingBlogId ? "Edit Blog" : "Upload Blog"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={blogForm.title}
                onChange={(e) => setBlogForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Blog title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug</label>
              <Input
                value={blogForm.slug}
                onChange={(e) => setBlogForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="Optional custom slug"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cover Image URL</label>
              <Input
                value={blogForm.coverImage}
                onChange={(e) => setBlogForm((prev) => ({ ...prev, coverImage: e.target.value }))}
                placeholder="https://example.com/cover.jpg"
              />
              <p className="text-xs text-muted">Optional. You can also upload a file to push it to Cloudinary.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={blogForm.language}
                onChange={(e) =>
                  setBlogForm((prev) => ({ ...prev, language: e.target.value as "en" | "bn" }))
                }
              >
                <option value="en">English</option>
                <option value="bn">Bangla</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Upload Cover Image</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverImageFile(e.target.files?.[0] || null)}
            />
            {coverImageFile ? (
              <p className="text-xs text-muted">Selected: {coverImageFile.name}</p>
            ) : (
              <p className="text-xs text-muted">If you choose a file, it will be uploaded to Cloudinary automatically.</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Excerpt</label>
            <textarea
              className="flex min-h-[96px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={blogForm.excerpt}
              onChange={(e) => setBlogForm((prev) => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Short summary shown on the blog list"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <textarea
              className="flex min-h-[240px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={blogForm.content}
              onChange={(e) => setBlogForm((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Paste HTML or plain text content"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <Input
                value={blogForm.tags}
                onChange={(e) => setBlogForm((prev) => ({ ...prev, tags: e.target.value }))}
                placeholder="resume tips, ats, career"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={blogForm.isPublished}
                onChange={(e) => setBlogForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
              />
              Publish immediately
            </label>
          </div>

          <div className="flex justify-end gap-3">
            {editingBlogId && (
              <Button variant="outline" onClick={resetBlogForm}>
                Cancel Edit
              </Button>
            )}
            <Button
              variant="gradient"
              onClick={handleSaveBlog}
              disabled={!isFormValid || createBlogMutation.isPending || updateBlogMutation.isPending}
            >
              {createBlogMutation.isPending || updateBlogMutation.isPending
                ? editingBlogId
                  ? "Updating..."
                  : "Uploading..."
                : editingBlogId
                  ? "Update Blog"
                  : "Upload Blog"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card id="blogs">
        <CardHeader>
          <CardTitle>Recent Blogs</CardTitle>
        </CardHeader>
        <CardContent>
          {blogsLoading ? (
            <Skeleton className="h-24" />
          ) : blogsData?.length ? (
            <div className="space-y-3">
              {blogsData.map((blog) => (
                <div key={blog._id} className="border border-border rounded-lg px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{blog.title}</p>
                      <p className="text-sm text-muted">/{blog.slug}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                        {blog.publishedAt ? "Published" : "Draft"}
                      </span>
                      <Button size="sm" variant="outline" onClick={() => startEditBlog(blog)}>
                        Edit
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted mt-2">{blog.excerpt}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No blogs uploaded yet.</p>
          )}
        </CardContent>
      </Card>

      <Card id="users">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Email</th>
                  <th className="text-left py-2">Plan</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Expires</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr><td colSpan={6} className="py-4 text-center">Loading...</td></tr>
                ) : users?.users?.map((u: { _id: string; name: string; email: string; subscription: { plan: string; status: string; expiresAt?: string }; createdAt: string }) => (
                  <tr key={u._id} className="border-b border-border">
                    <td className="py-2">{u.name}</td>
                    <td className="py-2">{u.email}</td>
                    <td className="py-2 capitalize">{u.subscription?.plan}</td>
                    <td className="py-2 capitalize">{u.subscription?.status}</td>
                    <td className="py-2">{u.subscription?.expiresAt ? new Date(u.subscription.expiresAt).toLocaleDateString() : 'N/A'}</td>
                    <td className="py-2">
                      {editingUser === u._id ? (
                        <div className="flex gap-2">
                          <select
                            className="border rounded px-2 py-1 text-sm"
                            value={selectedPlan}
                            onChange={(e) => setSelectedPlan(e.target.value)}
                          >
                            <option value="free">Free</option>
                            <option value="premium">Premium</option>
                          </select>
                          <Input
                            type="date"
                            className="w-32 text-sm"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                          />
                          <Button
                            size="sm"
                            onClick={() => updateSubscriptionMutation.mutate({ userId: u._id, plan: selectedPlan, expiresAt })}
                            disabled={!selectedPlan}
                          >
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingUser(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setEditingUser(u._id)}>
                          Change Plan
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
