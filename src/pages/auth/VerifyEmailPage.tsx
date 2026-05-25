import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/seo/SEO";
import api from "@/lib/api";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    api
      .post("/auth/verify-email", { token })
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <>
      <SEO title="Verify your ChakriCV email" noIndex />
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            {status === "loading" && <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />}
            {status === "success" && (
              <>
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Email Verified!</h2>
                <Link to="/dashboard" className="text-primary hover:underline">
                  Go to Dashboard
                </Link>
              </>
            )}
            {status === "error" && (
              <>
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Verification Failed</h2>
                <p className="text-muted text-sm">Link may be expired or invalid.</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
