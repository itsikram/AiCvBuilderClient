import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Sparkles,
  Target,
  Mail,
  FileText,
  Globe,
  Download,
  CheckCircle,
  ArrowRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/seo/SEO";

const features = [
  { icon: Sparkles, key: "aiResume", descKey: "aiResumeDesc" },
  { icon: Target, key: "atsChecker", descKey: "atsCheckerDesc" },
  { icon: Mail, key: "coverLetter", descKey: "coverLetterDesc" },
  { icon: FileText, key: "templates", descKey: "templatesDesc" },
  { icon: Download, key: "pdfExport", descKey: "pdfExportDesc" },
  { icon: Globe, key: "bilingual", descKey: "bilingualDesc" },
];

const stats = [
  { value: "10K+", label: "Resumes Created" },
  { value: "95%", label: "ATS Pass Rate" },
  { value: "৳499", label: "Starting Price/mo" },
  { value: "2", label: "Languages" },
];

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <>
      <SEO />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800" />
        <div className="container relative mx-auto px-4 py-20 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 dark:bg-blue-900/30 px-4 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-300 mb-6">
              <Sparkles className="h-4 w-4" />
              Powered by Gemini 2.5 Flash AI
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              <span className="gradient-text">{t("hero.title")}</span>
            </h1>
            <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-8">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="gradient" size="lg" asChild>
                <Link to="/register">
                  {t("hero.cta")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/templates">{t("hero.ctaSecondary")}</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {stats.map((stat) => (
              <Card key={stat.label} className="text-center">
                <CardContent className="pt-6">
                  <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                  <p className="text-sm text-muted mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-secondary/30">
        <motion.div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need to get hired</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <f.icon className="h-10 w-10 text-primary mb-4" />
                    <h3 className="font-semibold text-lg mb-2">{t(`features.${f.key}`)}</h3>
                    <p className="text-muted text-sm">{t(`features.${f.descKey}`)}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Trusted by job seekers across Bangladesh</h2>
          <div className="flex justify-center gap-1 mb-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <p className="text-muted max-w-xl mx-auto mb-8">
            Students, freelancers, and professionals use ChakriCV to create ATS-optimized resumes and land jobs at top companies.
          </p>
          <ul className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left mb-10">
            {["ATS-optimized content", "Bangla & English support", "bKash & Nagad payments"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
          <Button variant="gradient" size="lg" asChild>
            <Link to="/register">Start Building Free</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
