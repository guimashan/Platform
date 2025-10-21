import { BrowserRouter, Routes, Route } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import CheckinPage from "@/pages/checkin";
import ServicePage from "@/pages/service";
import SchedulePage from "@/pages/schedule";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-base-100 flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/checkin" element={<CheckinPage />} />
                <Route path="/service" element={<ServicePage />} />
                <Route path="/schedule" element={<SchedulePage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
