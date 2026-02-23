import React, { useMemo, useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { doc, updateDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Search, TrendingUp, TrendingDown, ShoppingCart, Zap, Target, Activity, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Market: React.FC = () => {
  const { drivers, user, setUser } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'change' | 'name' | 'points'>('price');
  const [filterTeam, setFilterTeam] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [shares, setShares] = useState(1);
  const [loading, setLoading] = useState(false);
  const [lastRaceResults, setLastRaceResults] = useState<any[]>([]);
  const [lastRaceName, setLastRaceName] = useState('');

  // Listen to race_schedule for completed race results
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'race_schedule'), (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const completed = all
        .filter((r: any) => r.status === 'completed' && r.results?.length > 0)
        .sort((a: any, b: any) => b.lastUpdated - a.lastUpdated);
      
      if (completed.length > 0) {
        const latestRace = completed[0];
        setLastRaceResults(latestRace.results || []);
        setLastRaceName(latestRace.raceName || '');
      }
    });
    return () => unsub();
  }, []);

  const lastRaceChangeMap = useMemo(() => {
    const map: Record<string, number> = {};
    lastRaceResults.forEach((r: any) => {
      map[r.driverId] = typeof r.priceChange === 'number' ? r.priceChange : 0;
    });
    return map;
  }, [lastRaceResults]);

  const getLastRaceChange = (driverId: string) =>
    typeof lastRaceChangeMap[driverId] === 'number'
      ? lastRaceChangeMap[driverId]
      : (drivers.find(d => d.id === driverId)?.changePercent || 0);

  const getLastRacePosition = (driverId: string) => {
    const r = lastRaceResults.find((r: any) => r.driverId === driverId);
    return r ? r.position : null;
  };

  const getOverallChange = (driverId: string) => {
    const d = drivers.find(driver => driver.id === driverId);
    if (!d || !d.basePrice) return 0;
    return ((d.price - d.basePrice) / d.basePrice) * 100;
  };

  const teams = ['all', ...Array.from(new Set(drivers.map(d => d.team)))];

  const filteredDrivers = drivers
    .filter(d =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterTeam === 'all' || d.team === filterTeam)
    )
    .sort((a, b) => {
      if (sortBy === 'price') return b.price - a.price;
      if (sortBy === 'change') return getLastRaceChange(b.id) - getLastRaceChange(a.id);
      if (sortBy === 'points') return (b.points || 0) - (a.points || 0);
      return a.name.localeCompare(b.name);
    });

  const handleBuy = async () => {
    if (!selectedDriver || !user || loading) return;
    const totalCost = selectedDriver.price * shares;
    if (user.balance < totalCost) { alert('Insufficient balance!'); return; }
    setLoading(true);
    try {
      const existing = user.portfolio.find((p: any) => p.driverId === selectedDriver.id);
      const newPortfolio = existing
        ? user.portfolio.map((p: any) =>
          p.driverId === selectedDriver.id
            ? { ...p, shares: p.shares + shares, avgBuyPrice: ((p.avgBuyPrice * p.shares) + totalCost) / (p.shares + shares) }
            : p
        )
        : [...user.portfolio, {
          driverId: selectedDriver.id, shares,
          avgBuyPrice: selectedDriver.price, currentPrice: selectedDriver.price,
          totalValue: totalCost, totalReturn: 0, totalReturnPercent: 0, purchaseDate: Date.now(),
        }];
      const updatedUser = { ...user, balance: user.balance - totalCost, portfolio: newPortfolio };
      await updateDoc(doc(db, 'users', user.uid), { balance: updatedUser.balance, portfolio: updatedUser.portfolio });
      setUser(updatedUser);
      setShowBuyModal(false);
      setShares(1);
      setSelectedDriver(null);
    } catch (e) {
      console.error('Buy error:', e);
      alert('Failed to complete purchase. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 lg:p-8 relative">
      <div className="racing-stripes fixed inset-0 opacity-20 pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="racing-header mb-4">DRIVER MARKET</h1>
          <p className="text-gray-400 text-lg">Buy and sell F1 drivers based on their performance</p>
        </motion.div>

        {/* Market Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Drivers', value: drivers.length, icon: Target, color: 'from-racing-red to-red-600' },
            { label: 'Market Volume', value: '$' + (drivers.reduce((s, d) => s + (d.marketCap || d.price * 1000000), 0) / 1000000).toFixed(1) + 'M', icon: Activity, color: 'from-orange-500 to-red-500' },
            { label: 'Avg Price', value: '$' + Math.round(drivers.reduce((s, d) => s + d.price, 0) / (drivers.length || 1)), icon: TrendingUp, color: 'from-green-500 to-emerald-600' },
            { label: 'Your Balance', value: '$' + (user?.balance || 0).toLocaleString(), icon: Zap, color: 'from-yellow-500 to-orange-500' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="stat-card">
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} mb-3 shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Last Race Results */}
        {lastRaceResults.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="card mb-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Last Race: {lastRaceName || 'Race Results'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {lastRaceResults.slice(0, 5).map((result: any) => (
                <div key={result.driverId} className="flex items-center gap-2 bg-dark-800/50 p-2 rounded-lg">
                  <span className="text-lg font-bold text-yellow-400">P{result.position}</span>
                  {result.photo && <img src={result.photo} alt={result.driverName} className="w-6 h-6 rounded-full object-cover" />}
                  <span className="text-white text-xs truncate flex-1">{result.driverName}</span>
                  <span className={`text-xs font-bold ml-auto ${result.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {result.priceChange >= 0 ? '+' : ''}{result.priceChange}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card mb-6 racing-border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input type="text" placeholder="Search drivers..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)} className="input-field pl-10" />
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="input-field md:w-48">
              <option value="price">Price: High to Low</option>
              <option value="change">Change: High to Low</option>
              <option value="points">Points: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
            <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)} className="input-field md:w-56">
              {teams.map(team => (
                <option key={team} value={team}>{team === 'all' ? '🏁 All Teams' : team}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Driver Grid */}
        {filteredDrivers.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card text-center py-20">
            <p className="text-2xl text-gray-400 mb-4">No drivers found</p>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredDrivers.map((driver, index) => {
                const lastChange = getLastRaceChange(driver.id);
                const lastPosition = getLastRacePosition(driver.id);
                const overallChange = getOverallChange(driver.id);
                const currentPrice = driver.price || 0;

                return (
                  <motion.div key={driver.id} layout
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: index * 0.03 }}
                    className="card-hover group relative overflow-hidden"
                    onClick={() => { setSelectedDriver(driver); setShowBuyModal(true); }}
                  >
                    <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-300"
                      style={{ background: `linear-gradient(135deg, ${driver.teamColor}20 0%, transparent 100%)` }} />

                    {/* Helmet → Face hover */}
                    <div className="relative h-56 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-2xl group"
                      style={{ backgroundColor: `${driver.teamColor}15` }}>
                      <img src={driver.helmetImg} alt={driver.name}
                        className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:opacity-0 group-hover:scale-110" />
                      <img src={driver.photo} alt={driver.name}
                        className="absolute inset-0 w-full h-full object-cover object-top opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-105"
                        onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=E10600&color=fff&size=400&bold=true`; }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-red-600/40 via-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
                      <div className="absolute top-3 right-4">
                        <span className="text-white font-black text-4xl italic tracking-tight"
                          style={{ transform: 'rotate(-12deg)', textShadow: `2px 2px 0 ${driver.teamColor}, 4px 4px 12px rgba(0,0,0,0.9)` }}>
                          {driver.driverNumber}
                        </span>
                      </div>
                    </div>

                    {/* Driver info */}
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-black text-white mb-1 uppercase tracking-wide">{driver.name}</h3>
                          <p className="text-gray-400 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: driver.teamColor }} />
                            {driver.team}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-black text-white neon-text">${currentPrice}</p>
                          <div className={`flex items-center gap-1 text-sm font-bold ${lastChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {lastChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {lastChange >= 0 ? '+' : ''}{lastChange.toFixed(2)}%
                          </div>
                          {overallChange !== 0 && (
                            <div className={`text-xs ${overallChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              Overall: {overallChange >= 0 ? '+' : ''}{overallChange.toFixed(2)}%
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-racing-black/50 rounded-lg p-2 text-center border border-racing-red/20">
                          <p className="text-gray-400 text-xs mb-1">Rank</p>
                          <p className="text-white font-bold text-lg">P{driver.rank}</p>
                        </div>
                        <div className="bg-racing-black/50 rounded-lg p-2 text-center border border-racing-red/20">
                          <p className="text-gray-400 text-xs mb-1">Points</p>
                          <p className="text-white font-bold text-lg">{driver.points || 0}</p>
                        </div>
                        <div className="bg-racing-black/50 rounded-lg p-2 text-center border border-racing-red/20">
                          <p className="text-gray-400 text-xs mb-1">Wins</p>
                          <p className="text-white font-bold text-lg">{driver.wins || 0}</p>
                        </div>
                      </div>

                      {/* Last race result */}
                      {lastPosition !== null && (
                        <div className="mb-3 p-2 bg-dark-800/50 rounded-lg border border-yellow-500/30">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Last Race:</span>
                            <span className="text-yellow-400 font-bold">P{lastPosition}</span>
                            <span className={`font-bold ${lastChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {lastChange >= 0 ? '+' : ''}{lastChange}%
                            </span>
                          </div>
                        </div>
                      )}

                      <button className="btn-primary w-full flex items-center justify-center gap-2 font-black uppercase">
                        <ShoppingCart className="w-5 h-5" />BUY SHARES
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Buy Modal */}
        <AnimatePresence>
          {showBuyModal && selectedDriver && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
              onClick={() => !loading && setShowBuyModal(false)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="card max-w-md w-full racing-border glow-effect" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-4 mb-6">
                  <img src={selectedDriver.photo} alt={selectedDriver.name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-racing-red"
                    onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedDriver.name)}&background=E10600&color=fff&size=200&bold=true`; }} />
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase">{selectedDriver.name}</h2>
                    <p className="text-gray-400">{selectedDriver.team}</p>
                    {getLastRacePosition(selectedDriver.id) && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">Last Race:</span>
                        <span className="text-xs text-yellow-400 font-bold">P{getLastRacePosition(selectedDriver.id)}</span>
                        <span className={`text-xs font-bold ${getLastRaceChange(selectedDriver.id) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {getLastRaceChange(selectedDriver.id) >= 0 ? '+' : ''}{getLastRaceChange(selectedDriver.id)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4 p-4 bg-racing-black/50 rounded-lg border border-racing-red/30">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Price per share</p>
                      <p className="text-3xl font-black text-white">${selectedDriver.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm mb-1">Your balance</p>
                      <p className="text-xl font-bold text-green-400">${user?.balance.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-300 text-sm font-bold mb-3 uppercase">Number of shares</label>
                    <div className="flex items-center justify-center gap-4">
                      <button onClick={() => setShares(p => Math.max(1, p - 1))} disabled={loading}
                        className="w-12 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white text-2xl font-black flex items-center justify-center shadow-lg transition">−</button>
                      <div className="w-20 h-12 flex items-center justify-center bg-black/60 border border-red-600/40 rounded-xl text-2xl font-bold text-white">{shares}</div>
                      <button onClick={() => setShares(p => Math.min(Math.floor((user?.balance || 0) / selectedDriver.price), p + 1))}
                        disabled={loading} className="w-12 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white text-2xl font-black flex items-center justify-center shadow-lg transition">+</button>
                    </div>
                  </div>
                  <div className="bg-racing-red/10 border border-racing-red/30 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400 font-medium">Total Cost</span>
                      <span className="text-white font-black text-lg">${(selectedDriver.price * shares).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Remaining Balance</span>
                      <span className="text-white font-black text-lg">${((user?.balance || 0) - (selectedDriver.price * shares)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => !loading && setShowBuyModal(false)} className="btn-secondary flex-1 uppercase font-black" disabled={loading}>Cancel</button>
                  <button onClick={handleBuy}
                    className="btn-primary flex-1 uppercase font-black"
                    disabled={(user?.balance || 0) < selectedDriver.price * shares || loading}>
                    {loading ? 'Processing...' : 'Buy Now'}
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

export default Market;
