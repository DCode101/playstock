import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './services/firebase';
import { useAppStore } from './store/appStore';
import { initializeDatabase, fetchDrivers, fetchSchedule } from './services/dataService';

// Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Market from './pages/Market';
import Portfolio from './pages/Portfolio';
import LiveRace from './pages/LiveRace';
import Schedule from './pages/Schedule';
import Leaderboard from './pages/Leaderboard';
import Analytics from './pages/Analytics';
import Games from './pages/Games';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Components
import Navbar from './components/Navbar';
import LoadingScreen from './components/LoadingScreen';

const App: React.FC = () => {
  const { user, setUser, isLoading, setIsLoading, setDrivers, setRaces } = useAppStore();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      
      // Initialize database with drivers and schedule
      await initializeDatabase();
      
      // Load drivers and schedule
      const drivers = await fetchDrivers();
      const schedule = await fetchSchedule();
      
      setDrivers(drivers);
      setRaces(schedule);
      
      // Check auth state
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            // Fetch user data from Firestore
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUser({
                uid: firebaseUser.uid,
                username: userData.username || firebaseUser.displayName || 'Player',
                email: firebaseUser.email || '',
                balance: userData.balance || 100000,
                portfolio: userData.portfolio || [],
                netWorth: userData.netWorth || 100000,
                totalReturn: userData.totalReturn || 0,
                totalReturnPercent: userData.totalReturnPercent || 0,
                referralCode: userData.referralCode || '',
                redeemedReferrals: userData.redeemedReferrals || [],
                netWorthHistory: userData.netWorthHistory || [],
                hasCompletedTutorial: userData.hasCompletedTutorial || false,
                createdAt: userData.createdAt || Date.now(),
              });
            } else {
              // Create new user document if doesn't exist
              const newUser = {
                uid: firebaseUser.uid,
                username: firebaseUser.displayName || 'Player',
                email: firebaseUser.email || '',
                balance: 100000,
                portfolio: [],
                netWorth: 100000,
                totalReturn: 0,
                totalReturnPercent: 0,
                referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                redeemedReferrals: [],
                netWorthHistory: [{ timestamp: Date.now(), value: 100000 }],
                hasCompletedTutorial: false,
                createdAt: Date.now(),
              };
              
              await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
              setUser(newUser);
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        } else {
          setUser(null);
        }
        
        setAuthChecked(true);
        setIsLoading(false);
      });

      return () => unsubscribe();
    };

    initApp();
  }, [setUser, setIsLoading, setDrivers, setRaces]);

  if (!authChecked || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Animated background particles */}
      <div className="particles fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      {user && <Navbar />}
      
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" /> : <LandingPage />} 
        />
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" /> : <Login />} 
        />
        <Route 
          path="/signup" 
          element={user ? <Navigate to="/dashboard" /> : <Signup />} 
        />
        
        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/market"
          element={user ? <Market /> : <Navigate to="/login" />}
        />
        <Route
          path="/portfolio"
          element={user ? <Portfolio /> : <Navigate to="/login" />}
        />
        <Route
          path="/live"
          element={user ? <LiveRace /> : <Navigate to="/login" />}
        />
        <Route
          path="/schedule"
          element={user ? <Schedule /> : <Navigate to="/login" />}
        />
        <Route
          path="/leaderboard"
          element={user ? <Leaderboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/analytics"
          element={user ? <Analytics /> : <Navigate to="/login" />}
        />
        <Route
          path="/games"
          element={user ? <Games /> : <Navigate to="/login" />}
        />
        
        {/* 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

export default App;