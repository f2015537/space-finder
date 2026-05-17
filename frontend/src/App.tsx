import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SpacesPage from "./pages/SpacesPage";
import CreateSpacePage from "./pages/CreateSpacePage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import { AuthService } from "./services/AuthService";
import { DataService } from "./services/DataService";
import "./App.css";

const authService = new AuthService();
const dataService = new DataService(authService);

function ProtectedRoute({
  username,
  authLoading,
  children,
}: {
  username: string | undefined;
  authLoading: boolean;
  children: React.ReactNode;
}) {
  if (authLoading) return null;
  if (!username) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  const [username, setUsername] = useState<string | undefined>(undefined);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    authService.getUsername().then((name) => {
      setUsername(name);
      setAuthLoading(false);
    });
  }, []);

  async function handleLogin(username: string, password: string) {
    await authService.login(username, password);
    setUsername(await authService.getUsername());
    navigate("/");
  }

  async function handleLogout() {
    await authService.logout();
    setUsername(undefined);
    navigate("/login");
  }

  return (
    <>
      <Navbar
        username={username}
        onLogin={() => navigate("/login")}
        onLogout={handleLogout}
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/spaces"
          element={
            <ProtectedRoute username={username} authLoading={authLoading}>
              <SpacesPage dataService={dataService} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/spaces/create"
          element={
            <ProtectedRoute username={username} authLoading={authLoading}>
              <CreateSpacePage dataService={dataService} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute username={username} authLoading={authLoading}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      </Routes>
    </>
  );
}

export default App;
