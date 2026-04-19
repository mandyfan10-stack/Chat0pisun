import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatApp from './pages/ChatApp';
import { useAuthStore } from './store/useStore';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthStore();
  // Basic check, in reality should also verify token validity
  if (!user && !token && !localStorage.getItem('token')) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
}

function App() {
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
