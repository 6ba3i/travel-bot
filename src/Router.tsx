import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useUser } from './contexts/AuthContext';

import SignUp     from './pages/SignUp';
import Login      from './pages/Login';
import Forgot     from './pages/Forgot';
import ChatLayout from './pages/ChatLayout';    // ← new
import { JSX } from 'react';

function Private({ children }: { children: JSX.Element }) {
  return useUser() ? children : <Navigate to="/login" replace />;
}

export default function Router() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login"  element={<Login />} />
          <Route path="/forgot" element={<Forgot />} />
          <Route path="/chat"   element={<Private><ChatLayout /></Private>} />
          <Route path="*"       element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
