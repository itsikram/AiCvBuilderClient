import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Mail, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import api, { getErrorMessage } from "@/lib/api";
import { confirmAction } from "@/lib/confirm";

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  message: string;
  ip: string | null;
  handled: boolean;
  createdAt: string;
}

interface ContactMessagesResponse {
  messages: ContactMessage[];
  total: number;
  open: number;
  page: number;
  pages: number;
}

const FILTERS = [
  { value: "open", label: "Open" },
  { value: "handled", label: "Handled" },
  { value: "all", label: "All" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];

/** Messages sent through the public contact form. */
export default function ContactMessagesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("open");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Debounce the search box so typing doesn't fire a request per keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-contact-messages", filter, search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ status: filter, page: String(page) });
      if (search) params.set("search", search);
      return (await api.get(`/admin/contact-messages?${params}`)).data.data as ContactMessagesResponse;
    },
    placeholderData: keepPreviousData,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });

  const toggle = useMutation({
    mutationFn: async ({ id, handled }: { id: string; handled: boolean }) =>
      (await api.patch(`/admin/contact-messages/${id}`, { handled })).data.data,
    onSuccess: (_data, vars) => {
      invalidate();
      toast.add(vars.handled ? "Marked as handled" : "Moved back to open", "success");
    },
    onError: (error) => toast.add(getErrorMessage(error, "Couldn't update the message"), "error"),
  });

  const remove = async (message: ContactMessage) => {
    const ok = await confirmAction({
      title: `Delete the message from ${message.name}?`,
      text: "This can't be undone. Mark it as handled instead if you want to keep a record.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/contact-messages/${message._id}`);
      invalidate();
      toast.add("Message deleted", "success");
    } catch (error) {
      toast.add(getErrorMessage(error, "Couldn't delete the message"), "error");
    }
  };

  const messages = data?.messages ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contact messages</h1>
        <p className="text-muted">
          Everything sent through the contact form. Reply by email, then mark the message as handled so it leaves the open list.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter messages">
          {FILTERS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={filter === option.value ? "default" : "outline"}
              onClick={() => {
                setFilter(option.value);
                setPage(1);
              }}
            >
              {option.label}
              {option.value === "open" && data?.open ? ` (${data.open})` : ""}
            </Button>
          ))}
        </div>
        <Input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search name, email or message"
          aria-label="Search messages"
          className="sm:max-w-xs"
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : !messages.length ? (
        <p className="py-10 text-center text-muted">{search ? "No messages match your search." : "No messages here."}</p>
      ) : (
        <div className={isFetching ? "space-y-3 opacity-70 transition-opacity" : "space-y-3"}>
          {messages.map((message) => (
            <Card key={message._id}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{message.name}</p>
                    <p className="break-all text-sm text-muted">
                      <a href={`mailto:${message.email}`} className="text-primary hover:underline">
                        {message.email}
                      </a>{" "}
                      · {new Date(message.createdAt).toLocaleString()}
                      {message.ip && ` · IP ${message.ip}`}
                    </p>
                  </div>
                  <Badge variant={message.handled ? "success" : "outline"}>{message.handled ? "Handled" : "Open"}</Badge>
                </div>
                <p className="whitespace-pre-wrap break-words rounded-lg bg-secondary/50 p-3 text-sm">{message.message}</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${message.email}?subject=${encodeURIComponent("Re: your message")}`}>
                      <Mail className="h-4 w-4" />
                      Reply by email
                    </a>
                  </Button>
                  <Button
                    variant={message.handled ? "ghost" : "gradient"}
                    size="sm"
                    disabled={toggle.isPending}
                    onClick={() => toggle.mutate({ id: message._id, handled: !message.handled })}
                  >
                    {message.handled ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    {message.handled ? "Reopen" : "Mark handled"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => void remove(message)}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted">
            Page {data.page} of {data.pages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
