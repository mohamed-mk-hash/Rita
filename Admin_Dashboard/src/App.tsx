import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { LanguageProvider } from "./i18n/LanguageContext";
import { AuthProvider } from "./auth/AuthContext";

import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { Login } from "./pages/Login";
import { Overview } from "./pages/Overview";
import { Applications } from "./pages/Applications";
import { ApplicationDetails } from "./pages/ApplicationDetails";
import { Documents } from "./pages/Documents";
import { ContactMessages } from "./pages/ContactMessages";

function AdminArea() {
  return (
    <ProtectedRoute>
      <Layout>
        <Routes>
          <Route index element={<Overview />} />

          <Route
            path="applications"
            element={<Applications />}
          />

          <Route
            path="applications/:id"
            element={<ApplicationDetails />}
          />

          <Route
            path="documents"
            element={<Documents />}
          />

          <Route
            path="messages"
            element={<ContactMessages />}
          />

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </Layout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter basename="/admin">
          <Routes>
            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/*"
              element={<AdminArea />}
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;