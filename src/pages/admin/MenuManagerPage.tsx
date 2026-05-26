import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import api from "@/lib/api";
import { usePageContent } from "@/context/PageContentContext";
import {
  Save,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Globe,
  Link as LinkIcon,
  Menu,
  ExternalLink,
} from "lucide-react";

interface NavLink {
  label: string;
  href: string;
}

interface SocialLink {
  platform: string;
  url: string;
}

interface FooterLink {
  label: string;
  href: string;
}

interface PageContent {
  _id: string;
  pageId: "home" | "about" | "contact" | "pricing";
  language: "en" | "bn";
  content: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_NAV_LINKS: NavLink[] = [
  { label: "Pricing", href: "/pricing" },
  { label: "Templates", href: "/templates" },
  { label: "Blog", href: "/blog" },
];

const DEFAULT_FOOTER_LINKS: FooterLink[] = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Pricing", href: "/pricing" },
  { label: "Templates", href: "/templates" },
];

const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { platform: "Facebook", url: "https://facebook.com/chakricv" },
  { platform: "LinkedIn", url: "https://linkedin.com/company/chakricv" },
  { platform: "Twitter", url: "https://twitter.com/chakricv" },
];

const DEFAULT_FOOTER_DESCRIPTION =
  "AI-powered resume builder for Bangladesh. Create professional, ATS-optimized resumes in minutes.";

const DEFAULT_COPYRIGHT = `© ${new Date().getFullYear()} ChakriCV. All rights reserved.`;

const DEFAULT_HEADER_LOGO = "";
const DEFAULT_FOOTER_LOGO = "";
const DEFAULT_SITE_ICON = "";

export default function MenuManagerPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { refreshContent } = usePageContent();
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "bn">("en");

  // Form state
  const [navLinks, setNavLinks] = useState<NavLink[]>(DEFAULT_NAV_LINKS);
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>(DEFAULT_FOOTER_LINKS);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(DEFAULT_SOCIAL_LINKS);
  const [copyrightText, setCopyrightText] = useState(DEFAULT_COPYRIGHT);
  const [footerDescription, setFooterDescription] = useState(DEFAULT_FOOTER_DESCRIPTION);
  const [contactEmail, setContactEmail] = useState("");
  const [paymentMethods, setPaymentMethods] = useState("bKash, Nagad, SSLCommerz");
  const [headerLogo, setHeaderLogo] = useState(DEFAULT_HEADER_LOGO);
  const [footerLogo, setFooterLogo] = useState(DEFAULT_FOOTER_LOGO);
  const [siteIcon, setSiteIcon] = useState(DEFAULT_SITE_ICON);

  // Fetch existing page contents
  const { data: pageContents, isLoading } = useQuery({
    queryKey: ["page-contents"],
    queryFn: async () => {
      const { data } = await api.get("/admin/page-content");
      return data.data as PageContent[];
    },
  });

  // Load existing content when language changes
  useEffect(() => {
    const homeContent = pageContents?.find(
      (c) => c.pageId === "home" && c.language === selectedLanguage
    );

    if (homeContent?.content) {
      const content = homeContent.content;
      if (Array.isArray(content.navLinks)) {
        setNavLinks(content.navLinks as NavLink[]);
      } else {
        setNavLinks(DEFAULT_NAV_LINKS);
      }
      if (Array.isArray(content.footerLinks)) {
        setFooterLinks(content.footerLinks as FooterLink[]);
      } else {
        setFooterLinks(DEFAULT_FOOTER_LINKS);
      }
      if (Array.isArray(content.socialLinks)) {
        setSocialLinks(content.socialLinks as SocialLink[]);
      } else {
        setSocialLinks(DEFAULT_SOCIAL_LINKS);
      }
      if (typeof content.copyrightText === "string") {
        setCopyrightText(content.copyrightText);
      } else {
        setCopyrightText(DEFAULT_COPYRIGHT);
      }
      if (typeof content.footerDescription === "string") {
        setFooterDescription(content.footerDescription);
      } else {
        setFooterDescription(DEFAULT_FOOTER_DESCRIPTION);
      }
      if (typeof content.headerLogo === "string") {
        setHeaderLogo(content.headerLogo);
      } else {
        setHeaderLogo(DEFAULT_HEADER_LOGO);
      }
      if (typeof content.footerLogo === "string") {
        setFooterLogo(content.footerLogo);
      } else {
        setFooterLogo(DEFAULT_FOOTER_LOGO);
      }
      if (typeof content.siteIcon === "string") {
        setSiteIcon(content.siteIcon);
      } else {
        setSiteIcon(DEFAULT_SITE_ICON);
      }
    } else {
      setNavLinks(DEFAULT_NAV_LINKS);
      setFooterLinks(DEFAULT_FOOTER_LINKS);
      setSocialLinks(DEFAULT_SOCIAL_LINKS);
      setCopyrightText(DEFAULT_COPYRIGHT);
      setFooterDescription(DEFAULT_FOOTER_DESCRIPTION);
      setHeaderLogo(DEFAULT_HEADER_LOGO);
      setFooterLogo(DEFAULT_FOOTER_LOGO);
      setSiteIcon(DEFAULT_SITE_ICON);
    }

    // Load contact info from contact page
    const contactContent = pageContents?.find(
      (c) => c.pageId === "contact" && c.language === selectedLanguage
    );
    if (contactContent?.content) {
      if (typeof contactContent.content.email === "string") {
        setContactEmail(contactContent.content.email);
      } else {
        setContactEmail("");
      }
    } else {
      setContactEmail("");
    }

    // Load payment methods from pricing page
    const pricingContent = pageContents?.find(
      (c) => c.pageId === "pricing" && c.language === selectedLanguage
    );
    if (pricingContent?.content) {
      if (typeof pricingContent.content.paymentMethods === "string") {
        setPaymentMethods(pricingContent.content.paymentMethods);
      } else {
        setPaymentMethods("bKash, Nagad, SSLCommerz");
      }
    } else {
      setPaymentMethods("bKash, Nagad, SSLCommerz");
    }
  }, [pageContents, selectedLanguage]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: {
      pageId: string;
      language: string;
      content: Record<string, unknown>;
    }) => {
      const { data } = await api.post("/admin/page-content", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-contents"] });
      queryClient.invalidateQueries({ queryKey: ["page-contents-all"] });
      refreshContent();
      toast.add("Menu settings saved successfully!", "success");
    },
    onError: () => {
      toast.add("Failed to save menu settings", "error");
    },
  });

  // Nav link handlers
  const addNavLink = () => {
    setNavLinks([...navLinks, { label: "", href: "" }]);
  };

  const updateNavLink = (index: number, field: keyof NavLink, value: string) => {
    const updated = [...navLinks];
    updated[index] = { ...updated[index], [field]: value };
    setNavLinks(updated);
  };

  const removeNavLink = (index: number) => {
    setNavLinks(navLinks.filter((_, i) => i !== index));
  };

  const moveNavLink = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= navLinks.length) return;
    const updated = [...navLinks];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setNavLinks(updated);
  };

  // Footer link handlers
  const addFooterLink = () => {
    setFooterLinks([...footerLinks, { label: "", href: "" }]);
  };

  const updateFooterLink = (index: number, field: keyof FooterLink, value: string) => {
    const updated = [...footerLinks];
    updated[index] = { ...updated[index], [field]: value };
    setFooterLinks(updated);
  };

  const removeFooterLink = (index: number) => {
    setFooterLinks(footerLinks.filter((_, i) => i !== index));
  };

  const moveFooterLink = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= footerLinks.length) return;
    const updated = [...footerLinks];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setFooterLinks(updated);
  };

  // Social link handlers
  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { platform: "", url: "" }]);
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: string) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    setSocialLinks(updated);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const moveSocialLink = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= socialLinks.length) return;
    const updated = [...socialLinks];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setSocialLinks(updated);
  };

  const handleSave = () => {
    // Build the content object for the home page
    const homeContent: Record<string, unknown> = {
      navLinks,
      footerLinks,
      socialLinks,
      copyrightText,
      footerDescription,
      headerLogo,
      footerLogo,
      siteIcon,
    };

    // Also update contact page with email if changed
    const contactContent = pageContents?.find(
      (c) => c.pageId === "contact" && c.language === selectedLanguage
    );
    const existingContactContent = contactContent?.content || {};

    // Also update pricing page with payment methods if changed
    const pricingContent = pageContents?.find(
      (c) => c.pageId === "pricing" && c.language === selectedLanguage
    );
    const existingPricingContent = pricingContent?.content || {};

    // Save home page content (contains nav/footer/social links)
    saveMutation.mutate({
      pageId: "home",
      language: selectedLanguage,
      content: {
        ...existingContactContent,
        ...homeContent,
        // Preserve existing home page content fields
        heroTitle:
          typeof existingContactContent.heroTitle === "string"
            ? existingContactContent.heroTitle
            : "Build Your Perfect Resume with AI",
        heroSubtitle:
          typeof existingContactContent.heroSubtitle === "string"
            ? existingContactContent.heroSubtitle
            : "Create ATS-optimized resumes in minutes",
      },
    });

    // Save contact email if set
    if (contactEmail) {
      saveMutation.mutate({
        pageId: "contact",
        language: selectedLanguage,
        content: {
          ...existingContactContent,
          email: contactEmail,
        },
      });
    }

    // Save payment methods
    saveMutation.mutate({
      pageId: "pricing",
      language: selectedLanguage,
      content: {
        ...existingPricingContent,
        paymentMethods,
      },
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Menu Manager</h1>
          <p className="text-muted">
            Manage header navigation, footer links, and social media connections
          </p>
        </div>
        <div className="flex gap-2">
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

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Menu className="h-5 w-5" />
                Header Navigation
              </CardTitle>
              <CardDescription>
                Manage the links that appear in the website header navigation bar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {navLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm text-muted w-6">{index + 1}.</span>
                  <Input
                    placeholder="Label (e.g., Pricing)"
                    value={link.label}
                    onChange={(e) => updateNavLink(index, "label", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="URL (e.g., /pricing)"
                    value={link.href}
                    onChange={(e) => updateNavLink(index, "href", e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveNavLink(index, "up")}
                      disabled={index === 0}
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveNavLink(index, "down")}
                      disabled={index === navLinks.length - 1}
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeNavLink(index)}
                      disabled={navLinks.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addNavLink} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Add Navigation Link
              </Button>
            </CardContent>
          </Card>

          {/* Footer Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Footer Links
              </CardTitle>
              <CardDescription>
                Manage the links that appear in the website footer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {footerLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm text-muted w-6">{index + 1}.</span>
                  <Input
                    placeholder="Label (e.g., About)"
                    value={link.label}
                    onChange={(e) => updateFooterLink(index, "label", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="URL (e.g., /about)"
                    value={link.href}
                    onChange={(e) => updateFooterLink(index, "href", e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveFooterLink(index, "up")}
                      disabled={index === 0}
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveFooterLink(index, "down")}
                      disabled={index === footerLinks.length - 1}
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFooterLink(index)}
                      disabled={footerLinks.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addFooterLink} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Add Footer Link
              </Button>
            </CardContent>
          </Card>

          {/* Social Media Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Social Media Links
              </CardTitle>
              <CardDescription>
                Manage social media links displayed in the footer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {socialLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm text-muted w-6">{index + 1}.</span>
                  <Input
                    placeholder="Platform (e.g., Facebook)"
                    value={link.platform}
                    onChange={(e) => updateSocialLink(index, "platform", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="URL (e.g., https://facebook.com/...)"
                    value={link.url}
                    onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveSocialLink(index, "up")}
                      disabled={index === 0}
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveSocialLink(index, "down")}
                      disabled={index === socialLinks.length - 1}
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSocialLink(index)}
                      disabled={socialLinks.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addSocialLink} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Add Social Link
              </Button>
            </CardContent>
          </Card>

          {/* Logo & Branding Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Logo & Branding</CardTitle>
              <CardDescription>
                Configure logos and site icon for header, footer, and browser tab
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Header Logo URL</label>
                <Input
                  value={headerLogo}
                  onChange={(e) => setHeaderLogo(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                {headerLogo && (
                  <div className="mt-2">
                    <img
                      src={headerLogo}
                      alt="Header Logo Preview"
                      className="h-8 object-contain border rounded p-1"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                )}
                <p className="text-xs text-muted">Recommended: 120x40px, PNG or SVG format</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Footer Logo URL</label>
                <Input
                  value={footerLogo}
                  onChange={(e) => setFooterLogo(e.target.value)}
                  placeholder="https://example.com/footer-logo.png"
                />
                {footerLogo && (
                  <div className="mt-2">
                    <img
                      src={footerLogo}
                      alt="Footer Logo Preview"
                      className="h-8 object-contain border rounded p-1"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                )}
                <p className="text-xs text-muted">Recommended: 120x40px, PNG or SVG format</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Site Icon (Favicon) URL</label>
                <Input
                  value={siteIcon}
                  onChange={(e) => setSiteIcon(e.target.value)}
                  placeholder="https://example.com/favicon.ico"
                />
                {siteIcon && (
                  <div className="mt-2">
                    <img
                      src={siteIcon}
                      alt="Site Icon Preview"
                      className="h-8 w-8 object-contain border rounded p-1"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                )}
                <p className="text-xs text-muted">Recommended: 32x32px or 64x64px, ICO, PNG, or SVG format</p>
              </div>
            </CardContent>
          </Card>

          {/* Footer Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Footer Settings</CardTitle>
              <CardDescription>
                Configure footer text, contact info, and other settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Footer Description</label>
                <textarea
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[80px]"
                  value={footerDescription}
                  onChange={(e) => setFooterDescription(e.target.value)}
                  placeholder="Enter footer description..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Copyright Text</label>
                <Input
                  value={copyrightText}
                  onChange={(e) => setCopyrightText(e.target.value)}
                  placeholder="© 2024 ChakriCV. All rights reserved."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Email</label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="support@chakricv.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Methods</label>
                <Input
                  value={paymentMethods}
                  onChange={(e) => setPaymentMethods(e.target.value)}
                  placeholder="bKash, Nagad, SSLCommerz"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              variant="gradient"
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="gap-2 px-8"
            >
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? "Saving..." : "Save All Changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}