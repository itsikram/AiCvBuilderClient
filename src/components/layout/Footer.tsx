import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GUIDES } from "@/content/guides";
import { useLang } from "@/lib/useLang";
import { SUPPORT_EMAIL, siteName } from "@/lib/site";
import { usePageContent } from "@/context/PageContentContext";
import { Globe } from "lucide-react";

const socialIcons: Record<string, React.ElementType> = {
  facebook: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
  ),
  twitter: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
  ),
  linkedin: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
  ),
  instagram: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
  ),
  youtube: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
  ),
};

export function Footer() {
  const { t } = useTranslation();
  const { lang, lp } = useLang();
  const { headerFooterContent } = usePageContent();

  const siteDescription = headerFooterContent.footerDescription || t("footer.description");
  const contactEmail = headerFooterContent.contactEmail || SUPPORT_EMAIL;
  const copyrightText = headerFooterContent.copyrightText || t("footer.copyright", { year: new Date().getFullYear(), name: siteName(lang) });
  const paymentMethods = headerFooterContent.paymentMethods || "bKash, Nagad, SSLCommerz";

  const companyLinks = (headerFooterContent.footerLinks || [
    { label: t("nav.about"), href: "/about" },
    { label: t("nav.contact"), href: "/contact" },
    { label: t("nav.pricing"), href: "/pricing" },
  ]).map((link) => ({ ...link, href: lp(link.href) }));

  const productLinks = [
    { label: t("footer.createCv"), href: "/register" },
    { label: t("nav.templates"), href: lp("/templates") },
    { label: t("nav.guides"), href: lp("/blog") },
  ];

  const socialLinks = headerFooterContent.socialLinks || [];

  const getSocialIcon = (platform: string) => {
    const iconName = platform.toLowerCase().split(" ")[0] as keyof typeof socialIcons;
    return socialIcons[iconName] || Globe;
  };

  const column = (title: string, links: Array<{ label: string; href: string }>) => (
    <div>
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      <ul className="space-y-2 text-sm text-muted">
        {links.map((link) => (
          <li key={link.href}>
            <Link to={link.href} className="transition-colors hover:text-primary">{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="mt-auto border-t border-border bg-secondary/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            {headerFooterContent.footerLogo ? (
              <img src={headerFooterContent.footerLogo} alt={siteName(lang)} className="h-8 object-contain" width="120" height="32" />
            ) : (
              <span className="text-xl font-bold gradient-text">{siteName(lang)}</span>
            )}
            <p className="mt-2 max-w-sm text-sm text-muted">{siteDescription}</p>
            <p className="mt-3 text-sm">
              <a href={`mailto:${contactEmail}`} className="text-muted transition-colors hover:text-primary">{contactEmail}</a>
            </p>
            {socialLinks.length > 0 && (
              <div className="mt-4 flex gap-3">
                {socialLinks.map((link) => {
                  const Icon = getSocialIcon(link.platform);
                  return (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-secondary p-2 transition-colors hover:bg-primary hover:text-primary-foreground"
                      aria-label={link.platform}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
          {column(t("footer.guides"), GUIDES.slice(0, 5).map((guide) => ({ label: guide[lang].label, href: lp(`/${guide.slug}`) })))}
          {column(t("footer.product"), productLinks)}
          {column(t("footer.company"), companyLinks)}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-sm text-muted md:flex-row">
          <p>{copyrightText}</p>
          <p>{t("footer.payments")}: {paymentMethods}</p>
        </div>
      </div>
    </footer>
  );
}
