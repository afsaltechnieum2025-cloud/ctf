import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import KnowledgeBase from "./pages/KnowledgeBase";
import Users from "./pages/Users";
import CTF from "./pages/CTF";
import CourseTopics from "./pages/CourseTopics";
import CourseTopicDetail from "./pages/CourseTopicDetail";
import CourseTopicQuiz from "./pages/CourseTopicQuiz";
import ProductDetail from "./pages/ProductDetail";
import ProductMcqs from "./pages/ProductMcqs";
import ProductMcqTest from "./pages/ProductMcqTest";

const queryClient = new QueryClient();

function RedirectLegacyProductSlugToCourses() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/courses/${slug}`} replace />;
}

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
            <Route path="/courses/topics/:topicSlug/quiz" element={<ProtectedRoute><CourseTopicQuiz /></ProtectedRoute>} />
            <Route path="/courses/topics/:topicSlug" element={<ProtectedRoute><CourseTopicDetail /></ProtectedRoute>} />
            <Route path="/courses" element={<ProtectedRoute><CourseTopics /></ProtectedRoute>} />
            <Route path="/courses/:slug" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
            <Route path="/products" element={<Navigate to="/courses" replace />} />
            <Route
              path="/products/:slug"
              element={
                <ProtectedRoute>
                  <RedirectLegacyProductSlugToCourses />
                </ProtectedRoute>
              }
            />
            <Route path="/product-mcqs" element={<ProtectedRoute><ProductMcqs /></ProtectedRoute>} />
            <Route path="/product-mcqs/:slug" element={<ProtectedRoute><ProductMcqTest /></ProtectedRoute>} />
            <Route path="/product-course" element={<Navigate to="/courses" replace />} />
            <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;