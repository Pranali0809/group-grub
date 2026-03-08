import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Squads from "./pages/Squads";
import SquadDetail from "./pages/SquadDetail";
import Wishlist from "./pages/Wishlist";
import Voting from "./pages/Voting";
import Results from "./pages/Results";
import Hangouts from "./pages/Hangouts";
import Memories from "./pages/Memories";
import Profile from "./pages/Profile";
import Discover from "./pages/Discover";
import JoinGroup from "./pages/JoinGroup";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="mx-auto max-w-md min-h-screen">
            <Routes>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/join/:code" element={<JoinGroup />} />
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/squads" element={<ProtectedRoute><Squads /></ProtectedRoute>} />
              <Route path="/squads/:id" element={<ProtectedRoute><SquadDetail /></ProtectedRoute>} />
              <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
              <Route path="/voting/:sessionId" element={<ProtectedRoute><Voting /></ProtectedRoute>} />
              <Route path="/results/:sessionId" element={<ProtectedRoute><Results /></ProtectedRoute>} />
              <Route path="/hangouts" element={<ProtectedRoute><Hangouts /></ProtectedRoute>} />
              <Route path="/hangouts/:hangoutId/memories" element={<ProtectedRoute><Memories /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
