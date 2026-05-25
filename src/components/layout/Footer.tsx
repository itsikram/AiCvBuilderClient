import { Link } from "react-router-dom";
import { usePageContent } from "@/context/PageContentContext";

export function Footer() {
  const { headerFooterContent } = usePageContent();

  // Get dynamic content with fallbacks
  const siteDescription = headerFooterContent.siteDescription || "AI-powered resume builder for Bangladesh.";
  const contactEmail = headerFooterContent.contactEmail || "support@chakricv.com";

  return (
    <footer className="border-t border-border bg-secondary/30 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <span className="text-xl font-bold gradient-text">ChakriCV</span>
            <p className="mt-2 text-sm text-muted">
              {siteDescription}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link to="/pricing" className="hover:text-primary">Pricing</Link></li>
              <li><Link to="/templates" className="hover:text-primary">Templates</Link></li>
              <li><Link to="/blog" className="hover:text-primary">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
              {contactEmail && (
                <li className="text-xs text-muted pt-1">
                  <a href={`mailto:${contactEmail}`} className="hover:text-primary">
                    {contactEmail}
                  </a>
                </li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Payments</h4>
            <p className="text-sm text-muted">bKash, Nagad, SSLCommerz</p>
          </div>
        </div>
        <p className="mt-8 text-center text-sm text-muted">
          © {new Date().getFullYear()} ChakriCV. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
