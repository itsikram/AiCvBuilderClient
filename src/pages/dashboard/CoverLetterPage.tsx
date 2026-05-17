import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

interface CoverLetter {
  _id: string;
  title: string;
  companyName: string;
  jobTitle: string;
  content: string;
  createdAt: string;
}

export default function CoverLetterPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    companyName: "",
    jobTitle: "",
    jobDescription: "",
  });
  const [generated, setGenerated] = useState("");

  const { data: letters } = useQuery({
    queryKey: ["cover-letters"],
    queryFn: async () => {
      const { data } = await api.get("/cover-letters");
      return data.data as CoverLetter[];
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post("/cover-letters/generate", { ...form, language: "en" }),
    onSuccess: (res) => {
      setGenerated(res.data.data.letter.content);
      queryClient.invalidateQueries({ queryKey: ["cover-letters"] });
      toast.add("Cover letter generated!", "success");
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.add(msg || "Generation failed", "error");
    },
  });

  const exportPDF = async (id: string) => {
    const res = await api.get(`/cover-letters/${id}/export-pdf`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "cover-letter.pdf";
    a.click();
  };

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Mail className="h-7 w-7 text-primary" />
        Cover Letter Generator
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Generate New Cover Letter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Company Name"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          />
          <Input
            placeholder="Job Title"
            value={form.jobTitle}
            onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
          />
          <textarea
            className="w-full min-h-[120px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Job description..."
            value={form.jobDescription}
            onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
          />
          <Button
            variant="gradient"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Generate with AI
          </Button>
          {generated && (
            <div className="mt-4 p-4 border border-border rounded-lg bg-secondary/30 whitespace-pre-wrap text-sm">
              {generated}
            </div>
          )}
        </CardContent>
      </Card>

      {letters && letters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Cover Letters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {letters.map((letter) => (
              <div
                key={letter._id}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div>
                  <p className="font-medium">{letter.title}</p>
                  <p className="text-xs text-muted">{formatDate(letter.createdAt)}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => exportPDF(letter._id)}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
