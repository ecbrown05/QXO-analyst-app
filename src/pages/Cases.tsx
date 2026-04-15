import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Search } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  in_review: "bg-info/10 text-info border-info/20",
  completed: "bg-success/10 text-success border-success/20",
  escalated: "bg-warning/10 text-warning border-warning/20",
  blocked: "bg-destructive/10 text-destructive border-destructive/20",
};

const TYPE_LABELS: Record<string, string> = {
  existing_deviation: "Existing Deviation",
  new_deviation: "New Deviation",
  spend_class_new: "Spend Class (New)",
  spend_class_existing: "Spend Class (Existing)",
  market_price_change: "Market Price Change",
};

export default function Cases() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: cases, isLoading } = useQuery({
    queryKey: ["cases", statusFilter, typeFilter],
    queryFn: async () => {
      let query = supabase.from("cases").select("*").order("created_at", { ascending: false });
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as "draft" | "in_review" | "completed" | "escalated" | "blocked");
      }
      if (typeFilter !== "all") {
        query = query.eq("request_type", typeFilter as "existing_deviation" | "new_deviation" | "spend_class_new" | "spend_class_existing" | "market_price_change");
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filteredCases = cases?.filter((c) =>
    search === "" ||
    c.case_number.toLowerCase().includes(search.toLowerCase()) ||
    c.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.requester?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Existing Cases</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and manage all pricing cases
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="existing_deviation">Existing Deviation</SelectItem>
            <SelectItem value="new_deviation">New Deviation</SelectItem>
            <SelectItem value="spend_class_new">Spend Class (New)</SelectItem>
            <SelectItem value="spend_class_existing">Spend Class (Existing)</SelectItem>
            <SelectItem value="market_price_change">Market Price Change</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground p-8 text-center">Loading cases...</div>
      ) : !filteredCases?.length ? (
        <div className="text-sm text-muted-foreground p-8 text-center border rounded-lg bg-muted/30">
          No cases found. Create a new case to get started.
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recommendation</TableHead>
                <TableHead>Margin Impact</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/cases/${c.id}`)}>
                  <TableCell className="font-mono text-sm">{c.case_number}</TableCell>
                  <TableCell>
                    <span className="text-sm">{TYPE_LABELS[c.request_type] ?? c.request_type}</span>
                  </TableCell>
                  <TableCell>{c.customer_name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_COLORS[c.status] ?? ""}>
                      {c.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {c.recommendation ? (
                      <Badge
                        variant={c.recommendation === "agree" ? "default" : c.recommendation === "push_back" ? "destructive" : "secondary"}
                      >
                        {c.recommendation.replace("_", " ")}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {c.total_margin_loss != null
                      ? `$${Math.abs(c.total_margin_loss).toLocaleString()}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" aria-label="View case">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
