import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import api from "@/lib/api";
import { usePageContent } from "@/context/PageContentContext";
import { Save, RefreshCw, Globe, Home, FileText, Mail, DollarSign, Plus, Edit3 } from "lucide-react";

interface PageContent {
  _id: string;
  pageId: "home" | "about" | "contact" | "pricing";
  language: "en" | "bn";
  content: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const pageConfig = {
  home: {
    name: "Home Page",
    icon: Home,
    fields: [
      { key: "heroTitle", label: "Hero Title", type: "text" },
      { key: "heroSubtitle", label: "Hero Subtitle", type: "textarea" },
      { key: "heroCTA", label: "Hero CTA Button Text", type: "text" },
      { key: "heroCTASecondary", label: "Hero Secondary CTA", type: "text" },
      { key: "statsSection", label: "Stats Section (JSON)", type: "json" },
      { key: "featuresTitle", label: "Features Section Title", type: "text" },
      { key: "trustSectionTitle", label: "Trust Section Title", type: "text" },
      { key: "trustSectionDescription", label: "Trust Section Description", type: "textarea" },
      { key: "heroBadge", label: "Hero Badge Text", type: "text" },
      // Header/Footer customization fields
      { key: "footerDescription", label: "Footer Description", type: "textarea" },
      { key: "copyrightText", label: "Copyright Text", type: "text" },
      { key: "navLinks", label: "Navigation Links (JSON Array: [{label, href}])", type: "json" },
      { key: "footerLinks", label: "Footer Links (JSON Array: [{label, href}])", type: "json" },
      { key: "socialLinks", label: "Social Media Links (JSON Array: [{platform, url}])", type: "json" },
    ],
  },
  about: {
    name: "About Page",
    icon: FileText,
    fields: [
      { key: "title", label: "Page Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "missionTitle", label: "Mission Title", type: "text" },
      { key: "missionDescription", label: "Mission Description", type: "textarea" },
      { key: "visionTitle", label: "Vision Title", type: "text" },
      { key: "visionDescription", label: "Vision Description", type: "textarea" },
      { key: "teamTitle", label: "Team Section Title", type: "text" },
      { key: "storyContent", label: "Our Story Content", type: "richtext" },
    ],
  },
  contact: {
    name: "Contact Page",
    icon: Mail,
    fields: [
      { key: "title", label: "Page Title", type: "text" },
      { key: "email", label: "Email Address", type: "email" },
      { key: "phone", label: "Phone Number", type: "text" },
      { key: "officeAddress", label: "Office Address", type: "text" },
      { key: "supportHours", label: "Support Hours", type: "text" },
      { key: "contactDescription", label: "Contact Description", type: "textarea" },
    ],
  },
  pricing: {
    name: "Pricing Page",
    icon: DollarSign,
    fields: [
      { key: "title", label: "Page Title", type: "text" },
      { key: "subtitle", label: "Subtitle/Description", type: "textarea" },
      { key: "badge", label: "Badge Text", type: "text" },
      { key: "footer", label: "Footer Text", type: "textarea" },
      { key: "paymentMethods", label: "Payment Methods Text", type: "text" },
    ],
  },
};

// Default values for each page when no content exists
const defaultPageValues = {
  home: {
    heroTitle: "Build Your Perfect Resume with AI",
    heroSubtitle: "Create ATS-optimized resumes in minutes with our AI-powered resume builder. Get hired faster with ChakriCV.",
    heroCTA: "Get Started Free",
    heroCTASecondary: "View Templates",
    heroBadge: "Powered by Gemini 2.5 Flash AI",
    featuresTitle: "Everything you need to get hired",
    trustSectionTitle: "Trusted by job seekers across Bangladesh",
    trustSectionDescription: "Students, freelancers, and professionals use ChakriCV to create ATS-optimized resumes and land jobs at top companies.",
    statsSection: JSON.stringify([
      { value: "10K+", label: "Resumes Created" },
      { value: "95%", label: "ATS Pass Rate" },
      { value: "৳499", label: "Starting Price/mo" },
      { value: "2", label: "Languages" }
    ], null, 2),
    // Header/Footer defaults
    footerDescription: "AI-powered resume builder for Bangladesh. Create professional, ATS-optimized resumes in minutes.",
    copyrightText: `© ${new Date().getFullYear()} ChakriCV. All rights reserved.`,
    navLinks: JSON.stringify([
      { label: "Pricing", href: "/pricing" },
      { label: "Templates", href: "/templates" },
      { label: "Blog", href: "/blog" }
    ], null, 2),
    footerLinks: JSON.stringify([
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Pricing", href: "/pricing" },
      { label: "Templates", href: "/templates" }
    ], null, 2),
    socialLinks: JSON.stringify([
      { platform: "Facebook", url: "https://facebook.com/chakricv" },
      { platform: "LinkedIn", url: "https://linkedin.com/company/chakricv" },
      { platform: "Twitter", url: "https://twitter.com/chakricv" }
    ], null, 2),
  },
  about: {
    title: "About ChakriCV",
    subtitle: "We're on a mission to help job seekers in Bangladesh land their dream jobs.",
    missionTitle: "Our Mission",
    missionDescription: "To empower every job seeker with professional tools to create ATS-optimized resumes and stand out in the competitive job market.",
    visionTitle: "Our Vision",
    visionDescription: "To be the leading resume builder platform in Bangladesh, helping millions of job seekers achieve their career goals.",
    teamTitle: "Why Choose Us",
    storyContent: "ChakriCV was built by professionals who understand the challenges of job hunting in Bangladesh. We combine AI technology with local market knowledge to deliver the best resume building experience.",
  },
  contact: {
    title: "Contact Us",
    email: "support@chakricv.com",
    phone: "+880 1XXX-XXXXXX",
    officeAddress: "Dhaka, Bangladesh",
    supportHours: "Sunday - Friday: 9:00 AM - 6:00 PM",
    contactDescription: "Have questions? We're here to help you with anything related to our services.",
  },
  pricing: {
    title: "Simple, Transparent Pricing",
    subtitle: "Choose the plan that works best for you. All plans include access to our AI-powered resume builder.",
    badge: "Flexible pricing for every stage",
    footer: "Pay with bKash, Nagad, SSLCommerz, or any Bangladeshi card",
  },
};

export default function PageContentManagerPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { refreshContent } = usePageContent();
  const [selectedPage, setSelectedPage] = useState<"home" | "about" | "contact" | "pricing">("home");
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "bn">("en");
  const [editingContent, setEditingContent] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  const { data: pageContents, isLoading } = useQuery({
    queryKey: ["page-contents"],
    queryFn: async () => {
      const { data } = await api.get("/admin/page-content");
      return data.data as PageContent[];
    },
  });

  const currentContent = pageContents?.find(
    (c) => c.pageId === selectedPage && c.language === selectedLanguage
  );

  useEffect(() => {
    if (currentContent) {
      // Flatten the content for editing - use existing content from database
      const flatContent: Record<string, string> = {};
      for (const [key, value] of Object.entries(currentContent.content)) {
        if (typeof value === "object") {
          flatContent[key] = JSON.stringify(value, null, 2);
        } else {
          flatContent[key] = String(value);
        }
      }
      setEditingContent(flatContent);
    } else {
      // Use default values for the selected page when no content exists
      const defaults = defaultPageValues[selectedPage];
      const flatContent: Record<string, string> = {};
      for (const [key, value] of Object.entries(defaults)) {
        flatContent[key] = value;
      }
      setEditingContent(flatContent);
    }
    setIsEditing(false);
  }, [currentContent, selectedPage]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { pageId: string; language: string; content: Record<string, unknown> }) => {
      const { data } = await api.post("/admin/page-content", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-contents"] });
      queryClient.invalidateQueries({ queryKey: ["page-contents-all"] });
      // Also refresh the PageContentContext to update all pages dynamically
      refreshContent();
      toast.add("Page content saved successfully!", "success");
      setIsEditing(false);
    },
    onError: () => {
      toast.add("Failed to save page content", "error");
    },
  });

  const handleSave = () => {
    // Parse JSON fields
    const content: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(editingContent)) {
      try {
        const config = pageConfig[selectedPage].fields.find((f) => f.key === key);
        if (config?.type === "json") {
          content[key] = JSON.parse(value);
        } else {
          content[key] = value;
        }
      } catch {
        content[key] = value;
      }
    }

    saveMutation.mutate({
      pageId: selectedPage,
      language: selectedLanguage,
      content,
    });
  };

  const handleFieldChange = (key: string, value: string) => {
    setEditingContent((prev) => ({ ...prev, [key]: value }));
  };

  const pages: Array<"home" | "about" | "contact" | "pricing"> = ["home", "about", "contact", "pricing"];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Page Content Manager</h1>
          <p className="text-muted">Manage content for home, about, contact, and pricing pages</p>
        </div>
      </div>

      {/* Page and Language Selector */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          {pages.map((page) => {
            const config = pageConfig[page];
            const Icon = config.icon;
            const isActive = selectedPage === page;
            return (
              <Button
                key={page}
                variant={isActive ? "gradient" : "outline"}
                onClick={() => setSelectedPage(page)}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                {config.name}
              </Button>
            );
          })}
        </div>
        <div className="flex gap-2 ml-auto">
          <Button
            variant={selectedLanguage === "en" ? "default" : "outline"}
            onClick={() => setSelectedLanguage("en")}
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            English
          </Button>
          <Button
            variant={selectedLanguage === "bn" ? "default" : "outline"}
            onClick={() => setSelectedLanguage("bn")}
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            বাংলা
          </Button>
        </div>
      </div>

      {/* Content Editor */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              {pageConfig[selectedPage].name} - {selectedLanguage === "en" ? "English" : "বাংলা"}
            </CardTitle>
            <p className="text-sm text-muted mt-1">
              {currentContent
                ? `Last updated: ${new Date(currentContent.updatedAt).toLocaleDateString()}`
                : "No content exists yet for this page/language combination"}
            </p>
          </div>
          <div className="flex gap-2">
            {!isEditing && currentContent && (
              <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                <Edit3 className="h-4 w-4" />
                Edit
              </Button>
            )}
            {!isEditing && !currentContent && (
              <Button variant="gradient" onClick={() => setIsEditing(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Content
              </Button>
            )}
            {isEditing && (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="gap-2">
                  Cancel
                </Button>
                <Button
                  variant="gradient"
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saveMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isEditing ? (
            <div className="space-y-6">
              {pageConfig[selectedPage].fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="text-sm font-medium">{field.label}</label>
                  {field.type === "textarea" || field.type === "richtext" ? (
                    <textarea
                      className="w-full min-h-[100px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      value={editingContent[field.key] || ""}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  ) : field.type === "json" ? (
                    <textarea
                      className="w-full min-h-[150px] font-mono text-xs rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      value={editingContent[field.key] || ""}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder='{"key": "value"}'
                    />
                  ) : (
                    <Input
                      type={field.type}
                      value={editingContent[field.key] || ""}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : currentContent ? (
            <div className="space-y-6">
              {Object.entries(currentContent.content).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <label className="text-sm font-medium capitalize">{key}</label>
                  <div className="rounded-lg border bg-secondary/50 p-3 text-sm">
                    {typeof value === "object" ? (
                      <pre className="whitespace-pre-wrap font-mono text-xs">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      <p>{String(value)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No content exists for this page in {selectedLanguage === "en" ? "English" : "বাংলা"}.</p>
              <p className="text-sm mt-2">Click "Create Content" to add content for this page.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Content List */}
      <Card>
        <CardHeader>
          <CardTitle>All Page Contents</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : pageContents && pageContents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2">Page</th>
                    <th className="text-left py-2">Language</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Last Updated</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageContents.map((content) => (
                    <tr key={content._id} className="border-b border-border">
                      <td className="py-2 capitalize">{content.pageId}</td>
                      <td className="py-2">{content.language === "en" ? "English" : "বাংলা"}</td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            content.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {content.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-2">{new Date(content.updatedAt).toLocaleDateString()}</td>
                      <td className="py-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPage(content.pageId);
                            setSelectedLanguage(content.language);
                            setIsEditing(true);
                          }}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted text-center py-8">No page content has been created yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}