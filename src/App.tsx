import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { ActiveAccountProvider } from "@/auth/AuthProvider";
import { RequireAuth } from "@/auth/RequireAuth";
import NewCase from "@/pages/NewCase";
import Cases from "@/pages/Cases";
import CaseDetail from "@/pages/CaseDetail";
import ReferenceData from "@/pages/ReferenceData";
import Rules from "@/pages/Rules";
import Dashboard from "@/pages/Dashboard";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ActiveAccountProvider>
        <BrowserRouter>
          <RequireAuth>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/new-case" replace />} />
                <Route path="/new-case" element={<NewCase />} />
                <Route path="/cases" element={<Cases />} />
                <Route path="/cases/:id" element={<CaseDetail />} />
                <Route path="/reference-data" element={<ReferenceData />} />
                <Route path="/rules" element={<Rules />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin" element={<Admin />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RequireAuth>
        </BrowserRouter>
      </ActiveAccountProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
