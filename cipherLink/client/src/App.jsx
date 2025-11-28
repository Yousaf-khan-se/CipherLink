import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useEffect } from 'react';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';

// Components
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './components/auth/PublicRoute';
import { Toaster } from './components/ui/Toaster';

function App() {
    const { initialize, isLoading } = useAuthStore();

    useEffect(() => {
        initialize();
    }, [initialize]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-dark-400">Initializing secure connection...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Routes>
                {/* Public routes */}
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <LoginPage />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <PublicRoute>
                            <RegisterPage />
                        </PublicRoute>
                    }
                />

                {/* Protected routes */}
                <Route
                    path="/chat/*"
                    element={
                        <ProtectedRoute>
                            <ChatPage />
                        </ProtectedRoute>
                    }
                />

                {/* Redirect root to chat or login */}
                <Route path="/" element={<Navigate to="/chat" replace />} />

                {/* 404 */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <Toaster />
        </>
    );
}

export default App;
