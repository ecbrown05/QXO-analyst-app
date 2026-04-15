import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

export default function ReferenceData() {
  const [search, setSearch] = useState("");

  const { data: customers } = useQuery({
    queryKey: ["ref-customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("customer_name").limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: skus } = useQuery({
    queryKey: ["ref-skus"],
    queryFn: async () => {
      const { data, error } = await supabase.from("skus").select("*").order("sku_code").limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: thresholds } = useQuery({
    queryKey: ["ref-thresholds"],
    queryFn: async () => {
      const { data, error } = await supabase.from("spend_class_thresholds").select("*").order("class");
      if (error) throw error;
      return data;
    },
  });

  const { data: governance } = useQuery({
    queryKey: ["ref-governance"],
    queryFn: async () => {
      const { data, error } = await supabase.from("governance_thresholds").select("*").order("request_type");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Reference Data</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse pricing reference tables — target prices, market prices, customers, and thresholds
        </p>
      </div>

      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="customers">
        <TabsList>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="skus">SKUs</TabsTrigger>
          <TabsTrigger value="thresholds">Spend Class Thresholds</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="border rounded-lg mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Weeks</TableHead>
                <TableHead>Growth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers?.filter((c) => !search || c.customer_name.toLowerCase().includes(search.toLowerCase()) || c.customer_id.toLowerCase().includes(search.toLowerCase())).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.customer_id}</TableCell>
                  <TableCell>{c.customer_name}</TableCell>
                  <TableCell><Badge variant="outline">{c.current_spend_class}</Badge></TableCell>
                  <TableCell>{c.branch}</TableCell>
                  <TableCell>{c.region}</TableCell>
                  <TableCell>${Number(c.annual_revenue).toLocaleString()}</TableCell>
                  <TableCell>{c.weeks_ordered}</TableCell>
                  <TableCell>{c.growth_rate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="skus" className="border rounded-lg mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>UOM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {skus?.filter((s) => !search || s.sku_code.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase())).map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-sm">{s.sku_code}</TableCell>
                  <TableCell>{s.description}</TableCell>
                  <TableCell>{s.category}</TableCell>
                  <TableCell>{s.unit_of_measure}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="thresholds" className="border rounded-lg mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Min Revenue</TableHead>
                <TableHead>Avg Revenue</TableHead>
                <TableHead>Max Revenue</TableHead>
                <TableHead>Min Weeks</TableHead>
                <TableHead>Avg Weeks</TableHead>
                <TableHead>Max Weeks</TableHead>
                <TableHead>Growth Threshold</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {thresholds?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell><Badge variant="outline">{t.class}</Badge></TableCell>
                  <TableCell>${Number(t.min_revenue).toLocaleString()}</TableCell>
                  <TableCell>${Number(t.avg_revenue).toLocaleString()}</TableCell>
                  <TableCell>${Number(t.max_revenue).toLocaleString()}</TableCell>
                  <TableCell>{t.min_weeks}</TableCell>
                  <TableCell>{t.avg_weeks}</TableCell>
                  <TableCell>{t.max_weeks}</TableCell>
                  <TableCell>{t.growth_threshold}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="governance" className="border rounded-lg mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request Type</TableHead>
                <TableHead>Band</TableHead>
                <TableHead>Threshold Range</TableHead>
                <TableHead>Required Approvers</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {governance?.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="text-sm">{g.request_type.replace(/_/g, " ")}</TableCell>
                  <TableCell><Badge variant="outline">{g.threshold_band}</Badge></TableCell>
                  <TableCell>
                    {g.threshold_min != null && g.threshold_max != null
                      ? `${g.threshold_min}% – ${g.threshold_max}%`
                      : g.threshold_min != null ? `> ${g.threshold_min}%` : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {g.required_approvers?.map((a, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{a}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{g.escalation_notes ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
