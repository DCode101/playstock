import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { TrendingUp, TrendingDown, DollarSign, Percent, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

const Portfolio: React.FC = () => {
  const { user, drivers, setUser } = useAppStore();
  const [portfolioData, setPortfolioData] = useState<any[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalReturn, setTotalReturn] = useState(0);

  useEffect(() => {
    if (user?.portfolio && drivers.length > 0) {
      const enrichedPortfolio = user.portfolio.map(item => {
        const driver = drivers.find(d => d.id === item.driverId);
        if (!driver) return null;

        const currentValue = driver.price * item.shares;
        const investedValue = item.avgBuyPrice * item.shares;
        const returnValue = currentValue - investedValue;
        const returnPercent = (returnValue / investedValue) * 100;

        return {
          ...item,
          driver,
          currentPrice: driver.price,
          currentValue,
          investedValue,
          returnValue,
          returnPercent
        };
      }).filter(Boolean);

      setPortfolioData(enrichedPortfolio);

      const total = enrichedPortfolio.reduce((sum, item) => sum + (item?.currentValue || 0), 0);
      setTotalValue(total);

      const totalInvested = enrichedPortfolio.reduce((sum, item) => sum + (item?.investedValue || 0), 0);
      setTotalReturn(total - totalInvested);
    }
  }, [user, drivers]);

  const handleSell = (driverId: string, sharesToSell: number) => {
    if (!user) return;

    const position = user.portfolio.find(p => p.driverId === driverId);
    const driver = drivers.find(d => d.id === driverId);
    
    if (!position || !driver) return;

    const sellValue = driver.price * sharesToSell;
    
    const newPortfolio = sharesToSell >= position.shares
      ? user.portfolio.filter(p => p.driverId !== driverId)
      : user.portfolio.map(p => 
          p.driverId === driverId 
            ? { ...p, shares: p.shares - sharesToSell }
            : p
        );

    setUser({
      ...user,
      balance: user.balance + sellValue,
      portfolio: newPortfolio
    });
  };

  const pieChartData = portfolioData.map(item => ({
    name: item.driver.name,
    value: item.currentValue,
    color: item.driver.teamColor
  }));

  const COLORS = pieChartData.map(d => d.color);

  return (
    <div className="min-h-screen bg-dark-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Your <span className="text-gradient">Portfolio</span>
          </h1>
          <p className="text-dark-400">Track and manage your driver investments</p>
        </motion.div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-hover"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-dark-400 text-sm">Total Value</p>
                <p className="text-2xl font-bold text-white">${totalValue.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-hover"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-3 bg-gradient-to-br ${totalReturn >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} rounded-lg`}>
                {totalReturn >= 0 ? <TrendingUp className="w-6 h-6 text-white" /> : <TrendingDown className="w-6 h-6 text-white" />}
              </div>
              <div>
                <p className="text-dark-400 text-sm">Total Return</p>
                <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalReturn >= 0 ? '+' : ''}${totalReturn.toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-hover"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                <Percent className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-dark-400 text-sm">Return %</p>
                <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalReturn >= 0 ? '+' : ''}{((totalReturn / (totalValue - totalReturn)) * 100 || 0).toFixed(2)}%
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-hover"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-dark-400 text-sm">Positions</p>
                <p className="text-2xl font-bold text-white">{portfolioData.length}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Holdings List */}
          <div className="lg:col-span-2 space-y-4">
            {portfolioData.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card text-center py-12"
              >
                <p className="text-dark-400 text-lg mb-4">No holdings yet</p>
                <p className="text-dark-500 mb-6">Start building your portfolio by buying drivers from the market</p>
                <Link to="/market" className="btn-primary inline-block">
                  Go to Market
                </Link>
              </motion.div>
            ) : (
              portfolioData.map((item, index) => (
                <motion.div
                  key={item.driverId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card-hover"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Driver Image */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2" style={{ borderColor: item.driver.teamColor }}>
                        <img 
                          src={item.driver.photo}
                          alt={item.driver.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${item.driver.name}&background=random`;
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{item.driver.name}</h3>
                        <p className="text-dark-400 text-sm">{item.driver.team}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                      <div>
                        <p className="text-dark-400 text-xs mb-1">Shares</p>
                        <p className="text-white font-bold">{item.shares}</p>
                      </div>
                      <div>
                        <p className="text-dark-400 text-xs mb-1">Avg Price</p>
                        <p className="text-white font-bold">${item.avgBuyPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-dark-400 text-xs mb-1">Current</p>
                        <p className="text-white font-bold">${item.currentPrice}</p>
                      </div>
                      <div>
                        <p className="text-dark-400 text-xs mb-1">Return</p>
                        <p className={`font-bold flex items-center gap-1 ${item.returnValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {item.returnValue >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {item.returnPercent.toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <button 
                      onClick={() => handleSell(item.driverId, item.shares)}
                      className="btn-secondary md:w-24"
                    >
                      Sell All
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Portfolio Allocation Chart */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
          >
            <h2 className="text-xl font-bold text-white mb-6">Portfolio Allocation</h2>
            {pieChartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #E10600' }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-2 mt-4">
                  {pieChartData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-dark-300 text-sm">{item.name}</span>
                      </div>
                      <span className="text-white font-medium text-sm">
                        {((item.value / totalValue) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-dark-400">No data to display</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;