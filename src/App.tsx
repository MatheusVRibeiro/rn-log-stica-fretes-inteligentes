import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Fretes from "./pages/Fretes";
import Caminhoes from "./pages/Caminhoes";
import Motoristas from "./pages/Motoristas";
import Mercadorias from "./pages/Mercadorias";
import Custos from "./pages/Custos";
import Relatorios from "./pages/Relatorios";
import Indicadores from "./pages/Indicadores";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/fretes" element={<Fretes />} />
          <Route path="/caminhoes" element={<Caminhoes />} />
          <Route path="/motoristas" element={<Motoristas />} />
          <Route path="/mercadorias" element={<Mercadorias />} />
          <Route path="/custos" element={<Custos />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/indicadores" element={<Indicadores />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
