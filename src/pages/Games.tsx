import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Gamepad2, Trophy, Target, Zap, Star, Gift, CheckCircle, Users, Clock, Award, TrendingUp, Crown, RotateCcw, ArrowLeft, Flame, Brain, Timer, Puzzle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { collection, addDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────
interface LeaderboardUser {
  rank: number;
  username: string;
  score: number;
  avatar: string;
}

interface GameHistoryEntry {
  id: string;
  game: string;
  score: number;
  reward: number;
  userId: string;
  username: string;
  date: string;
}

// ─── Quiz Questions ────────────────────────────────────────────────────────────
const QUIZ_QUESTIONS = [
  {
    question: 'Who holds the record for most F1 World Championships?',
    options: ['Lewis Hamilton', 'Michael Schumacher', 'Both (tied at 7)', 'Max Verstappen'],
    correct: 2,
    explanation: 'Hamilton and Schumacher are tied at 7 championships each.'
  },
  {
    question: 'Which circuit is known as "The Temple of Speed"?',
    options: ['Monaco', 'Silverstone', 'Monza', 'Spa-Francorchamps'],
    correct: 2,
    explanation: 'Monza earned this nickname for its long straights and high-speed nature.'
  },
  {
    question: 'What is the maximum number of drivers allowed on an F1 grid?',
    options: ['18', '20', '22', '24'],
    correct: 1,
    explanation: '20 drivers (10 teams × 2 drivers) compete in F1.'
  },
  {
    question: 'Which team has won the most Constructor Championships?',
    options: ['Mercedes', 'Red Bull', 'Ferrari', 'McLaren'],
    correct: 2,
    explanation: 'Ferrari leads with 16 Constructor Championships.'
  },
  {
    question: 'What does DRS stand for?',
    options: ['Drag Reduction System', 'Direct Racing Speed', 'Driver Racing System', 'Downforce Reduction Switch'],
    correct: 0,
    explanation: 'DRS opens the rear wing to reduce drag and help overtaking.'
  },
  {
    question: 'Which driver won the 2021 F1 World Championship on the final lap of the final race?',
    options: ['Lewis Hamilton', 'Valtteri Bottas', 'Max Verstappen', 'Charles Leclerc'],
    correct: 2,
    explanation: 'Verstappen overtook Hamilton on the final lap in Abu Dhabi after a controversial safety car restart.'
  },
  {
    question: 'How many points does an F1 driver get for winning a race?',
    options: ['10', '20', '25', '30'],
    correct: 2,
    explanation: 'A race winner receives 25 championship points.'
  },
  {
    question: 'What flag signals the end of a race in F1?',
    options: ['Red flag', 'Blue flag', 'Yellow flag', 'Chequered flag'],
    correct: 3,
    explanation: 'The chequered flag (black and white) signals the end of the race.'
  }
];

// ─── Memory Cards ─────────────────────────────────────────────────────────────
const INITIAL_MEMORY_CARDS = [
  { id: 1, name: 'Red Bull',    type: 'team',   matchId: 1, flipped: false, matched: false, emoji: '🔴' },
  { id: 2, name: 'Mercedes',   type: 'team',   matchId: 2, flipped: false, matched: false, emoji: '⚪' },
  { id: 3, name: 'Ferrari',    type: 'team',   matchId: 3, flipped: false, matched: false, emoji: '🐎' },
  { id: 4, name: 'McLaren',    type: 'team',   matchId: 4, flipped: false, matched: false, emoji: '🧡' },
  { id: 5, name: 'Verstappen', type: 'driver', matchId: 1, flipped: false, matched: false, emoji: '🇳🇱' },
  { id: 6, name: 'Hamilton',   type: 'driver', matchId: 2, flipped: false, matched: false, emoji: '🇬🇧' },
  { id: 7, name: 'Leclerc',    type: 'driver', matchId: 3, flipped: false, matched: false, emoji: '🇲🇨' },
  { id: 8, name: 'Norris',     type: 'driver', matchId: 4, flipped: false, matched: false, emoji: '🇬🇧' },
];

const PREDICT_DRIVERS = [
  { id: 'verstappen', name: 'Max Verstappen', team: 'Red Bull',  odds: 2.5 },
  { id: 'hamilton',   name: 'Lewis Hamilton', team: 'Mercedes',  odds: 3.0 },
  { id: 'leclerc',    name: 'Charles Leclerc',team: 'Ferrari',   odds: 4.0 },
  { id: 'norris',     name: 'Lando Norris',   team: 'McLaren',   odds: 6.0 },
  { id: 'piastri',    name: 'Oscar Piastri',  team: 'McLaren',   odds: 8.0 },
  { id: 'russell',    name: 'George Russell', team: 'Mercedes',  odds: 7.0 },
  { id: 'sainz',      name: 'Carlos Sainz',   team: 'Ferrari',   odds: 5.0 },
  { id: 'perez',      name: 'Sergio Perez',   team: 'Red Bull',  odds: 10.0 },
];

function shuffleArray<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const generateAvatar = (name: string) => {
  const emojis = ['🏎️', '🏁', '🏆', '⚡', '🔥', '💎', '👑', '🎯', '🚀', '💰'];
  return emojis[(name?.charCodeAt(0) ?? 0) % emojis.length];
};

// ─── Component ────────────────────────────────────────────────────────────────
const Games: React.FC = () => {
  const { user, drivers, updateBalance } = useAppStore();

  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [topPlayers, setTopPlayers] = useState<LeaderboardUser[]>([]);
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);

  // ── Quiz state ──
  const [quizState, setQuizState] = useState({
    questions: shuffleArray(QUIZ_QUESTIONS).slice(0, 6),
    current: 0,
    score: 0,
    answered: false,
    selectedOption: -1,
    finished: false,
    reward: 0,
  });

  // ── Reaction state ──
  const [reaction, setReaction] = useState({
    stage: 'idle' as 'idle' | 'waiting' | 'ready' | 'go' | 'result' | 'done',
    lights: [false, false, false, false, false],
    startTime: 0,
    reactionTime: 0,
    attempts: [] as number[],
    falsestarts: 0,
  });
  const reactionTimerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ── Memory state ──
  const [memory, setMemory] = useState({
    cards: shuffleArray(INITIAL_MEMORY_CARDS),
    flipped: [] as number[],
    matched: 0,
    moves: 0,
    startTime: Date.now(),
    done: false,
    reward: 0,
    locked: false,
  });

  // ── Predict state ──
  const [predict, setPredict] = useState({
    picks: { first: '', second: '', third: '' },
    submitted: false,
    actual: [] as string[],
    points: 0,
    reward: 0,
  });

  // ── Strategy state ──
  const [strategy, setStrategy] = useState({
    lap: 42,
    position: 4,
    tyreWear: 68,
    fuel: 48,
    drsAvailable: false,
    score: 0,
    done: false,
    lastMessage: '',
    lastDelta: 0,
    reward: 0,
  });

  // ─── Firestore: Save game score ────────────────────────────────────────────
  const saveGameScore = useCallback(async (gameName: string, score: number, reward: number) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'game_history'), {
        game: gameName,
        score,
        reward,
        userId: user.uid,
        username: user.username || user.email || 'Anonymous',
        date: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error saving game score:', err);
    }
  }, [user]);

  // ─── Firestore: Load top players ───────────────────────────────────────────
  // Live users leaderboard so game rewards reflect immediately
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const players = snapshot.docs
          .map((d) => {
            const data = d.data() as any;
            const balance = typeof data.balance === 'number' ? data.balance : 100000;
            const portfolio = Array.isArray(data.portfolio) ? data.portfolio : [];
            const portfolioValue = portfolio.reduce((sum: number, item: any) => {
              const shares = Number(item?.shares) || 0;
              const livePrice = drivers.find(driver => driver.id === item?.driverId)?.price;
              const itemPrice =
                typeof livePrice === 'number'
                  ? livePrice
                  : typeof item?.currentPrice === 'number'
                    ? item.currentPrice
                    : shares > 0 && typeof item?.totalValue === 'number'
                      ? item.totalValue / shares
                      : 0;

              return sum + (itemPrice * shares);
            }, 0);

            const netWorth = balance + portfolioValue;
            return {
              rank: 0,
              username: data.username || data.email || 'Anonymous',
              score: netWorth - 100000,
              avatar: generateAvatar(data.username || 'A'),
            };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map((p, i) => ({ ...p, rank: i + 1 }));

        setTopPlayers(players);
      },
      () => {
        setTopPlayers([
          { rank: 1, username: 'RaceMaster',      score: 58000, avatar: 'R' },
          { rank: 2, username: 'SpeedDemon',      score: 42000, avatar: 'S' },
          { rank: 3, username: 'PitStopPro',      score: 35000, avatar: 'P' },
          { rank: 4, username: 'VeteranInvestor', score: 21000, avatar: 'V' },
          { rank: 5, username: 'RookieRacer',     score: -5000, avatar: 'N' },
        ]);
      }
    );

    return () => unsub();
  }, [drivers]);

  // ─── Firestore: Real-time game history ─────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'game_history'),
      orderBy('date', 'desc'),
      limit(10)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GameHistoryEntry));
      setGameHistory(entries);
    });
    return () => unsub();
  }, [user]);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const goBack = () => {
    setSelectedGame(null);
    // reset quiz
    setQuizState({
      questions: shuffleArray(QUIZ_QUESTIONS).slice(0, 6),
      current: 0, score: 0, answered: false, selectedOption: -1, finished: false, reward: 0,
    });
    // reset reaction
    reactionTimerRef.current.forEach(clearTimeout);
    setReaction({ stage: 'idle', lights: [false,false,false,false,false], startTime: 0, reactionTime: 0, attempts: [], falsestarts: 0 });
    // reset memory
    setMemory({ cards: shuffleArray(INITIAL_MEMORY_CARDS), flipped: [], matched: 0, moves: 0, startTime: Date.now(), done: false, reward: 0, locked: false });
    // reset predict
    setPredict({ picks: { first: '', second: '', third: '' }, submitted: false, actual: [], points: 0, reward: 0 });
    // reset strategy
    setStrategy({ lap: 42, position: 4, tyreWear: 68, fuel: 48, drsAvailable: false, score: 0, done: false, lastMessage: '', lastDelta: 0, reward: 0 });
  };

  // ─── QUIZ ─────────────────────────────────────────────────────────────────
  const handleQuizAnswer = (idx: number) => {
    if (quizState.answered) return;
    const correct = idx === quizState.questions[quizState.current].correct;
    const newScore = quizState.score + (correct ? 1 : 0);

    setQuizState(prev => ({ ...prev, answered: true, selectedOption: idx, score: newScore }));

    setTimeout(() => {
      if (quizState.current + 1 >= quizState.questions.length) {
        const pct = newScore / quizState.questions.length;
        const reward = pct >= 0.9 ? 600 : pct >= 0.7 ? 400 : pct >= 0.5 ? 200 : 100;
        updateBalance(reward);
        saveGameScore('F1 Trivia', newScore * 100, reward);
        setQuizState(prev => ({ ...prev, finished: true, reward }));
      } else {
        setQuizState(prev => ({ ...prev, current: prev.current + 1, answered: false, selectedOption: -1 }));
      }
    }, 1200);
  };

  // ─── REACTION ─────────────────────────────────────────────────────────────
  const startReaction = () => {
    reactionTimerRef.current.forEach(clearTimeout);
    setReaction(prev => ({ ...prev, stage: 'waiting', lights: [false,false,false,false,false] }));

    const delay = 1500 + Math.random() * 3000;
    const t0 = setTimeout(() => {
      // light up one by one
      [0,1,2,3,4].forEach((i) => {
        const t = setTimeout(() => {
          setReaction(prev => {
            const lights = [...prev.lights] as [boolean,boolean,boolean,boolean,boolean];
            lights[i] = true;
            return { ...prev, lights, stage: 'ready' };
          });
        }, i * 500);
        reactionTimerRef.current.push(t);
      });
      // all on → wait random → go
      const tGo = setTimeout(() => {
        setReaction(prev => ({ ...prev, lights: [false,false,false,false,false], stage: 'go', startTime: Date.now() }));
      }, 2500 + Math.random() * 1000);
      reactionTimerRef.current.push(tGo);
    }, delay);
    reactionTimerRef.current.push(t0);
  };

  const handleReactionClick = () => {
    if (reaction.stage === 'go') {
      const rt = Date.now() - reaction.startTime;
      const newAttempts = [...reaction.attempts, rt];
      if (newAttempts.length >= 3) {
        const avg = newAttempts.reduce((a, b) => a + b, 0) / newAttempts.length;
        const best = Math.min(...newAttempts);
        const score = best <= 150 ? 1000 : best <= 200 ? 800 : best <= 250 ? 600 : best <= 300 ? 400 : best <= 400 ? 200 : 100;
        updateBalance(score);
        saveGameScore('Reaction Test', score, score);
        setReaction(prev => ({ ...prev, reactionTime: rt, attempts: newAttempts, stage: 'done' }));
      } else {
        setReaction(prev => ({ ...prev, reactionTime: rt, attempts: newAttempts, stage: 'result' }));
      }
    } else if (reaction.stage === 'waiting' || reaction.stage === 'ready') {
      // False start
      reactionTimerRef.current.forEach(clearTimeout);
      setReaction(prev => ({ ...prev, stage: 'result', reactionTime: -1, falsestarts: prev.falsestarts + 1 }));
    }
  };

  // ─── MEMORY ───────────────────────────────────────────────────────────────
  const handleMemoryClick = (cardId: number) => {
    if (memory.locked || memory.done) return;
    const card = memory.cards.find(c => c.id === cardId);
    if (!card || card.flipped || card.matched) return;

    const newCards = memory.cards.map(c => c.id === cardId ? { ...c, flipped: true } : c);
    const newFlipped = [...memory.flipped, cardId];

    if (newFlipped.length === 2) {
      const [a, b] = newFlipped.map(id => newCards.find(c => c.id === id)!);
      const isMatch = a.matchId === b.matchId && a.type !== b.type;

      setMemory(prev => ({ ...prev, cards: newCards, flipped: newFlipped, moves: prev.moves + 1, locked: true }));

      setTimeout(() => {
        setMemory(prev => {
          const updatedCards = prev.cards.map(c =>
            newFlipped.includes(c.id) ? { ...c, matched: isMatch, flipped: isMatch } : c
          );
          const newMatched = prev.matched + (isMatch ? 1 : 0);
          const done = newMatched === 4;
          const timeTaken = (Date.now() - prev.startTime) / 1000;
          const reward = done ? Math.max(150, Math.round(1200 - prev.moves * 15 - timeTaken * 3)) : 0;
          if (done) {
            updateBalance(reward);
            saveGameScore('Memory Game', Math.round(1200 - prev.moves * 15), reward);
          }
          return { ...prev, cards: updatedCards, flipped: [], matched: newMatched, locked: false, done, reward };
        });
      }, 700);
    } else {
      setMemory(prev => ({ ...prev, cards: newCards, flipped: newFlipped }));
    }
  };

  const resetMemory = () => {
    setMemory({ cards: shuffleArray(INITIAL_MEMORY_CARDS), flipped: [], matched: 0, moves: 0, startTime: Date.now(), done: false, reward: 0, locked: false });
  };

  // ─── PREDICT ──────────────────────────────────────────────────────────────
  const submitPredict = () => {
    const { first, second, third } = predict.picks;
    if (!first || !second || !third) { alert('Select all 3 positions!'); return; }
    if (new Set([first, second, third]).size < 3) { alert('Each driver can only be in one position!'); return; }

    const pool = shuffleArray(PREDICT_DRIVERS);
    const actual = pool.slice(0, 3).map(d => d.id);

    let pts = 0, reward = 0;
    if (first === actual[0])  { pts += 25; reward += 300; }
    if (second === actual[1]) { pts += 18; reward += 200; }
    if (third === actual[2])  { pts += 15; reward += 150; }
    if (first === actual[0] && second === actual[1] && third === actual[2]) { pts += 50; reward += 500; }

    if (reward > 0) { updateBalance(reward); saveGameScore('Race Predictor', pts, reward); }
    setPredict(prev => ({ ...prev, submitted: true, actual, points: pts, reward }));
  };

  // ─── STRATEGY ─────────────────────────────────────────────────────────────
  const makeStrategyDecision = (decision: string) => {
    if (strategy.done) return;

    let { position, tyreWear, fuel, drsAvailable, score } = strategy;
    let msg = '';
    let delta = 0;

    switch (decision) {
      case 'overtake':
        if (Math.random() > 0.4) { position = Math.max(1, position - 1); msg = '✅ Successful overtake! Gained a position!'; delta = 100; tyreWear -= 10; }
        else { msg = '❌ Overtake failed — lost time and tyre life.'; delta = -50; tyreWear -= 15; }
        break;
      case 'drs':
        if (drsAvailable) { msg = '✅ DRS activated! Closing the gap ahead.'; delta = 60; tyreWear -= 5; fuel -= 2; }
        else { msg = '❌ Not within 1 second — DRS unavailable.'; delta = -10; }
        break;
      case 'pit':
        position = Math.min(20, position + 2);
        tyreWear = 100; fuel = Math.min(100, fuel + 30);
        msg = '🛑 Pit stop: 2.8s. Fresh mediums fitted. Lost 2 positions.';
        delta = -20;
        break;
      case 'defend':
        if (Math.random() > 0.35) { msg = '🛡️ Solid defense! Position held.'; delta = 80; }
        else { position = Math.min(20, position + 1); msg = '⚠️ Couldn\'t defend — lost the position.'; delta = -80; }
        tyreWear -= 8;
        break;
      case 'push':
        if (Math.random() > 0.5) { position = Math.max(1, position - 1); msg = '🔥 Pushed hard and gained a place!'; delta = 120; tyreWear -= 18; fuel -= 5; }
        else { msg = '⚠️ Pushed too hard — no gain, more tyre wear.'; delta = -30; tyreWear -= 20; }
        break;
    }

    const newLap = strategy.lap + 1;
    const done = newLap >= 57;
    const newScore = score + delta;
    const drsNext = Math.random() > 0.5;

    if (done) {
      const posBonus = (20 - position) * 60;
      const finalReward = Math.max(100, newScore + posBonus);
      updateBalance(finalReward);
      saveGameScore('Pit Stop Strategy', newScore, finalReward);
      setStrategy(prev => ({ ...prev, lap: newLap, position, tyreWear: Math.max(0, tyreWear), fuel: Math.max(0, fuel), score: newScore, done: true, lastMessage: `🏁 Race over! P${position} — Reward: $${finalReward}`, lastDelta: delta, reward: finalReward, drsAvailable: drsNext }));
    } else {
      setStrategy(prev => ({ ...prev, lap: newLap, position, tyreWear: Math.max(0, tyreWear), fuel: Math.max(0, fuel), score: newScore, lastMessage: msg, lastDelta: delta, drsAvailable: drsNext }));
    }
  };

  // ─── Derived reaction stats ────────────────────────────────────────────────
  const reactionBest = reaction.attempts.length > 0 ? Math.min(...reaction.attempts) : null;
  const reactionAvg = reaction.attempts.length > 0
    ? Math.round(reaction.attempts.reduce((a, b) => a + b, 0) / reaction.attempts.length)
    : null;

  const rtRating = (ms: number) =>
    ms <= 150 ? { label: '🏆 PERFECT — F1 material!', color: 'text-yellow-400' }
    : ms <= 200 ? { label: '⭐ Excellent!', color: 'text-green-400' }
    : ms <= 250 ? { label: '👍 Good!', color: 'text-blue-400' }
    : ms <= 350 ? { label: '⚠️ Average', color: 'text-orange-400' }
    : { label: '🐌 Too slow!', color: 'text-red-400' };

  // ─── GAMES META ───────────────────────────────────────────────────────────
  const GAMES = [
    { id: 'quiz',     title: 'F1 Trivia',         desc: 'Test your Formula 1 knowledge across 6 randomised questions', icon: '🧠', reward: '$600',  color: 'from-blue-600 to-indigo-700',    players: 1243 },
    { id: 'reaction', title: 'Reaction Test',      desc: 'React to the lights going out like a real F1 driver — 3 attempts', icon: '⚡', reward: '$1000', color: 'from-red-600 to-rose-700',      players: 892  },
    { id: 'memory',   title: 'F1 Memory',          desc: 'Match teams with their drivers. Fewer moves = more reward', icon: '🧩', reward: '$1200', color: 'from-teal-600 to-cyan-700',      players: 567  },
    { id: 'predict',  title: 'Race Predictor',     desc: 'Predict the top 3 finishers and earn points for each correct call', icon: '🔮', reward: '$1000', color: 'from-purple-600 to-violet-700', players: 734  },
    { id: 'strategy', title: 'Pit Stop Strategy',  desc: 'Make race-winning decisions over 15 laps to climb the order', icon: '⏱️', reward: '$1500', color: 'from-orange-600 to-amber-700',   players: 421  },
  ];

  // ─── BACK BUTTON ──────────────────────────────────────────────────────────
  const BackBtn = () => (
    <button onClick={goBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group">
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      Back to Games
    </button>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-dark-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Mini <span className="text-racing-red">Games</span>
          </h1>
          <p className="text-gray-400">Play games, earn rewards, and climb the leaderboard</p>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ─── LOBBY ──────────────────────────────────────────────────── */}
          {!selectedGame && (
            <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* Games Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {GAMES.map((game, idx) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="card-hover cursor-pointer group overflow-hidden relative"
                    onClick={() => setSelectedGame(game.id)}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
                    <div className={`w-full h-28 bg-gradient-to-br ${game.color} rounded-xl flex items-center justify-center text-5xl mb-4 relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition" />
                      <span className="relative z-10 drop-shadow-lg">{game.icon}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{game.title}</h3>
                    <p className="text-gray-400 text-sm mb-4">{game.desc}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-yellow-500" />
                        <span className="text-yellow-500 font-bold text-sm">Up to {game.reward}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Users className="w-3 h-3" />
                        <span>{game.players.toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Leaderboard + History */}
              <div className="grid md:grid-cols-2 gap-6">

                {/* Top Players */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
                  <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-400" />
                    Top Players
                  </h2>
                  <div className="space-y-3">
                    {topPlayers.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-4">Loading leaderboard...</p>
                    )}
                    {topPlayers.map(player => (
                      <div key={player.rank} className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-lg">
                        <span className="text-2xl">{player.avatar}</span>
                        <div className="flex-1">
                          <p className="text-white font-bold text-sm">{player.username}</p>
                          <p className="text-gray-400 text-xs">
                            {player.score >= 0 ? '+' : ''}${player.score.toLocaleString()} profit
                          </p>
                        </div>
                        <span className={`text-lg font-black ${
                          player.rank === 1 ? 'text-yellow-400'
                          : player.rank === 2 ? 'text-gray-300'
                          : player.rank === 3 ? 'text-amber-600'
                          : 'text-gray-500'
                        }`}>
                          #{player.rank}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Recent Games — live from Firestore */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
                  <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    Recent Games
                  </h2>
                  <div className="space-y-3">
                    {gameHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <Gamepad2 className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No games played yet — play one!</p>
                      </div>
                    ) : (
                      gameHistory.slice(0, 6).map(entry => (
                        <div key={entry.id} className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-lg">
                          <div className="w-9 h-9 bg-racing-red/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <Award className="w-4 h-4 text-yellow-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-sm truncate">{entry.game}</p>
                            <p className="text-gray-500 text-xs">
                              {entry.username} • {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-yellow-400 font-bold text-sm">+${entry.reward.toLocaleString()}</p>
                            <p className="text-gray-500 text-xs">{entry.score} pts</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>

              </div>
            </motion.div>
          )}

          {/* ─── QUIZ ───────────────────────────────────────────────────── */}
          {selectedGame === 'quiz' && (
            <motion.div key="quiz" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
              <div className="card">
                <BackBtn />
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold text-white">F1 Trivia</h2>
                  <span className="text-green-400 font-bold">{quizState.score}/{quizState.questions.length}</span>
                </div>
                {/* Progress */}
                <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden mb-6">
                  <div
                    className="h-full bg-gradient-to-r from-racing-red to-red-500 transition-all duration-500"
                    style={{ width: `${((quizState.current) / quizState.questions.length) * 100}%` }}
                  />
                </div>

                {!quizState.finished ? (
                  <>
                    <p className="text-xs text-gray-500 mb-2">Question {quizState.current + 1} of {quizState.questions.length}</p>
                    <h3 className="text-lg text-white font-semibold mb-6">{quizState.questions[quizState.current].question}</h3>
                    <div className="space-y-3">
                      {quizState.questions[quizState.current].options.map((opt, i) => {
                        const isCorrect = i === quizState.questions[quizState.current].correct;
                        const isSelected = i === quizState.selectedOption;
                        let bg = 'bg-dark-800 hover:bg-dark-700 border-dark-600';
                        if (quizState.answered) {
                          if (isCorrect) bg = 'bg-green-500/20 border-green-500';
                          else if (isSelected) bg = 'bg-red-500/20 border-red-500';
                          else bg = 'bg-dark-800 border-dark-600 opacity-50';
                        }
                        return (
                          <button
                            key={i}
                            onClick={() => handleQuizAnswer(i)}
                            disabled={quizState.answered}
                            className={`w-full p-4 rounded-lg text-left border transition-all duration-200 ${bg} text-white`}
                          >
                            <span className="font-bold text-gray-400 mr-3">{String.fromCharCode(65 + i)}.</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {quizState.answered && (
                      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-300 text-sm">
                        💡 {quizState.questions[quizState.current].explanation}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                      <Trophy className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">Quiz Complete!</h3>
                    <p className="text-gray-400 mb-2">Score: {quizState.score}/{quizState.questions.length}</p>
                    <p className="text-yellow-400 font-black text-4xl mb-6">+${quizState.reward}</p>
                    <button onClick={goBack} className="btn-primary">Back to Games</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ─── REACTION ───────────────────────────────────────────────── */}
          {selectedGame === 'reaction' && (
            <motion.div key="reaction" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
              <div className="card">
                <BackBtn />
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Reaction Test</h2>
                    <p className="text-gray-400 text-sm">Attempt {Math.min(reaction.attempts.length + 1, 3)} of 3</p>
                  </div>
                  {reactionBest && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Best</p>
                      <p className="text-yellow-400 font-black text-xl">{reactionBest}ms</p>
                    </div>
                  )}
                </div>

                {/* Lights */}
                <div className="flex justify-center gap-3 mb-8">
                  {reaction.lights.map((on, i) => (
                    <div
                      key={i}
                      className={`w-14 h-14 rounded-full border-4 transition-all duration-150 ${
                        on
                          ? 'bg-red-500 border-red-400 shadow-lg shadow-red-500/60'
                          : 'bg-gray-800 border-gray-600'
                      }`}
                    />
                  ))}
                </div>

                {/* Stats row */}
                {reaction.attempts.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {reaction.attempts.map((t, i) => (
                      <div key={i} className="bg-dark-800/50 p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-500">Attempt {i + 1}</p>
                        <p className="text-white font-bold">{t}ms</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-center">
                  {reaction.stage === 'idle' && (
                    <div>
                      <p className="text-white mb-2">React when lights go OUT — 3 attempts, best score wins.</p>
                      {reaction.falsestarts > 0 && <p className="text-red-400 text-sm mb-2">⚠️ {reaction.falsestarts} false start(s)</p>}
                      <button onClick={startReaction} className="btn-primary text-lg px-10 py-4">Start Test</button>
                    </div>
                  )}
                  {(reaction.stage === 'waiting' || reaction.stage === 'ready') && (
                    <div onClick={handleReactionClick} className="cursor-pointer select-none">
                      <p className="text-yellow-400 text-2xl font-black animate-pulse mb-4">
                        {reaction.stage === 'waiting' ? 'Get ready...' : 'Lights coming on...'}
                      </p>
                      <p className="text-gray-500 text-sm">DON'T click yet — wait for lights out!</p>
                    </div>
                  )}
                  {reaction.stage === 'go' && (
                    <div>
                      <p className="text-green-400 text-3xl font-black mb-4 animate-pulse">🚦 LIGHTS OUT — GO!</p>
                      <button onClick={handleReactionClick} className="btn-primary text-2xl px-16 py-6 bg-green-500 hover:bg-green-600">
                        ⚡ CLICK NOW ⚡
                      </button>
                    </div>
                  )}
                  {reaction.stage === 'result' && (
                    <div>
                      {reaction.reactionTime === -1 ? (
                        <p className="text-red-400 text-xl font-bold mb-4">🚫 FALSE START! -0 points</p>
                      ) : (
                        <>
                          <p className="text-2xl text-white mb-1">
                            <span className="text-yellow-400 font-black">{reaction.reactionTime}ms</span>
                          </p>
                          <p className={`font-bold mb-4 ${rtRating(reaction.reactionTime).color}`}>
                            {rtRating(reaction.reactionTime).label}
                          </p>
                        </>
                      )}
                      <button onClick={startReaction} className="btn-primary">
                        Next Attempt ({3 - reaction.attempts.length} left)
                      </button>
                    </div>
                  )}
                  {reaction.stage === 'done' && (
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">All Done!</h3>
                      <p className="text-gray-400 mb-1">Best: <span className="text-yellow-400 font-bold">{reactionBest}ms</span></p>
                      <p className="text-gray-400 mb-4">Avg: <span className="text-blue-400 font-bold">{reactionAvg}ms</span></p>
                      {reactionBest && <p className={`font-bold text-lg mb-4 ${rtRating(reactionBest).color}`}>{rtRating(reactionBest).label}</p>}
                      <p className="text-yellow-400 font-black text-3xl mb-6">
                        +${reactionBest && reactionBest <= 150 ? 1000 : reactionBest && reactionBest <= 200 ? 800 : reactionBest && reactionBest <= 250 ? 600 : reactionBest && reactionBest <= 300 ? 400 : reactionBest && reactionBest <= 400 ? 200 : 100}
                      </p>
                      <button onClick={goBack} className="btn-primary">Back to Games</button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── MEMORY ─────────────────────────────────────────────────── */}
          {selectedGame === 'memory' && (
            <motion.div key="memory" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto">
              <div className="card">
                <BackBtn />
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">F1 Memory</h2>
                    <p className="text-gray-400 text-sm">Match each team with their driver</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white">Moves: <span className="text-yellow-400 font-bold">{memory.moves}</span></p>
                    <p className="text-gray-400 text-sm">Matched: {memory.matched}/4</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-6">
                  {memory.cards.map(card => (
                    <motion.div
                      key={card.id}
                      onClick={() => handleMemoryClick(card.id)}
                      whileTap={{ scale: 0.95 }}
                      className={`aspect-square rounded-xl flex items-center justify-center cursor-pointer border-2 transition-all duration-300 ${
                        card.matched
                          ? 'border-green-500 bg-green-500/20 cursor-default'
                          : card.flipped
                          ? 'border-racing-red bg-racing-red/20'
                          : 'border-dark-600 bg-dark-800 hover:border-racing-red hover:bg-dark-700'
                      }`}
                    >
                      {card.flipped || card.matched ? (
                        <div className="text-center p-1">
                          <div className="text-2xl mb-1">{card.emoji}</div>
                          <p className="text-white text-xs font-bold leading-tight">{card.name}</p>
                          <p className="text-gray-400 text-xs">{card.type}</p>
                        </div>
                      ) : (
                        <span className="text-3xl">❓</span>
                      )}
                    </motion.div>
                  ))}
                </div>

                {memory.done && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
                    <p className="text-3xl mb-2">🎉</p>
                    <h3 className="text-2xl font-bold text-white mb-1">Completed in {memory.moves} moves!</h3>
                    <p className="text-yellow-400 font-black text-3xl mb-4">+${memory.reward}</p>
                    <div className="flex gap-3 justify-center">
                      <button onClick={resetMemory} className="btn-secondary flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Play Again</button>
                      <button onClick={goBack} className="btn-primary">Back to Games</button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ─── PREDICT ────────────────────────────────────────────────── */}
          {selectedGame === 'predict' && (
            <motion.div key="predict" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
              <div className="card">
                <BackBtn />
                <h2 className="text-2xl font-bold text-white mb-1">Race Predictor</h2>
                <p className="text-gray-400 text-sm mb-6">Pick the top 3 finishers — exact order earns bonus!</p>

                {!predict.submitted ? (
                  <>
                    <div className="space-y-4 mb-6">
                      {(['first', 'second', 'third'] as const).map((pos, idx) => (
                        <div key={pos}>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'} {idx + 1}{idx === 0 ? 'st' : idx === 1 ? 'nd' : 'rd'} Place
                          </label>
                          <select
                            value={predict.picks[pos]}
                            onChange={e => setPredict(prev => ({ ...prev, picks: { ...prev.picks, [pos]: e.target.value } }))}
                            className="w-full p-3 bg-dark-800 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-racing-red focus:outline-none"
                          >
                            <option value="">Select Driver...</option>
                            {PREDICT_DRIVERS.map(d => (
                              <option key={d.id} value={d.id}>
                                {d.name} ({d.team}) — {d.odds}x
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                    <div className="bg-dark-800/50 rounded-lg p-4 mb-6 text-sm text-gray-400">
                      <p>💰 P1 correct: <span className="text-green-400">+$300</span> | P2: <span className="text-green-400">+$200</span> | P3: <span className="text-green-400">+$150</span></p>
                      <p className="mt-1">🎯 All 3 exact: <span className="text-yellow-400">+$500 bonus!</span></p>
                    </div>
                    <button onClick={submitPredict} className="btn-primary w-full">Submit Prediction</button>
                  </>
                ) : (
                  <div>
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div className="bg-dark-800/50 p-4 rounded-lg">
                        <p className="text-gray-400 text-xs mb-3 uppercase tracking-wide">Your Picks</p>
                        {(['first','second','third'] as const).map((pos, i) => (
                          <p key={pos} className="text-white text-sm mb-1">
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {PREDICT_DRIVERS.find(d => d.id === predict.picks[pos])?.name ?? '—'}
                          </p>
                        ))}
                      </div>
                      <div className="bg-dark-800/50 p-4 rounded-lg">
                        <p className="text-gray-400 text-xs mb-3 uppercase tracking-wide">Actual Results</p>
                        {predict.actual.map((id, i) => (
                          <p key={i} className="text-white text-sm mb-1">
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {PREDICT_DRIVERS.find(d => d.id === id)?.name ?? id}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="text-center bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6">
                      <p className="text-gray-400 mb-1">Points earned: <span className="text-white font-bold">{predict.points}</span></p>
                      <p className="text-yellow-400 font-black text-4xl mb-4">+${predict.reward}</p>
                      {predict.reward === 0 && <p className="text-gray-500 text-sm mb-4">No correct picks this time — try again!</p>}
                      <button onClick={goBack} className="btn-primary">Back to Games</button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ─── STRATEGY ───────────────────────────────────────────────── */}
          {selectedGame === 'strategy' && (
            <motion.div key="strategy" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto">
              <div className="card">
                <BackBtn />
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Pit Stop Strategy</h2>
                    <p className="text-gray-400 text-sm">Make tactical decisions to climb the order</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Score</p>
                    <p className={`text-2xl font-black ${strategy.score >= 0 ? 'text-green-400' : 'text-red-400'}`}>{strategy.score}</p>
                  </div>
                </div>

                {/* Last message */}
                <AnimatePresence>
                  {strategy.lastMessage && (
                    <motion.div
                      key={strategy.lastMessage}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`p-3 rounded-lg mb-4 text-sm font-medium ${
                        strategy.lastMessage.includes('✅') || strategy.lastMessage.includes('🔥') ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                        : strategy.lastMessage.includes('❌') || strategy.lastMessage.includes('⚠️') ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {strategy.lastMessage}
                      {strategy.lastDelta !== 0 && (
                        <span className={`ml-2 font-black ${strategy.lastDelta > 0 ? 'text-green-300' : 'text-red-300'}`}>
                          {strategy.lastDelta > 0 ? `+${strategy.lastDelta}` : strategy.lastDelta} pts
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* Race Status */}
                  <div className="bg-dark-800/50 p-5 rounded-xl">
                    <h3 className="text-white font-bold mb-4">Race Status</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Lap', value: `${strategy.lap}/57`, color: 'text-white' },
                        { label: 'Position', value: `P${strategy.position}`, color: strategy.position <= 3 ? 'text-yellow-400' : 'text-white' },
                        { label: 'Tyre Wear', value: `${Math.round(strategy.tyreWear)}%`, color: strategy.tyreWear > 60 ? 'text-green-400' : strategy.tyreWear > 30 ? 'text-yellow-400' : 'text-red-400' },
                        { label: 'Fuel', value: `${Math.round(strategy.fuel)} kg`, color: strategy.fuel > 40 ? 'text-green-400' : 'text-yellow-400' },
                        { label: 'DRS', value: strategy.drsAvailable ? 'Available ✅' : 'Not available', color: strategy.drsAvailable ? 'text-green-400' : 'text-gray-500' },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between">
                          <span className="text-gray-400">{row.label}</span>
                          <span className={`font-bold ${row.color}`}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                    {/* Tyre bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Tyre</span><span>{Math.round(strategy.tyreWear)}%</span></div>
                      <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${strategy.tyreWear > 60 ? 'bg-green-500' : strategy.tyreWear > 30 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${strategy.tyreWear}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="bg-dark-800/50 p-5 rounded-xl">
                    <h3 className="text-white font-bold mb-4">Actions</h3>
                    <div className="space-y-3">
                      {[
                        { key: 'overtake', label: '🏎️ Attempt Overtake',  color: 'bg-racing-red hover:bg-red-700',         desc: '60% chance +pos, uses tyres' },
                        { key: 'drs',      label: '⚡ Activate DRS',      color: 'bg-blue-600 hover:bg-blue-700',          desc: 'Only works when DRS available' },
                        { key: 'pit',      label: '🛑 Pit Stop',          color: 'bg-yellow-600 hover:bg-yellow-700',      desc: 'Fresh tyres, lose 2 positions' },
                        { key: 'defend',   label: '🛡️ Defend Position',   color: 'bg-purple-600 hover:bg-purple-700',      desc: '65% chance to hold position' },
                        { key: 'push',     label: '🔥 Push Hard',         color: 'bg-orange-600 hover:bg-orange-700',      desc: '50% to gain pos, heavy tyre wear' },
                      ].map(action => (
                        <button
                          key={action.key}
                          onClick={() => makeStrategyDecision(action.key)}
                          disabled={strategy.done}
                          className={`w-full p-3 rounded-lg text-white text-sm font-bold transition-colors ${action.color} disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between`}
                        >
                          <span>{action.label}</span>
                          <span className="text-xs opacity-70">{action.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {strategy.done && (
                  <div className="text-center bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-6">
                    <p className="text-2xl font-bold text-white mb-1">Race Complete!</p>
                    <p className="text-gray-400 mb-3">Final Position: <span className="text-yellow-400 font-black">P{strategy.position}</span></p>
                    <p className="text-yellow-400 font-black text-4xl mb-4">+${strategy.reward}</p>
                    <button onClick={goBack} className="btn-primary">Back to Games</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default Games;
