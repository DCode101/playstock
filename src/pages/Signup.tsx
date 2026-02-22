import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { AlertCircle } from 'lucide-react';

const Signup: React.FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const tryPlay = async () => {
      try {
        await audioRef.current?.play();
      } catch {
        // autoplay blocked – ignore
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
      // 1. Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Set display name
      await updateProfile(user, { displayName: username });

      // 3. Create Firestore user document
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
    } catch (err: any) {
      console.error('Signup error:', err);
      // Show user-friendly message
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use. Please log in.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'permission-denied') {
        setError('Database permission denied. Contact support.');
      } else {
        setError(err.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <video autoPlay loop muted className="absolute w-full h-full object-cover">
        <source src="/f1bg.mp4" type="video/mp4" />
      </video>

      <audio ref={audioRef} autoPlay loop>
        <source src="/bgm.mp3" type="audio/mp3" />
      </audio>

      <div className="absolute inset-0 bg-gradient-to-br from-red-900/35 via-red-800/25 to-black/50" />

      <div className="relative z-10 flex justify-end items-center min-h-screen p-8">
        <div className="w-full max-w-md bg-black/60 backdrop-blur-xl border border-red-600/30 p-8 rounded-2xl shadow-2xl">
          <h2 className="text-4xl font-extrabold text-red-600 mb-2">JOIN GRID</h2>
          <p className="text-gray-400 mb-8">Create your driver portfolio</p>

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

            <button type="submit" className="btn-primary w-full text-lg py-3" disabled={loading}>
              {loading ? 'Joining...' : 'Join Race'}
            </button>
          </form>

          <div className="mt-6 text-center text-gray-400">
            Already in?{' '}
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