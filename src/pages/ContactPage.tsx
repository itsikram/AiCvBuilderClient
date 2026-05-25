import { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEO } from "@/components/seo/SEO";
import { useToast } from "@/components/ui/toast";
import { usePageContent } from "@/context/PageContentContext";

export default function ContactPage() {
  const toast = useToast();
  const { getPageContent } = usePageContent();
  const contactContent = getPageContent("contact");
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  // Get dynamic content with fallbacks
  const title = (contactContent?.title as string) || "Contact Us";
  const email = (contactContent?.email as string) || "support@chakricv.com";
  const phone = (contactContent?.phone as string) || "+880 1XXX-XXXXXX";
  const officeAddress = (contactContent?.officeAddress as string) || "Dhaka, Bangladesh";
  const supportHours = (contactContent?.supportHours as string) || "Sunday - Friday: 9:00 AM - 6:00 PM";
  const contactDescription = (contactContent?.contactDescription as string) || "Have questions? We're here to help you with anything related to our services.";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.add("Message sent! We'll get back to you soon.", "success");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <>
      <SEO title={title} description={contactDescription} />
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold text-center mb-12">{title}</h1>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Send a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    placeholder="Your Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                  <textarea
                    className="w-full min-h-[120px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Message"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                  />
                  <Button type="submit" variant="gradient" className="w-full">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
            <div className="space-y-6">
              <Card>
                <CardContent className="flex items-center gap-4 pt-6">
                  <Mail className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted text-sm">{email}</p>
                    {supportHours && <p className="text-xs text-muted mt-1">{supportHours}</p>}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 pt-6">
                  <Phone className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-muted text-sm">{phone}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 pt-6">
                  <MapPin className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Office</p>
                    <p className="text-muted text-sm">{officeAddress}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
