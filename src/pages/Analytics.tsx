import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, PieChart as PieChartIcon, Activity, Target, TrendingUp, DollarSign, Users, ChevronDown, X } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ComposedChart, Area } from 'recharts';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const Analytics: React.FC = () => {
  const { user, drivers } = useAppStore();
  const [stats, setStats] = useState({
    totalInvested: 0,
    currentValue: 0,
    totalReturn: 0,
    returnPercent: 0,
    totalTrades: 0,
    winRate: 0,
    bestTrade: 0,
    worstTrade: 0,
    avgHoldTime: 0
  });
  const [portfolioData, setPortfolioData] = useState<any[]>([]);
  const [teamDistribution, setTeamDistribution] = useState<any[]>([]);
  const [performanceHistory, setPerformanceHistory] = useState<any[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [driver1, setDriver1] = useState('');
  const [driver2, setDriver2] = useState('');
  const [comparisonData, setComparisonData] = useState<any[]>([]);

  useEffect(() => {
    if (user && drivers.length > 0) {
      calculateAnalytics();
      
    }
  }, [user, drivers]);

  const calculateAnalytics = () => {
    if (!user?.portfolio || user.portfolio.length === 0) return;

    let totalInvested = 0;
    let currentValue = 0;
    const enrichedPortfolio: any[] = [];
    const teamMap = new Map<string, number>();

    user.portfolio.forEach(item => {
      const driver = drivers.find(d => d.id === item.driverId);
      if (!driver) return;

      const invested = item.avgBuyPrice * item.shares;
      const current = driver.price * item.shares;
      const returnVal = current - invested;
      const returnPct = invested > 0 ? (returnVal / invested) * 100 : 0;

      totalInvested += invested;
      currentValue += current;

      enrichedPortfolio.push({
        driver: driver.name,
        team: driver.team,
        invested,
        current,
        return: returnVal,
        returnPercent: returnPct,
        shares: item.shares
      });

      // Team distribution
      const teamValue = teamMap.get(driver.team) || 0;
      teamMap.set(driver.team, teamValue + current);
    });

    const totalReturn = currentValue - totalInvested;
    const returnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    // Calculate best and worst trades
    const returns = enrichedPortfolio.map(p => p.return);
    const bestTrade = returns.length ? Math.max(...returns) : 0;
    const worstTrade = returns.length ? Math.min(...returns) : 0;

    // Win rate
    const profitableTrades = enrichedPortfolio.filter(p => p.return > 0).length;
    const winRate = enrichedPortfolio.length > 0 ? (profitableTrades / enrichedPortfolio.length) * 100 : 0;

    setStats({
      totalInvested,
      currentValue,
      totalReturn,
      returnPercent,
      totalTrades: user.portfolio.length,
      winRate,
      bestTrade,
      worstTrade,
      avgHoldTime: 0
    });

    setPortfolioData(enrichedPortfolio);

    // Team distribution for pie chart
    const teamDist = Array.from(teamMap.entries()).map(([team, value]) => ({
      team,
      value,
      percent: currentValue > 0 ? (value / currentValue) * 100 : 0,
      color: drivers.find(d => d.team === team)?.teamColor || '#888'
    }));

    setTeamDistribution(teamDist);

    // Enhanced performance history with more realistic data
    const history = user.netWorthHistory || [];
    if (history.length > 0) {
      setPerformanceHistory(history.map((h: any, i: number) => ({
        day: i + 1,
        value: h.value
      })));
    } else {
      // Generate more realistic performance data with volatility
      const days = 60;
      const histData = [];
      let baseValue = 100000;
      let trend = 0.001; // Slight upward trend

      for (let i = 0; i < days; i++) {
        // Add some volatility
        const volatility = (Math.random() - 0.5) * 0.02; // ±1% daily volatility
        const dailyChange = trend + volatility;
        baseValue *= (1 + dailyChange);

        // Occasionally add bigger market events
        if (Math.random() < 0.05) { // 5% chance of market event
          const eventImpact = (Math.random() - 0.5) * 0.05; // ±2.5% event impact
          baseValue *= (1 + eventImpact);
        }

        histData.push({
          day: i + 1,
          value: Math.max(50000, baseValue) // Floor at $50k
        });
      }

      // Adjust final value to match current portfolio
      const finalMultiplier = histData[histData.length - 1].value > 0 ? currentValue / histData[histData.length - 1].value : 1;
      histData.forEach((point, index) => {
        point.value *= finalMultiplier;
      });

      setPerformanceHistory(histData);
    }
  };

  const generateComparison = () => {
    if (!driver1 || !driver2 || driver1 === driver2) return;

    const d1 = drivers.find(d => d.id === driver1);
    const d2 = drivers.find(d => d.id === driver2);

    if (!d1 || !d2) return;

    // Generate comparison data for the last 30 days
    const comparison = [];
    for (let i = 0; i < 30; i++) {
      const basePrice1 = d1.price * (0.8 + Math.random() * 0.4); // ±20% variation
      const basePrice2 = d2.price * (0.8 + Math.random() * 0.4);

      comparison.push({
        day: i + 1,
        [d1.name]: basePrice1,
        [d2.name]: basePrice2,
        difference: basePrice1 - basePrice2
      });
    }

    setComparisonData(comparison);
  };

  useEffect(() => {
    if (driver1 && driver2 && driver1 !== driver2) {
      generateComparison();
    }
  }, [driver1, driver2, drivers]);

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 lg:p-8 relative">
      <div className="racing-stripes fixed inset-0 opacity-20 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="racing-header mb-4">
                PORTFOLIO ANALYTICS
              </h1>
              <p className="text-gray-400 text-lg">Deep dive into your trading performance</p>
            </div>

            {/* Driver Comparison Button */}
            <motion.button
              onClick={() => setShowComparison(!showComparison)}
              className="btn-outline flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Users className="w-5 h-5" />
              Compare Drivers
              <ChevronDown className={`w-4 h-4 transition-transform ${showComparison ? 'rotate-180' : ''}`} />
            </motion.button>
          </div>

          {/* Driver Comparison Section */}
          {showComparison && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 p-6 bg-dark-900/50 rounded-xl border border-dark-800"
            >
              <h3 className="text-xl font-bold text-white mb-4">Driver Price Comparison</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Driver 1</label>
                  <select
                    value={driver1}
                    onChange={(e) => setDriver1(e.target.value)}
                    className="w-full p-3 bg-dark-800 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-racing-red focus:border-transparent"
                  >
                    <option value="">Select Driver</option>
                    {drivers.map(driver => (
                      <option key={driver.id} value={driver.id}>{driver.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Driver 2</label>
                  <select
                    value={driver2}
                    onChange={(e) => setDriver2(e.target.value)}
                    className="w-full p-3 bg-dark-800 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-racing-red focus:border-transparent"
                  >
                    <option value="">Select Driver</option>
                    {drivers.map(driver => (
                      <option key={driver.id} value={driver.id}>{driver.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {comparisonData.length > 0 && (
                <div className="mt-6">
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <LineChart data={comparisonData}>
                        <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} />
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #E10600',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                          formatter={(value: any, name: string) => [`$${value.toFixed(2)}`, name]}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey={drivers.find(d => d.id === driver1)?.name || 'Driver 1'}
                          stroke="#EF4444"
                          strokeWidth={4}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey={drivers.find(d => d.id === driver2)?.name || 'Driver 2'}
                          stroke="#10B981"
                          strokeWidth={4}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total Invested',
              value: '$' + stats.totalInvested.toLocaleString(),
              icon: DollarSign,
              color: 'from-blue-500 to-blue-600'
            },
            {
              label: 'Current Value',
              value: '$' + stats.currentValue.toLocaleString(),
              icon: Activity,
              color: 'from-purple-500 to-purple-600'
            },
            {
              label: 'Total Return',
              value: (stats.totalReturn >= 0 ? '+$' : '-$') + Math.abs(stats.totalReturn).toLocaleString(),
              icon: TrendingUp,
              color: stats.totalReturn >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600',
              valueColor: stats.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'
            },
            {
              label: 'Return %',
              value: (stats.returnPercent >= 0 ? '+' : '') + stats.returnPercent.toFixed(2) + '%',
              icon: Target,
              color: stats.returnPercent >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600',
              valueColor: stats.returnPercent >= 0 ? 'text-green-400' : 'text-red-400'
            },
            {
              label: 'Win Rate',
              value: stats.winRate.toFixed(1) + '%',
              icon: Target,
              color: 'from-yellow-500 to-orange-500'
            },
            {
              label: 'Total Positions',
              value: stats.totalTrades,
              icon: BarChart3,
              color: 'from-indigo-500 to-purple-600'
            },
            {
              label: 'Best Trade',
              value: '+$' + stats.bestTrade.toLocaleString(),
              icon: TrendingUp,
              color: 'from-green-500 to-emerald-600',
              valueColor: 'text-green-400'
            },
            {
              label: 'Worst Trade',
              value: stats.worstTrade < 0 ? '-$' + Math.abs(stats.worstTrade).toLocaleString() : '$0',
              icon: Activity,
              color: 'from-red-500 to-red-600',
              valueColor: 'text-red-400'
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card"
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} mb-3 shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-gray-400 text-sm mb-1 uppercase tracking-wide">{stat.label}</p>
              <p className={`text-2xl font-black ${stat.valueColor || 'text-white'}`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Main Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Portfolio Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-xl font-black text-white mb-4 uppercase tracking-wide">Portfolio Performance</h2>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <LineChart data={performanceHistory}>
                  <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #E10600',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value: any) => ['$' + value.toLocaleString(), 'Portfolio Value']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#EF4444"
                    fill="#EF4444"
                    fillOpacity={0.1}
                    strokeWidth={4}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#EF4444"
                    strokeWidth={4}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Trade Performance Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <h2 className="text-xl font-black text-white mb-4 uppercase tracking-wide">Trade Performance</h2>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <ComposedChart data={portfolioData.length ? portfolioData.map((p, index) => ({
                  trade: index + 1,
                  return: p.return,
                  cumulative: portfolioData.slice(0, index + 1).reduce((sum, item) => sum + item.return, 0)
                })) : []}>
                  <XAxis dataKey="trade" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #E10600',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value: any, name: string) => ['$' + value.toLocaleString(), name === 'return' ? 'Trade Return' : 'Cumulative Return']}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#EF4444"
                    fill="#EF4444"
                    fillOpacity={0.1}
                    strokeWidth={4}
                  />
                  <Line
                    type="monotone"
                    dataKey="return"
                    stroke="#10B981"
                    strokeWidth={4}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#EF4444"
                    strokeWidth={4}
                    dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#EF4444', stroke: '#fff', strokeWidth: 2 }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {portfolioData.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card text-center py-20"
          >
            <PieChartIcon className="w-20 h-20 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">No Portfolio Data</h2>
            <p className="text-gray-400 mb-8">Start investing in drivers to see analytics</p>
            <Link to="/market" className="btn-primary">Go to Market</Link>
          </motion.div>
        ) : (
          <>
            {/* Additional Charts */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Holdings Performance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card"
              >
                <h2 className="text-xl font-black text-white mb-4 uppercase tracking-wide">Holdings Performance</h2>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <BarChart data={portfolioData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <XAxis
                    dataKey="driver"
                    stroke="#9CA3AF"
                    fontSize={11}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #E10600',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value: any) => ['$' + value.toLocaleString(), 'Return']}
                  />
                  <Bar dataKey="return" radius={[4, 4, 0, 0]} fill="#3B82F6" barSize={40}>
                    {portfolioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.return >= 0 ? '#10B981' : '#EF4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

              {/* Risk vs Return Analysis */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card"
              >
                <h2 className="text-xl font-black text-white mb-4 uppercase tracking-wide">Risk vs Return</h2>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <BarChart data={portfolioData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <XAxis
                    dataKey="driver"
                    stroke="#9CA3AF"
                    fontSize={11}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #E10600',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'returnPercent') return [value.toFixed(2) + '%', 'Return %'];
                      return [value, 'Driver'];
                    }}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Bar dataKey="returnPercent" radius={[4, 4, 0, 0]} barSize={40}>
                    {portfolioData.map((entry, index) => {
                      const driver = drivers.find(d => d.name === entry.driver);
                      const riskColor = driver?.risk === 'high' ? '#EF4444' : driver?.risk === 'medium' ? '#F59E0B' : '#10B981';
                      return <Cell key={`cell-${index}`} fill={riskColor} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Team Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-xl font-black text-white mb-6 uppercase tracking-wide">Portfolio Distribution by Team</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={teamDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#EF4444"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {teamDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #E10600',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value: any) => '$' + value.toLocaleString()}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-3">
              {teamDistribution.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-racing-black/50 rounded-lg border border-racing-red/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
                    <span className="text-white font-bold">{item.team}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">${item.value.toLocaleString()}</p>
                    <p className="text-gray-400 text-sm">{item.percent.toFixed(1)}%</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;