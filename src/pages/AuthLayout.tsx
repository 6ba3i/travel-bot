import React, { ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  children: ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ title, children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-800/50 p-8">
          <h2 className="text-3xl font-bold text-white text-center mb-8">{title}</h2>
          <div className="space-y-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;