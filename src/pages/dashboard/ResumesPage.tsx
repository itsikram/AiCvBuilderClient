import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import type { Resume } from "@/types";

export default function ResumesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: resumes, isLoading } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => {
      const { data } = await api.get("/resumes");
      return data.data as Resume[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/resumes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      toast.add("Resume deleted", "success");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/resumes/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      toast.add("Resume duplicated", "success");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Resumes</h1>
        <Button variant="gradient" asChild>
          <Link to="/dashboard/resumes/new">
            <Plus className="h-4 w-4" />
            New Resume
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {resumes?.map((resume) => (
            <Card key={resume._id}>
              <CardContent className="flex items-center justify-between py-4">
                <Link
                  to={`/dashboard/resumes/${resume._id}`}
                  className="flex items-center gap-3 flex-1"
                >
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold">{resume.title}</p>
                    <p className="text-sm text-muted">
                      Updated {formatDate(resume.updatedAt)} · {resume.format}
                    </p>
                  </div>
                </Link>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => duplicateMutation.mutate(resume._id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("Delete this resume?")) deleteMutation.mutate(resume._id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!resumes?.length && (
            <p className="text-center text-muted py-12">No resumes yet. Create your first one!</p>
          )}
        </div>
      )}
    </div>
  );
}
