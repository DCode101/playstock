import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Loader2, AlertCircle } from 'lucide-react';

const Signup: React.FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Try to autoplay audio when page loads
  useEffect(() => {
    const tryPlay = async () => {
      try {
        await audioRef.current?.play();
      } catch {
        // browser may block autoplay — that's normal
      }
    };
    tryPlay();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: username });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        username,
        email,
        balance: 100000,
        portfolio: [],
        netWorth: 100000,
        hasCompletedTutorial: false,
        createdAt: Date.now(),
      });

      navigate('/dashboard');
    } catch {
      setError('Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* VIDEO BACKGROUND */}
      <video autoPlay loop muted className="absolute w-full h-full object-cover">
        <source src="/f1bg.mp4" type="video/mp4" />
      </video>

      {/* CUSTOM AUDIO */}
      <audio ref={audioRef} autoPlay loop>
        <source src="/bgm.mp3" type="audio/mp3" />
      </audio>

      {/* OVERLAYS */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/35 via-red-800/25 to-black/50" />

      {/* FORM */}
      <div className="relative z-10 flex justify-end items-center min-h-screen p-8">
        <div className="w-full max-w-md bg-black/60 backdrop-blur-xl border border-red-600/30 p-8 rounded-2xl shadow-2xl">

          <h2 className="text-4xl font-extrabold text-red-600 mb-2">
            JOIN GRID
          </h2>

          <p className="text-gray-400 mb-8">
            Create your driver portfolio
          </p>

          <form onSubmit={handleSignup} className="space-y-5">

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              required
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              required
            />

            <button className="btn-primary w-full text-lg py-3">
              {loading ? 'Joining...' : 'Join Race'}
            </button>
          </form>

          <div className="mt-6 text-center text-gray-400">
            Already in?{" "}
            <Link to="/login" className="text-red-500 font-bold">
              Enter grid
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Signup;
