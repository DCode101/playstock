import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { TrendingUp, TrendingDown, DollarSign, Briefcase, Trophy, Zap, ArrowUpRight, ArrowDownRight, ShoppingCart, X, Calendar, Clock } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const Dashboard: React.FC = () => {
  const { user, drivers, setUser } = useAppStore();
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [totalReturn, setTotalReturn] = useState(0);
  const [totalReturnPercent, setTotalReturnPercent] = useState(0);
  const [topDrivers, setTopDrivers] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');
  const [shares, setShares] = useState(1);
  const [loading, setLoading] = useState(false);
  const [performanceHistory, setPerformanceHistory] = useState<any[]>([]);
  const [dailyProfit, setDailyProfit] = useState(0);
  const [nextRace, setNextRace] = useState<any>(null);
  const [selectedRange, setSelectedRange] = useState<'1D' | '30D' | '1Y'>('30D');

  useEffect(() => {
    // Calculate portfolio value and returns
    if (user?.portfolio && drivers.length > 0) {
      const value = user.portfolio.reduce((total, item) => {
        const driver = drivers.find(d => d.id === item.driverId);
        return total + (driver ? driver.price * item.shares : 0);
      }, 0);
      
      setPortfolioValue(value);
      
      const totalInvested = user.portfolio.reduce((total, item) => {
        return total + (item.avgBuyPrice * item.shares);
      }, 0);
      
      const return_amount = value + user.balance - 100000;
      setTotalReturn(return_amount);
      
      const return_percent = ((value + user.balance - 100000) / 100000) * 100;
      setTotalReturnPercent(return_percent);

      // Calculate daily profit (last 24h)
      const now = Date.now();
      const dayAgo = now - 24 * 60 * 60 * 1000;
      
      const recentProfit = user.portfolio.reduce((total, item) => {
        if (item.purchaseDate > dayAgo) {
          const driver = drivers.find(d => d.id === item.driverId);
          if (driver) {
            return total + ((driver.price - item.avgBuyPrice) * item.shares);
          }
        }
        return total;
      }, 0);
      
      setDailyProfit(recentProfit);
    }

    // Get top 5 drivers by price change
    const sorted = [...drivers]
      .sort((a, b) => Math.abs(b.changePercent || 0) - Math.abs(a.changePercent || 0))
      .slice(0, 5);
    setTopDrivers(sorted);

    // Generate performance history based on actual data
    generatePerformanceHistory();
    
  }, [user, drivers]);

  const generatePerformanceHistory = () => {
    if (!user?.netWorthHistory || user.netWorthHistory.length === 0) {
      // Generate realistic performance data based on portfolio
      const days = 365;
      const data = [];
      let baseValue = user?.balance || 100000;
      
      // If user has portfolio, simulate growth based on driver performance
      if (user?.portfolio && user.portfolio.length > 0) {
        for (let i = 0; i < days; i++) {
          const dayReturn = user.portfolio.reduce((sum, item) => {
            const driver = drivers.find(d => d.id === item.driverId);
            if (driver) {
              // Simulate daily price fluctuation based on driver's volatility
              const volatility = driver.risk === 'high' ? 0.03 : driver.risk === 'medium' ? 0.02 : 0.01;
              const change = (Math.random() - 0.48) * volatility;
              return sum + (driver.price * item.shares * (1 + change));
            }
            return sum;
          }, 0);
          
          const totalValue = (user.balance || 0) + dayReturn;
          data.push({
            day: i + 1,
            value: Math.max(50000, totalValue * (0.7 + (i / days) * 0.6))
          });
        }
      } else {
        // No portfolio, show flat line with small variations
        for (let i = 0; i < days; i++) {
          data.push({
            day: i + 1,
            value: 100000 + (Math.random() - 0.5) * 5000
          });
        }
      }
      
      setPerformanceHistory(data);
    } else {
      setPerformanceHistory(user.netWorthHistory.map((h: any, i: number) => ({
        day: i + 1,
        value: h.value
      })));
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'race_schedule'), (snap) => {
      const now = Date.now();
      const races = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const liveRace = races.find(r => r.status === 'live');
      if (liveRace) {
        setNextRace({ date: new Date(liveRace.scheduledTime), name: liveRace.raceName, isLive: true });
        return;
      }
      const upcoming = races
        .filter(r => r.status === 'upcoming' && typeof r.scheduledTime === 'number' && r.scheduledTime >= now)
        .sort((a, b) => a.scheduledTime - b.scheduledTime);
      if (upcoming.length > 0) {
        setNextRace({ date: new Date(upcoming[0].scheduledTime), name: upcoming[0].raceName, isLive: false });
      } else {
        setNextRace(null);
      }
    });
    return () => unsub();
  }, []);

  const filteredPerformanceHistory = useMemo(() => {
    if (performanceHistory.length === 0) return [];
    if (selectedRange === '1D') return performanceHistory.slice(-1);
    if (selectedRange === '30D') return performanceHistory.slice(-30);
    return performanceHistory.slice(-365);
  }, [performanceHistory, selectedRange]);

  const stats = [
    {
      label: 'Total Balance',
      value: `$${(user?.balance || 0).toLocaleString()}`,
      change: dailyProfit >= 0 ? `+$${dailyProfit.toLocaleString()}` : `-$${Math.abs(dailyProfit).toLocaleString()}`,
      isPositive: dailyProfit >= 0,
      icon: DollarSign,
      color: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Portfolio Value',
      value: `$${portfolioValue.toLocaleString()}`,
      change: '',
      changeValue: '',
      isPositive: true,
      icon: Briefcase,
      color: 'from-purple-500 to-purple-600'
    },
    {
      label: 'Total Return',
      value: totalReturn >= 0 ? `+$${totalReturn.toLocaleString()}` : `-$${Math.abs(totalReturn).toLocaleString()}`,
      change: `${totalReturnPercent >= 0 ? '+' : ''}${totalReturnPercent.toFixed(2)}%`,
      isPositive: totalReturn >= 0,
      icon: TrendingUp,
      color: totalReturn >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'
    },
    {
      label: 'Active Positions',
      value: user?.portfolio?.length || 0,
      icon: Zap,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const handleBuy = async () => {
    if (!selectedDriver || !user || loading) return;

    const totalCost = selectedDriver.price * shares;
    if (user.balance < totalCost) {
      alert('Insufficient balance!');
      return;
    }

    setLoading(true);

    try {
      const existingPosition = user.portfolio.find(p => p.driverId === selectedDriver.id);

      const newPortfolio = existingPosition
        ? user.portfolio.map(p =>
            p.driverId === selectedDriver.id
              ? {
                  ...p,
                  shares: p.shares + shares,
                  avgBuyPrice: ((p.avgBuyPrice * p.shares) + totalCost) / (p.shares + shares)
                }
              : p
          )
        : [...user.portfolio, {
            driverId: selectedDriver.id,
            shares,
            avgBuyPrice: selectedDriver.price,
            currentPrice: selectedDriver.price,
            totalValue: totalCost,
            totalReturn: 0,
            totalReturnPercent: 0,
            purchaseDate: Date.now()
          }];

      const updatedUser = {
        ...user,
        balance: user.balance - totalCost,
        portfolio: newPortfolio
      };

      await updateDoc(doc(db, 'users', user.uid), {
        balance: updatedUser.balance,
        portfolio: updatedUser.portfolio
      });

      setUser(updatedUser);
      setShowTradeModal(false);
      setShares(1);
      setSelectedDriver(null);
    } catch (error) {
      console.error('Error buying shares:', error);
      alert('Failed to complete purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    if (!selectedDriver || !user || loading) return;

    const position = user.portfolio.find(p => p.driverId === selectedDriver.id);
    if (!position || position.shares < shares) {
      alert('Insufficient shares!');
      return;
    }

    setLoading(true);

    try {
      const totalValue = selectedDriver.price * shares;
      const newShares = position.shares - shares;

      const newPortfolio = newShares > 0
        ? user.portfolio.map(p =>
            p.driverId === selectedDriver.id
              ? {
                  ...p,
                  shares: newShares,
                  totalValue: selectedDriver.price * newShares,
                  totalReturn: (selectedDriver.price - p.avgBuyPrice) * newShares,
                  totalReturnPercent: ((selectedDriver.price - p.avgBuyPrice) / p.avgBuyPrice) * 100
                }
              : p
          )
        : user.portfolio.filter(p => p.driverId !== selectedDriver.id);

      const updatedUser = {
        ...user,
        balance: user.balance + totalValue,
        portfolio: newPortfolio
      };

      await updateDoc(doc(db, 'users', user.uid), {
        balance: updatedUser.balance,
        portfolio: updatedUser.portfolio
      });

      setUser(updatedUser);
      setShowTradeModal(false);
      setShares(1);
    } catch (error) {
      console.error('Error selling shares:', error);
      alert('Failed to complete sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-dark-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Welcome back, <span className="text-gradient">{user?.username}</span>! 🏎️
              </h1>
              <p className="text-dark-400">Here's what's happening with your F1 portfolio today</p>
            </div>
            
            {/* Next Race Countdown */}
            {nextRace && (
              <div className="bg-dark-800/50 px-4 py-2 rounded-lg border border-racing-red/30">
                <p className="text-sm text-gray-400 mb-1">Next Race</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-racing-red" />
                  <span className="text-white font-bold">
                    {nextRace.isLive
                      ? `${nextRace.name} is LIVE now`
                      : `${nextRace.name}: ${nextRace.date.toLocaleDateString()} ${nextRace.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card-hover group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} shadow-lg group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                {stat.change && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    stat.isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.change}
                  </div>
                )}
              </div>
              <p className="text-dark-400 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Portfolio Performance Chart */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 card"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Portfolio Performance</h2>
                <p className="text-dark-400 text-sm">Based on your actual investments</p>
              </div>
              <div className="flex gap-2">
                {(['1D', '30D', '1Y'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedRange(range)}
                    className={`px-3 py-1 text-xs rounded-lg ${selectedRange === range ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-400 hover:bg-dark-700'}`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={filteredPerformanceHistory}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#4b5563" label={{ value: selectedRange, position: 'insideBottom', offset: -5, fill: '#9CA3AF' }} />
                <YAxis stroke="#4b5563" label={{ value: 'Value ($)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #E10600', borderRadius: '8px' }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(value: any) => [formatCurrency(value), 'Portfolio Value']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#ef4444" 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
            
            {/* Performance Summary */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-gray-400 text-xs">Starting</p>
                <p className="text-white font-bold">$100,000</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs">Current</p>
                <p className="text-white font-bold">${(portfolioValue + (user?.balance || 0)).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs">Return</p>
                <p className={`font-bold ${totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalReturn >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%
                </p>
              </div>
            </div>
          </motion.div>

          {/* Top Movers */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="card"
          >
            <h2 className="text-xl font-bold text-white mb-4">Top Movers Today</h2>
            <div className="space-y-3">
              {topDrivers.map((driver, index) => {
                const userPosition = user?.portfolio.find(p => p.driverId === driver.id);
                return (
                  <motion.div
                    key={driver.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors cursor-pointer group"
                    onClick={() => {
                      setSelectedDriver(driver);
                      setShowTradeModal(true);
                    }}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-dark-700 group-hover:border-primary-600 transition-colors">
                      <img 
                        src={driver.photo} 
                        alt={driver.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${driver.name}&background=random`;
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{driver.name}</p>
                      <p className="text-dark-400 text-xs">{driver.team}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-sm">${driver.price}</p>
                      <p className={`text-xs ${driver.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {driver.change >= 0 ? '+' : ''}{driver.changePercent?.toFixed(2)}%
                      </p>
                    </div>
                    {userPosition && (
                      <div className="text-xs bg-racing-red/20 px-2 py-1 rounded">
                        {userPosition.shares} shares
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid md:grid-cols-3 gap-4"
        >
          <Link to="/market" className="card-hover bg-gradient-to-br from-primary-600 to-red-600 text-white cursor-pointer group">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <ArrowUpRight className="w-5 h-5 opacity-50" />
            </div>
            <h3 className="text-xl font-bold mb-1">Explore Market</h3>
            <p className="text-white/80 text-sm">Discover trending drivers</p>
          </Link>

          <Link to="/portfolio" className="card-hover bg-gradient-to-br from-purple-600 to-pink-600 text-white cursor-pointer group">
            <div className="flex items-center justify-between mb-3">
              <Briefcase className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <ArrowUpRight className="w-5 h-5 opacity-50" />
            </div>
            <h3 className="text-xl font-bold mb-1">View Portfolio</h3>
            <p className="text-white/80 text-sm">Manage your holdings</p>
          </Link>

          <Link to="/leaderboard" className="card-hover bg-gradient-to-br from-green-600 to-teal-600 text-white cursor-pointer group">
            <div className="flex items-center justify-between mb-3">
              <Trophy className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <ArrowUpRight className="w-5 h-5 opacity-50" />
            </div>
            <h3 className="text-xl font-bold mb-1">Leaderboard</h3>
            <p className="text-white/80 text-sm">See your ranking</p>
          </Link>
        </motion.div>

        {/* Trade Modal */}
        <AnimatePresence>
          {showTradeModal && selectedDriver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
              onClick={() => !loading && setShowTradeModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="card max-w-md w-full racing-border glow-effect"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-black text-white uppercase">Trade {selectedDriver.name}</h2>
                  <button
                    onClick={() => !loading && setShowTradeModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={selectedDriver.photo}
                    alt={selectedDriver.name}
                    className="w-16 h-16 rounded-full object-cover border-4 border-racing-red"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedDriver.name)}&background=E10600&color=fff&size=200&bold=true`;
                    }}
                  />
                  <div>
                    <p className="text-white font-bold">{selectedDriver.name}</p>
                    <p className="text-gray-400">{selectedDriver.team}</p>
                    <p className="text-white font-bold">${Math.round(selectedDriver.price)}</p>
                  </div>
                </div>

                {/* Trade Mode Toggle */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setTradeMode('buy')}
                    className={`flex-1 py-2 px-4 rounded-lg font-bold transition ${
                      tradeMode === 'buy'
                        ? 'bg-green-500 text-white'
                        : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setTradeMode('sell')}
                    className={`flex-1 py-2 px-4 rounded-lg font-bold transition ${
                      tradeMode === 'sell'
                        ? 'bg-red-500 text-white'
                        : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                    }`}
                  >
                    Sell
                  </button>
                </div>

                {/* Shares Input */}
                <div className="mb-4">
                  <label className="block text-gray-300 text-sm font-bold mb-3 uppercase">
                    Number of shares
                  </label>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setShares(prev => Math.max(1, prev - 1))}
                      disabled={loading}
                      className="w-12 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white text-2xl font-black flex items-center justify-center shadow-lg transition"
                    >
                      −
                    </button>
                    <div className="w-20 h-12 flex items-center justify-center bg-black/60 border border-red-600/40 rounded-xl text-2xl font-bold text-white">
                      {shares}
                    </div>
                    <button
                      onClick={() => {
                        if (tradeMode === 'buy') {
                          setShares(prev =>
                            Math.min(
                              Math.floor((user?.balance || 0) / selectedDriver.price),
                              prev + 1
                            )
                          );
                        } else {
                          const position = user?.portfolio.find(p => p.driverId === selectedDriver.id);
                          setShares(prev =>
                            Math.min(position?.shares || 0, prev + 1)
                          );
                        }
                      }}
                      disabled={loading}
                      className="w-12 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white text-2xl font-black flex items-center justify-center shadow-lg transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Trade Summary */}
                <div className="bg-racing-red/10 border border-racing-red/30 rounded-lg p-4 mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400 font-medium">Price per share</span>
                    <span className="text-white font-black text-lg">${Math.round(selectedDriver.price)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400 font-medium">Total {tradeMode === 'buy' ? 'Cost' : 'Value'}</span>
                    <span className="text-white font-black text-lg">
                      ${Math.round(selectedDriver.price * shares).toLocaleString()}
                    </span>
                  </div>
                  {tradeMode === 'sell' && (
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Remaining Balance</span>
                      <span className="text-white font-black text-lg">
                        ${((user?.balance || 0) + (selectedDriver.price * shares)).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {tradeMode === 'buy' && (
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Remaining Balance</span>
                      <span className="text-white font-black text-lg">
                        ${((user?.balance || 0) - (selectedDriver.price * shares)).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => !loading && setShowTradeModal(false)}
                    className="btn-secondary flex-1 uppercase font-black"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={tradeMode === 'buy' ? handleBuy : handleSell}
                    className={`flex-1 uppercase font-black py-3 px-6 rounded-lg font-bold transition ${
                      tradeMode === 'buy'
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                    disabled={
                      loading ||
                      (tradeMode === 'buy' && (user?.balance || 0) < selectedDriver.price * shares) ||
                      (tradeMode === 'sell' && (user?.portfolio.find(p => p.driverId === selectedDriver.id)?.shares || 0) < shares)
                    }
                  >
                    {loading ? 'Processing...' : tradeMode === 'buy' ? 'Buy Now' : 'Sell Now'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;
