import React, { useEffect, useState } from 'react';
import { Trophy, Medal, TrendingUp, Crown, Flame, Zap, DollarSign, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

interface LeaderboardUser {
  rank: number;
  userId: string;
  username: string;
  initialCapital: number;
  currentNetWorth: number;
  profit: number;
  profitPercent: number;
  balance: number;
  portfolioValue: number;
  avatar?: string;
}

const Leaderboard: React.FC = () => {
  const { user } = useAppStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    fetchLeaderboard();
  }, [user]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);

      const users = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Calculate portfolio value
        const portfolioValue = (data.portfolio || []).reduce((sum: number, item: any) => {
          return sum + (item.totalValue || 0);
        }, 0);

        const currentNetWorth = (data.balance || 100000) + portfolioValue;
        const initialCapital = 100000; // Everyone starts with $100,000
        const profit = currentNetWorth - initialCapital;
        const profitPercent = (profit / initialCapital) * 100;

        return {
          userId: doc.id,
          username: data.username || 'Anonymous',
          initialCapital,
          currentNetWorth,
          profit,
          profitPercent,
          balance: data.balance || 100000,
          portfolioValue,
          avatar: data.avatar || generateAvatar(data.username || 'A')
        };
      });

      // Add mock users if none exist
      if (users.length === 0) {
        const mockUsers = [
          {
            userId: 'mock1',
            username: 'RaceMaster',
            initialCapital: 100000,
            currentNetWorth: 158000,
            profit: 58000,
            profitPercent: 58,
            balance: 45000,
            portfolioValue: 113000,
            avatar: '🏎️'
          },
          {
            userId: 'mock2',
            username: 'SpeedDemon',
            initialCapital: 100000,
            currentNetWorth: 142000,
            profit: 42000,
            profitPercent: 42,
            balance: 38000,
            portfolioValue: 104000,
            avatar: '⚡'
          },
          {
            userId: 'mock3',
            username: 'PitStopPro',
            initialCapital: 100000,
            currentNetWorth: 135000,
            profit: 35000,
            profitPercent: 35,
            balance: 42000,
            portfolioValue: 93000,
            avatar: '🔧'
          },
          {
            userId: 'mock4',
            username: 'RookieRacer',
            initialCapital: 100000,
            currentNetWorth: 89000,
            profit: -11000,
            profitPercent: -11,
            balance: 65000,
            portfolioValue: 24000,
            avatar: '🆕'
          },
          {
            userId: 'mock5',
            username: 'VeteranInvestor',
            initialCapital: 100000,
            currentNetWorth: 121000,
            profit: 21000,
            profitPercent: 21,
            balance: 31000,
            portfolioValue: 90000,
            avatar: '👑'
          }
        ];
        users.push(...mockUsers);
      }

      // Sort by profit (highest first)
      const sortedUsers = users.sort((a, b) => b.profit - a.profit);

      // Add ranks
      const rankedUsers: LeaderboardUser[] = sortedUsers.map((u, index) => ({
        ...u,
        rank: index + 1
      }));

      setLeaderboard(rankedUsers);

      // Find current user's rank
      if (user) {
        const currentUser = rankedUsers.find(u => u.userId === user.uid);
        if (currentUser) {
          setUserRank(currentUser);
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAvatar = (name: string) => {
    const emojis = ['🏎️', '🏁', '🏆', '⚡', '🔥', '💎', '👑', '🎯', '🚀', '💰'];
    return emojis[name.charCodeAt(0) % emojis.length];
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-500" />;
    return null;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'from-yellow-500/30 to-yellow-600/20 border-yellow-500/50';
    if (rank === 2) return 'from-gray-400/30 to-gray-500/20 border-gray-400/50';
    if (rank === 3) return 'from-orange-500/30 to-orange-600/20 border-orange-500/50';
    return 'from-racing-gray to-racing-black border-racing-red/20';
  };

  const getProfitBadge = (profit: number) => {
    if (profit >= 50000) return { text: 'ELITE TRADER', color: 'from-purple-500 to-pink-500' };
    if (profit >= 25000) return { text: 'PRO TRADER', color: 'from-blue-500 to-cyan-500' };
    if (profit >= 10000) return { text: 'SKILLED', color: 'from-green-500 to-emerald-500' };
    if (profit >= 0) return { text: 'BREAK EVEN', color: 'from-yellow-500 to-orange-500' };
    return { text: 'LEARNING', color: 'from-red-500 to-red-600' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-16 h-16 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading Leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 lg:p-8 relative">
      <div className="racing-stripes fixed inset-0 opacity-20 pointer-events-none" />
      
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="racing-header mb-4">
            PROFIT LEADERBOARD
          </h1>
          <p className="text-gray-400 text-lg">Top traders ranked by actual profits made</p>
          
          {/* Timeframe Selector */}
          <div className="flex gap-2 mt-4">
            {['all', 'week', 'month'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf as any)}
                className={`px-4 py-2 rounded-lg font-bold uppercase text-sm transition ${
                  timeframe === tf
                    ? 'bg-racing-red text-white'
                    : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                }`}
              >
                {tf === 'all' ? 'All Time' : tf === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* User's Rank Card */}
        {userRank && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card mb-8 bg-gradient-to-br from-racing-red/20 to-racing-darkRed/20 border-racing-red/50 glow-effect"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-racing-red to-racing-darkRed rounded-full flex items-center justify-center text-4xl border-4 border-white shadow-lg">
                  {userRank.avatar}
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1 uppercase tracking-wide">Your Rank</p>
                  <div className="flex items-center gap-3">
                    <p className="text-4xl font-black text-white">#{userRank.rank}</p>
                    {userRank.rank <= 10 && <Flame className="w-8 h-8 text-orange-500 animate-pulse" />}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm mb-1 uppercase tracking-wide">Total Profit</p>
                <p className={`text-3xl font-black ${userRank.profit >= 0 ? 'text-green-400' : 'text-red-400'} neon-text`}>
                  {userRank.profit >= 0 ? '+' : ''}${userRank.profit.toLocaleString()}
                </p>
                <p className={`text-lg font-bold ${userRank.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ({userRank.profitPercent.toFixed(2)}%)
                </p>
              </div>
            </div>
            
            {/* Badge */}
            <div className="mt-4">
              <span className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${getProfitBadge(userRank.profit).color} text-white text-sm font-bold`}>
                {getProfitBadge(userRank.profit).text}
              </span>
            </div>
          </motion.div>
        )}

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {/* 2nd Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`card bg-gradient-to-br ${getRankBg(2)} order-1 md:order-1 md:mt-8`}
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center mb-3">
                  <Medal className="w-12 h-12 text-gray-300" />
                </div>
                <div className="text-6xl mb-3">{leaderboard[1].avatar}</div>
                <h3 className="text-xl font-black text-white mb-2 uppercase">{leaderboard[1].username}</h3>
                <p className="text-2xl font-black text-gradient mb-1">${leaderboard[1].currentNetWorth.toLocaleString()}</p>
                <p className={`text-lg font-bold ${leaderboard[1].profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {leaderboard[1].profit >= 0 ? '+' : ''}${leaderboard[1].profit.toLocaleString()} ({leaderboard[1].profitPercent.toFixed(2)}%)
                </p>
              </div>
            </motion.div>

            {/* 1st Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`card bg-gradient-to-br ${getRankBg(1)} order-2 md:order-2 glow-effect`}
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center mb-3 animate-bounce">
                  <Crown className="w-16 h-16 text-yellow-400" />
                </div>
                <div className="text-7xl mb-3">{leaderboard[0].avatar}</div>
                <h3 className="text-2xl font-black text-white mb-2 uppercase neon-text">{leaderboard[0].username}</h3>
                <p className="text-3xl font-black text-gradient mb-1">${leaderboard[0].currentNetWorth.toLocaleString()}</p>
                <p className={`text-xl font-bold ${leaderboard[0].profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  +${leaderboard[0].profit.toLocaleString()} ({leaderboard[0].profitPercent.toFixed(2)}%)
                </p>
              </div>
            </motion.div>

            {/* 3rd Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`card bg-gradient-to-br ${getRankBg(3)} order-3 md:order-3 md:mt-8`}
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center mb-3">
                  <Medal className="w-12 h-12 text-orange-500" />
                </div>
                <div className="text-6xl mb-3">{leaderboard[2].avatar}</div>
                <h3 className="text-xl font-black text-white mb-2 uppercase">{leaderboard[2].username}</h3>
                <p className="text-2xl font-black text-gradient mb-1">${leaderboard[2].currentNetWorth.toLocaleString()}</p>
                <p className={`text-lg font-bold ${leaderboard[2].profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {leaderboard[2].profit >= 0 ? '+' : ''}${leaderboard[2].profit.toLocaleString()} ({leaderboard[2].profitPercent.toFixed(2)}%)
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Rest of Rankings */}
        <div className="space-y-3">
          <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-wide">All Traders</h2>
          
          {leaderboard.length === 0 ? (
            <div className="card text-center py-12">
              <Zap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-xl">No traders yet. Be the first!</p>
            </div>
          ) : (
            leaderboard.slice(3).map((player, index) => (
              <motion.div
                key={player.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (index + 3) * 0.03 }}
                className={`card-hover ${player.userId === user?.uid ? 'border-racing-red/60 bg-racing-red/10' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-racing-black rounded-full flex items-center justify-center font-black text-white text-lg border-2 border-racing-red/30">
                    {player.rank}
                  </div>
                  <div className="text-4xl">{player.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-white uppercase truncate">
                      {player.username}
                      {player.userId === user?.uid && <span className="text-racing-red ml-2">(You)</span>}
                    </h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-400">Balance: ${player.balance.toLocaleString()}</span>
                      <span className="text-gray-400">Portfolio: ${player.portfolioValue.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-white">${player.currentNetWorth.toLocaleString()}</p>
                    <div className={`flex items-center justify-end gap-1 text-sm font-bold ${player.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {player.profit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {player.profit >= 0 ? '+' : ''}{player.profitPercent.toFixed(2)}%
                    </div>
                    <p className={`text-xs ${player.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {player.profit >= 0 ? '+' : ''}${player.profit.toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 p-4 bg-dark-800/50 rounded-lg"
        >
          <p className="text-gray-400 text-sm text-center">
            <span className="text-yellow-400 font-bold">Note:</span> Leaderboard is ranked by total profit made (Current Net Worth - Initial Capital of $100,000)
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Leaderboard;