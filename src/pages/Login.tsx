import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Try autoplay on mount
  useEffect(() => {
    const playAudio = async () => {
      try {
        await audioRef.current?.play();
      } catch {
        // browser blocked autoplay
      }
    };
    playAudio();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* VIDEO */}
      <video autoPlay loop muted className="absolute w-full h-full object-cover">
        <source src="/f1bg.mp4" type="video/mp4" />
      </video>

      {/* AUDIO */}
      <audio ref={audioRef} autoPlay loop>
        <source src="/bgm.mp3" type="audio/mp3" />
      </audio>

      {/* OVERLAYS */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/35 via-red-800/25 to-black/50" />


      {/* RIGHT SIDE FORM */}
      <div className="relative z-10 flex justify-end items-center min-h-screen p-8">
        <div className="w-full max-w-md bg-black/60 backdrop-blur-xl border border-red-600/30 p-8 rounded-2xl shadow-2xl">

          <h2 className="text-4xl font-extrabold text-red-600 mb-2">
            ENTER GRID
          </h2>

          <p className="text-gray-400 mb-8">
            Access driver market
          </p>

          <form onSubmit={handleLogin} className="space-y-5">

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10"
                required
              />
            </div>

            <button className="btn-primary w-full text-lg py-3">
              {loading ? 'Entering...' : 'Enter Race'}
            </button>
          </form>

          <div className="mt-6 text-center text-gray-400">
            New here?{" "}
            <Link to="/signup" className="text-red-500 font-bold">
              Join the paddock
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
