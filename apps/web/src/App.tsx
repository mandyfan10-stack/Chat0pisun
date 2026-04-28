import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatApp from './pages/ChatApp';
import { useAuthStore } from './store/useStore';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const isHydrating = useAuthStore((state) => state.isHydrating);

  if (isHydrating) {
    return <div className="grid min-h-screen place-items-center text-sm text-gray-500">Loading session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function App() {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <ChatApp />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
