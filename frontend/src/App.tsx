import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getAppTheme } from './theme/theme';
import { useAppAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Route-level code splitting using React.lazy (Vite React Best Practice)
const LoginPage = lazy(() => import('./pages/LoginPage'));
const CallbackPage = lazy(() => import('./pages/CallbackPage'));
const CollectionsPage = lazy(() => import('./pages/CollectionsPage'));
const CollectionDetailPage = lazy(() => import('./pages/CollectionDetailPage'));
const BookmarksPage = lazy(() => import('./pages/BookmarksPage'));
const AllPage = lazy(() => import('./pages/AllPage'));
const SharedCollectionPage = lazy(() => import('./pages/SharedCollectionPage'));

export const App: React.FC = () => {
  const { themeMode } = useAppAuth();
  const theme = getAppTheme(themeMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Suspense fallback={<LoadingSpinner message="Loading application page..." />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/callback" element={<CallbackPage />} />
          <Route path="/share/:token" element={<SharedCollectionPage />} />

          {/* Protected Routes */}
          <Route
            path="/collections"
            element={
              <ProtectedRoute>
                <Layout>
                  <CollectionsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/collections/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <CollectionDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookmarks"
            element={
              <ProtectedRoute>
                <Layout>
                  <BookmarksPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/all"
            element={
              <ProtectedRoute>
                <Layout>
                  <AllPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/collections" replace />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
};
