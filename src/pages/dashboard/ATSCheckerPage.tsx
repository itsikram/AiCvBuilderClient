import { useState } from "react";
import { Target, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";

interface ATSResult {
  score: number;
  grade: string;
  strengths: string[];
  weaknesses: string[];
  keywordAnalysis: { found: string[]; missing: string[] };
  recommendations: string[];
}

export default function ATSCheckerPage() {
  const toast = useToast();
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ATSResult | null>(null);

  const handleCheck = async () => {
    if (resumeText.length < 50) {
      toast.add("Please paste at least 50 characters of resume text", "error");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/resumes/ai/ats-check", { resumeText, jobDescription });
      setResult(data.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.add(msg || "ATS check failed. Premium may be required.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="h-7 w-7 text-primary" />
          ATS Score Checker
        </h1>
        <p className="text-muted">Analyze your resume for Applicant Tracking System compatibility</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resume Text</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full min-h-[200px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Paste your resume content here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Job Description (optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full min-h-[200px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Paste job description for targeted analysis..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </CardContent>
        </Card>
      </div>

      <Button variant="gradient" onClick={handleCheck} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
        Check ATS Score
      </Button>

      {result && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-5xl font-bold gradient-text">{result.score}%</div>
              <Badge variant={result.score >= 80 ? "success" : "secondary"} className="text-lg px-3">
                Grade {result.grade}
              </Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-green-600">Strengths</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {result.strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-red-600">Weaknesses</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {result.weaknesses.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
            {result.keywordAnalysis.missing.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Missing Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {result.keywordAnalysis.missing.map((k) => (
                    <Badge key={k} variant="outline">{k}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Recommendations</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                {result.recommendations.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
