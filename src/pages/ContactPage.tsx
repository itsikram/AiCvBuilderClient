import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/seo/SEO";
import { useToast } from "@/components/ui/toast";
import { usePageContent } from "@/context/PageContentContext";
import api, { getErrorMessage } from "@/lib/api";
import { SUPPORT_EMAIL } from "@/lib/site";
import { useLang } from "@/lib/useLang";
import { breadcrumbLd } from "@/lib/jsonld";

export default function ContactPage() {
  const { t } = useTranslation();
  const { lp } = useLang();
  const toast = useToast();
  const { getPageContent } = usePageContent();
  const contactContent = getPageContent("contact");
  const [form, setForm] = useState({ name: "", email: "", message: "", website: "" });
  const [sending, setSending] = useState(false);

  const title = (contactContent?.title as string) || t("contact.title");
  const email = (contactContent?.email as string) || SUPPORT_EMAIL;
  const phone = contactContent?.phone as string | undefined;
  const officeAddress = (contactContent?.officeAddress as string) || t("contact.address");
  const supportHours = (contactContent?.supportHours as string) || t("contact.hours");
  const contactDescription = (contactContent?.contactDescription as string) || t("contact.intro");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/contact", form);
      toast.add(t("contact.sent"), "success");
      setForm({ name: "", email: "", message: "", website: "" });
    } catch (error) {
      toast.add(getErrorMessage(error, t("contact.failed", { email })), "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <SEO
        title={t("contact.seoTitle")}
        description={t("contact.seoDescription")}
        jsonLd={breadcrumbLd([{ name: t("nav.home"), path: lp("/") }, { name: t("nav.contact"), path: lp("/contact") }])}
      />
      <section className="py-10 md:py-14">
        <div className="container mx-auto max-w-4xl px-4">
          <h1 className="text-center text-3xl font-bold">{title}</h1>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted">{contactDescription}</p>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border p-6">
              <h2 className="text-lg font-semibold">{t("contact.formTitle")}</h2>
              <div className="space-y-1.5">
                <Label htmlFor="contact-name">{t("contact.name")}</Label>
                <Input id="contact-name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-email">{t("contact.email")}</Label>
                <Input id="contact-email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={200} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-message">{t("contact.message")}</Label>
                <textarea
                  id="contact-message"
                  className="min-h-[140px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  minLength={10}
                  maxLength={3000}
                />
              </div>
              {/* Honeypot: hidden from people, filled by bots */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
              <Button type="submit" variant="gradient" className="w-full" disabled={sending}>
                {sending ? t("common.sending") : t("contact.send")}
              </Button>
            </form>
            <ul className="space-y-4">
              <li className="flex items-start gap-4 rounded-2xl border border-border p-5">
                <Mail className="h-7 w-7 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-medium">{t("contact.email")}</p>
                  <a href={`mailto:${email}`} className="text-sm text-muted hover:text-primary">{email}</a>
                  {supportHours && <p className="mt-1 text-xs text-muted">{supportHours}</p>}
                </div>
              </li>
              {phone && (
                <li className="flex items-start gap-4 rounded-2xl border border-border p-5">
                  <Phone className="h-7 w-7 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className="font-medium">{t("contact.phone")}</p>
                    <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="text-sm text-muted hover:text-primary">{phone}</a>
                  </div>
                </li>
              )}
              <li className="flex items-start gap-4 rounded-2xl border border-border p-5">
                <MapPin className="h-7 w-7 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-medium">{t("contact.office")}</p>
                  <p className="text-sm text-muted">{officeAddress}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
