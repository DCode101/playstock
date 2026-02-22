import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-16 h-16 text-primary-600 animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">F1 PlayStock</h2>
        <p className="text-dark-400">Loading your racing portfolio...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
