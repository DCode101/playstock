import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Activity, Trophy, BarChart3 } from 'lucide-react';
import PlaystockLogo from "../components/PlaystockLogo";

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">

      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/20 to-black pointer-events-none" />

      {/* LOGO */}
<div className="absolute top-6 left-8">
  <PlaystockLogo />
</div>


      {/* HERO SECTION */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 pt-24 pb-10 text-center">

        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
          Trade F1 Drivers<br />
          <span className="text-red-600">Like Stocks</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10">
          Buy, sell, and track Formula 1 drivers based on real race performance,
          live telemetry, and position changes.
        </p>

        <div className="flex gap-6 justify-center mb-16">
          <Link
            to="/signup"
            className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-xl font-semibold transition-all"
          >
            Start Trading
          </Link>

          <Link
            to="/login"
            className="border border-gray-700 hover:border-red-600 px-8 py-4 rounded-xl transition-all"
          >
            Login
          </Link>
        </div>

        {/* FEATURE CARDS — TAILORMADE */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl w-full">

          {/* CARD 1 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-red-600/40 transition-all backdrop-blur">
            <TrendingUp className="w-10 h-10 text-red-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Live Driver Prices</h3>
            <p className="text-gray-400 text-sm">
              Driver values change in real-time based on overtakes,
              positions, and performance.
            </p>
          </div>

          {/* CARD 2 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-red-600/40 transition-all backdrop-blur">
            <Activity className="w-10 h-10 text-red-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Telemetry Driven</h3>
            <p className="text-gray-400 text-sm">
              Speed, throttle, braking, and sector data influence
              market movement.
            </p>
          </div>

          {/* CARD 3 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-red-600/40 transition-all backdrop-blur">
            <BarChart3 className="w-10 h-10 text-red-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Build Portfolio</h3>
            <p className="text-gray-400 text-sm">
              Invest in drivers and grow your net worth based on
              race outcomes.
            </p>
          </div>

          {/* CARD 4 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-red-600/40 transition-all backdrop-blur">
            <Trophy className="w-10 h-10 text-red-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Climb Leaderboards</h3>
            <p className="text-gray-400 text-sm">
              Compete globally and prove you’re the smartest F1 investor.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LandingPage;
