import { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEO } from "@/components/seo/SEO";
import { useToast } from "@/components/ui/toast";

export default function ContactPage() {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.add("Message sent! We'll get back to you soon.", "success");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <>
      <SEO title="Contact" description="Get in touch with ChakriCV support" />
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold text-center mb-12">Contact Us</h1>
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
                    <p className="text-muted text-sm">support@chakricv.com</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 pt-6">
                  <Phone className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-muted text-sm">+880 1XXX-XXXXXX</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 pt-6">
                  <MapPin className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Office</p>
                    <p className="text-muted text-sm">Dhaka, Bangladesh</p>
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
