import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import KnowledgeBase from "./pages/KnowledgeBase";
import Users from "./pages/Users";
import CTF from "./pages/CTF";
import ProductCourse from "./pages/ProductCourse";
import ProductDetail from "./pages/ProductDetail";
import ProductMcqs from "./pages/ProductMcqs";
import ProductMcqTest from "./pages/ProductMcqTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/knowledge-base" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
            <Route path="/ctf" element={<ProtectedRoute><CTF /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute><ProductCourse /></ProtectedRoute>} />
            <Route path="/products/:slug" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
            <Route path="/product-mcqs" element={<ProtectedRoute><ProductMcqs /></ProtectedRoute>} />
            <Route path="/product-mcqs/:slug" element={<ProtectedRoute><ProductMcqTest /></ProtectedRoute>} />
            <Route path="/product-course" element={<Navigate to="/products" replace />} />
            <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;