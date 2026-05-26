import { Target, Lightbulb, Award, Heart, Globe, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/seo/SEO";
import { usePageContent } from "@/context/PageContentContext";

export default function AboutPage() {
  const { getPageContent } = usePageContent();
  const aboutContent = getPageContent("about");

  // Get dynamic content with fallbacks
  const title = (aboutContent?.title as string) || "About ChakriCV";
  const subtitle = (aboutContent?.subtitle as string) || "We're on a mission to help job seekers in Bangladesh land their dream jobs.";
  const missionTitle = (aboutContent?.missionTitle as string) || "Our Mission";
  const missionDescription = (aboutContent?.missionDescription as string) || "To empower every job seeker with professional tools to create ATS-optimized resumes and stand out in the competitive job market.";
  const visionTitle = (aboutContent?.visionTitle as string) || "Our Vision";
  const visionDescription = (aboutContent?.visionDescription as string) || "To be the leading resume builder platform in Bangladesh, helping millions of job seekers achieve their career goals.";
  const teamTitle = (aboutContent?.teamTitle as string) || "Why Choose Us";
  const storyContent = (aboutContent?.storyContent as string) || "ChakriCV was built by professionals who understand the challenges of job hunting in Bangladesh. We combine AI technology with local market knowledge to deliver the best resume building experience.";

  const features = [
    {
      icon: Target,
      title: "ATS Optimization",
      description: "Our AI-powered resumes are designed to pass Applicant Tracking Systems used by top companies."
    },
    {
      icon: Lightbulb,
      title: "Smart AI Suggestions",
      description: "Get real-time suggestions to improve your content and make your resume stand out."
    },
    {
      icon: Award,
      title: "Professional Templates",
      description: "Choose from a variety of professionally designed templates suitable for any industry."
    },
    {
      icon: Heart,
      title: "Built for Bangladesh",
      description: "Tailored for the local job market with support for both English and Bengali languages."
    },
    {
      icon: Globe,
      title: "Multi-language Support",
      description: "Create resumes in English or Bengali with seamless language switching."
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your data is secure and private. We never share your information without consent."
    }
  ];

  const stats = [
    { value: "10K+", label: "Resumes Created" },
    { value: "95%", label: "ATS Pass Rate" },
    { value: "5K+", label: "Happy Users" },
    { value: "50+", label: "Templates" }
  ];

  return (
    <>
      <SEO title={title} description={subtitle} />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{title}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {subtitle}
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="h-8 w-8 text-primary" />
                  <h2 className="text-2xl font-bold">{missionTitle}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {missionDescription}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-secondary/50 to-transparent">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lightbulb className="h-8 w-8 text-primary" />
                  <h2 className="text-2xl font-bold">{visionTitle}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {visionDescription}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-6">Our Story</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {storyContent}
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{teamTitle}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We combine cutting-edge AI technology with deep understanding of the Bangladesh job market to deliver the best resume building experience.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-violet-600 text-white">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Build Your Professional Resume?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of job seekers who have already transformed their careers with ChakriCV.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/register"
              className="px-8 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors inline-block"
            >
              Get Started Free
            </a>
            <a 
              href="/pricing"
              className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors inline-block"
            >
              View Pricing
            </a>
          </div>
        </div>
      </section>
    </>
  );
}