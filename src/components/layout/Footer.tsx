import { Link } from "react-router-dom";
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
  const { headerFooterContent } = usePageContent();

  // Get dynamic content with fallbacks
  const siteDescription = headerFooterContent.footerDescription || headerFooterContent.siteDescription || "AI-powered resume builder for Bangladesh.";
  const contactEmail = headerFooterContent.contactEmail || "support@chakricv.com";
  const copyrightText = headerFooterContent.copyrightText || `© ${new Date().getFullYear()} ChakriCV. All rights reserved.`;
  const paymentMethods = headerFooterContent.paymentMethods || "bKash, Nagad, SSLCommerz";
  
  // Use dynamic footer links if available, otherwise use defaults
  const footerLinks = headerFooterContent.footerLinks || [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Pricing", href: "/pricing" },
    { label: "Templates", href: "/templates" },
  ];
  
  // Use dynamic social links if available
  const socialLinks = headerFooterContent.socialLinks || [];

  const productLinks = [
    { label: "Pricing", href: "/pricing" },
    { label: "Templates", href: "/templates" },
    { label: "Blog", href: "/blog" },
  ];

  const getSocialIcon = (platform: string) => {
    const iconName = platform.toLowerCase().split(' ')[0] as keyof typeof socialIcons;
    return socialIcons[iconName] || Globe;
  };

  return (
    <footer className="border-t border-border bg-secondary/30 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            {headerFooterContent.footerLogo ? (
              <img src={headerFooterContent.footerLogo} alt="ChakriCV" className="h-8 object-contain" />
            ) : (
              <span className="text-xl font-bold gradient-text">ChakriCV</span>
            )}
            <p className="mt-2 text-sm text-muted">
              {siteDescription}
            </p>
            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex gap-3 mt-4">
                {socialLinks.map((link, index) => {
                  const Icon = getSocialIcon(link.platform);
                  return (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
                      aria-label={link.platform}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-muted">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
              {contactEmail && (
                <li className="text-xs text-muted pt-2">
                  <a href={`mailto:${contactEmail}`} className="hover:text-primary transition-colors">
                    {contactEmail}
                  </a>
                </li>
              )}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Payments</h4>
            <p className="text-sm text-muted">{paymentMethods}</p>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-center text-sm text-muted">
            {copyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
}
