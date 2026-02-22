import { doc, setDoc, collection, getDocs, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Driver, Race } from '../types';

// Real F1 2024 Drivers with official data
export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'max_verstappen',
    name: 'Max Verstappen',
    driverNumber: 1,
    team: 'Red Bull Racing',
    nationality: 'Dutch',
    price: 5500,
    basePrice: 5500,
    change: 0,
    changePercent: 0,
    points: 0,
    rank: 1,
    wins: 0,
    podiums: 0,
    teamColor: '#3671C6',
    helmetImg: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/manual/Helmets2024/verstappen.png',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/verstappen.jpg',
    risk: 'low',
    history: [],
    attributes: { speed: 98, experience: 90, aggression: 75, consistency: 96, fanbase: 95 },
    marketCap: 0,
    volume24h: 0,
    rsi: 50,
    sentiment: 'neutral',
    rating: 'Buy',
    recentTrades: []
  },
  {
    id: 'sergio_perez',
    name: 'Sergio Perez',
    driverNumber: 11,
    team: 'Red Bull Racing',
    nationality: 'Mexican',
    price: 3200,
    basePrice: 3200,
    change: 0,
    changePercent: 0,
    points: 0,
    rank: 2,
    wins: 0,
    podiums: 0,
    teamColor: '#3671C6',
    helmetImg: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/manual/Helmets2024/perez.png',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/perez.jpg',
    risk: 'medium',
    history: [],
    attributes: { speed: 85, experience: 88, aggression: 68, consistency: 78, fanbase: 87 },
    marketCap: 0,
    volume24h: 0,
    rsi: 50,
    sentiment: 'neutral',
    rating: 'Hold',
    recentTrades: []
  },
  {
    id: 'lewis_hamilton',
    name: 'Lewis Hamilton',
    driverNumber: 44,
    team: 'Mercedes',
    nationality: 'British',
    price: 4800,
    basePrice: 4800,
    change: 0,
    changePercent: 0,
    points: 0,
    rank: 3,
    wins: 0,
    podiums: 0,
    teamColor: '#27F4D2',
    helmetImg: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/manual/Helmets2024/hamilton.png',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/hamilton.jpg',
    risk: 'low',
    history: [],
    attributes: { speed: 94, experience: 99, aggression: 70, consistency: 92, fanbase: 99 },
    marketCap: 0,
    volume24h: 0,
    rsi: 50,
    sentiment: 'neutral',
    rating: 'Buy',
    recentTrades: []
  },
  {
    id: 'george_russell',
    name: 'George Russell',
    driverNumber: 63,
    team: 'Mercedes',
    nationality: 'British',
    price: 3400,
    basePrice: 3400,
    change: 0,
    changePercent: 0,
    points: 0,
    rank: 4,
    wins: 0,
    podiums: 0,
    teamColor: '#27F4D2',
    helmetImg: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/manual/Helmets2024/russell.png',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/russell.jpg',
    risk: 'medium',
    history: [],
    attributes: { speed: 89, experience: 75, aggression: 82, consistency: 85, fanbase: 82 },
    marketCap: 0,
    volume24h: 0,
    rsi: 50,
    sentiment: 'neutral',
    rating: 'Hold',
    recentTrades: []
  },
  {
    id: 'charles_leclerc',
    name: 'Charles Leclerc',
    driverNumber: 16,
    team: 'Ferrari',
    nationality: 'Monegasque',
    price: 4200,
    basePrice: 4200,
    change: 0,
    changePercent: 0,
    points: 0,
    rank: 5,
    wins: 0,
    podiums: 0,
    teamColor: '#E8002D',
    helmetImg: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/manual/Helmets2024/leclerc.png',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/leclerc.jpg',
    risk: 'medium',
    history: [],
    attributes: { speed: 96, experience: 78, aggression: 88, consistency: 82, fanbase: 93 },
    marketCap: 0,
    volume24h: 0,
    rsi: 50,
    sentiment: 'neutral',
    rating: 'Buy',
    recentTrades: []
  },
  {
    id: 'carlos_sainz',
    name: 'Carlos Sainz',
    driverNumber: 55,
    team: 'Ferrari',
    nationality: 'Spanish',
    price: 3600,
    basePrice: 3600,
    change: 0,
    changePercent: 0,
    points: 0,
    rank: 6,
    wins: 0,
    podiums: 0,
    teamColor: '#E8002D',
    helmetImg: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/manual/Helmets2024/sainz.png',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/sainz.jpg',
    risk: 'low',
    history: [],
    attributes: { speed: 88, experience: 82, aggression: 72, consistency: 89, fanbase: 85 },
    marketCap: 0,
    volume24h: 0,
    rsi: 50,
    sentiment: 'neutral',
    rating: 'Buy',
    recentTrades: []
  },
  {
    id: 'lando_norris',
    name: 'Lando Norris',
    driverNumber: 4,
    team: 'McLaren',
    nationality: 'British',
    price: 3800,
    basePrice: 3800,
    change: 0,
    changePercent: 0,
    points: 0,
    rank: 7,
    wins: 0,
    podiums: 0,
    teamColor: '#FF8000',
    helmetImg: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/manual/Helmets2024/norris.png',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/norris.jpg',
    risk: 'low',
    history: [],
    attributes: { speed: 92, experience: 76, aggression: 79, consistency: 90, fanbase: 94 },
    marketCap: 0,
    volume24h: 0,
    rsi: 50,
    sentiment: 'neutral',
    rating: 'Strong Buy',
    recentTrades: []
  },
  {
    id: 'oscar_piastri',
    name: 'Oscar Piastri',
    driverNumber: 81,
    team: 'McLaren',
    nationality: 'Australian',
    price: 2800,
    basePrice: 2800,
    change: 0,
    changePercent: 0,
    points: 0,
    rank: 8,
    wins: 0,
    podiums: 0,
    teamColor: '#FF8000',
    helmetImg: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/manual/Helmets2024/piastri.png',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/piastri.jpg',
    risk: 'medium',
    history: [],
    attributes: { speed: 90, experience: 62, aggression: 74, consistency: 88, fanbase: 80 },
    marketCap: 0,
    volume24h: 0,
    rsi: 50,
    sentiment: 'neutral',
    rating: 'Buy',
    recentTrades: []
  },
  {
    id: 'fernando_alonso',
    name: 'Fernando Alonso',
    driverNumber: 14,
    team: 'Aston Martin',
    nationality: 'Spanish',
    price: 3300,
    basePrice: 3300,
    change: 0,
    changePercent: 0,
    points: 0,
    rank: 9,
    wins: 0,
    podiums: 0,
    teamColor: '#229971',
    helmetImg: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/manual/Helmets2024/alonso.png',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/alonso.jpg',
    risk: 'medium',
    history: [],
    attributes: { speed: 87, experience: 99, aggression: 85, consistency: 92, fanbase: 91 },
    marketCap: 0,
    volume24h: 0,
    rsi: 50,
    sentiment: 'neutral',
    rating: 'Hold',
    recentTrades: []
  },
  {
    id: 'lance_stroll',
    name: 'Lance Stroll',
    driverNumber: 18,
    team: 'Aston Martin',
    nationality: 'Canadian',
    price: 2200,
    basePrice: 2200,
    change: 0,
    changePercent: 0,
    points: 0,
    rank: 10,
    wins: 0,
    podiums: 0,
    teamColor: '#229971',
    helmetImg: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/manual/Helmets2024/stroll.png',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/stroll.jpg',
    risk: 'high',
    history: [],
    attributes: { speed: 78, experience: 76, aggression: 84, consistency: 65, fanbase: 62 },
    marketCap: 0,
    volume24h: 0,
    rsi: 50,
    sentiment: 'neutral',
    rating: 'Hold',
    recentTrades: []
  },
  {
    id: 'pierre_gasly',
    name: 'Pierre Gasly',
    driverNumber: 10,
    team: 'Alpine',
    nationality: 'French',
    price: 2400,
    basePrice: 2400,
    change: 0,
    changePercent: 0,
    points: 0,
    rank: 11,
    wins: 0,
    podiums: 0,
    teamColor: '#FF87BC',
    helmetImg: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/manual/Helmets2024/gasly.png',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/gasly.jpg',
    risk: 'medium',
    history: [],
    attributes: { speed: 81, experience: 78, aggression: 79, consistency: 76, fanbase: 75 },
    marketCap: 0,
    volume24h: 0,
    rsi: 50,
    sentiment: 'neutral',
    rating: 'Hold',
    recentTrades: []
  },
  {
    id: 'esteban_ocon',
    name: 'Esteban Ocon',
    driverNumber: 31,
    team: 'Alpine',
    nationality: 'French',
    price: 2300,
    basePrice: 2300,
    change: 0,
    changePercent: 0,
    points: 0,
    rank: 12,
    wins: 0,
    podiums: 0,
    teamColor: '#FF87BC',
    helmetImg: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/manual/Helmets2024/ocon.png',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/ocon.jpg',
    risk: 'medium',
    history: [],
    attributes: { speed: 80, experience: 79, aggression: 86, consistency: 74, fanbase: 72 },
    marketCap: 0,
    volume24h: 0,
    rsi: 50,
    sentiment: 'neutral',
    rating: 'Hold',
    recentTrades: []
  },
  {
    id: 'alexander_albon',
    name: 'Alexander Albon',
    driverNumber: 23,
    team: 'Williams',
    nationality: 'Thai',
    price: 2500,
    basePrice: 2500,
    change: 0,
    changePercent: 0,
    points: 0,
    rank: 13,
    wins: 0,
    podiums: 0,
    teamColor: '#64C4FF',
    helmetImg: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/manual/Helmets2024/albon.png',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/albon.jpg',
    risk: 'medium',
    history: [],
    attributes: { speed: 85, experience: 74, aggression: 72, consistency: 85, fanbase: 80 },
    marketCap: 0,
    volume24h: 0,
    rsi: 50,
    sentiment: 'neutral',
    rating: 'Buy',
    recentTrades: []
  },
  {
    id: 'logan_sargeant',
    name: 'Logan Sargeant',
    driverNumber: 2,
    team: 'Williams',
    nationality: 'American',
    price: 1800,
    basePrice: 1800,
    change: 0,
    changePercent: 0,
    points: 0,
    rank: 14,
    wins: 0,
    podiums: 0,
    teamColor: '#64C4FF',
    helmetImg: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/manual/Helmets2024/sargeant.png',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/sargeant.jpg',
    risk: 'high',
    history: [],
    attributes: { speed: 75, experience: 58, aggression: 70, consistency: 68, fanbase: 65 },
    marketCap: 0,
    volume24h: 0,
    rsi: 50,
    sentiment: 'neutral',
    rating: 'Hold',
    recentTrades: []
  },
  {
    id: 'yuki_tsunoda',
    name: 'Yuki Tsunoda',
    driverNumber: 22,
    team: 'RB',
    nationality: 'Japanese',
    price: 2100,
    basePrice: 2100,
    change: 0,
    changePercent: 0,
    points: 0,
    rank: 15,
    wins: 0,
    podiums: 0,
    teamColor: '#6692FF',
    helmetImg: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/manual/Helmets2024/tsunoda.png',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/tsunoda.jpg',
    risk: 'high',
    history: [],
    attributes: { speed: 84, experience: 68, aggression: 92, consistency: 71, fanbase: 82 },
    marketCap: 0,
    volume24h: 0,
    rsi: 50,
    sentiment: 'neutral',
    rating: 'Hold',
    recentTrades: []
  },
  {
    id: 'daniel_ricciardo',
    name: 'Daniel Ricciardo',
    driverNumber: 3,
    team: 'RB',
    nationality: 'Australian',
    price: 2600,
    basePrice: 2600,
    change: 0,
    changePercent: 0,
    points: 0,
    rank: 16,
    wins: 0,
    podiums: 0,
    teamColor: '#6692FF',
    helmetImg: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/manual/Helmets2024/ricciardo.png',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/ricciardo.jpg',
    risk: 'medium',
    history: [],
    attributes: { speed: 80, experience: 92, aggression: 70, consistency: 78, fanbase: 98 },
    marketCap: 0,
    volume24h: 0,
    rsi: 50,
    sentiment: 'neutral',
    rating: 'Hold',
    recentTrades: []
  },
  {
    id: 'nico_hulkenberg',
    name: 'Nico Hulkenberg',
    driverNumber: 27,
    team: 'Haas',
    nationality: 'German',
    price: 2200,
    basePrice: 2200,
    change: 0,
    changePercent: 0,
    points: 0,
    rank: 17,
    wins: 0,
    podiums: 0,
    teamColor: '#B6BABD',
    helmetImg: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/manual/Helmets2024/hulkenberg.png',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/hulkenberg.jpg',
    risk: 'medium',
    history: [],
    attributes: { speed: 85, experience: 86, aggression: 72, consistency: 88, fanbase: 72 },
    marketCap: 0,
    volume24h: 0,
    rsi: 50,
    sentiment: 'neutral',
    rating: 'Buy',
    recentTrades: []
  },
  {
    id: 'kevin_magnussen',
    name: 'Kevin Magnussen',
    driverNumber: 20,
    team: 'Haas',
    nationality: 'Danish',
    price: 1900,
    basePrice: 1900,
    change: 0,
    changePercent: 0,
    points: 0,
    rank: 18,
    wins: 0,
    podiums: 0,
    teamColor: '#B6BABD',
    helmetImg: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/manual/Helmets2024/magnussen.png',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/magnussen.jpg',
    risk: 'high',
    history: [],
    attributes: { speed: 81, experience: 82, aggression: 94, consistency: 68, fanbase: 74 },
    marketCap: 0,
    volume24h: 0,
    rsi: 50,
    sentiment: 'neutral',
    rating: 'Hold',
    recentTrades: []
  },
  {
    id: 'valtteri_bottas',
    name: 'Valtteri Bottas',
    driverNumber: 77,
    team: 'Sauber',
    nationality: 'Finnish',
    price: 2400,
    basePrice: 2400,
    change: 0,
    changePercent: 0,
    points: 0,
    rank: 19,
    wins: 0,
    podiums: 0,
    teamColor: '#52E252',
    helmetImg: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/manual/Helmets2024/bottas.png',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/bottas.jpg',
    risk: 'medium',
    history: [],
    attributes: { speed: 80, experience: 88, aggression: 65, consistency: 82, fanbase: 78 },
    marketCap: 0,
    volume24h: 0,
    rsi: 50,
    sentiment: 'neutral',
    rating: 'Hold',
    recentTrades: []
  },
  {
    id: 'guanyu_zhou',
    name: 'Guanyu Zhou',
    driverNumber: 24,
    team: 'Sauber',
    nationality: 'Chinese',
    price: 1700,
    basePrice: 1700,
    change: 0,
    changePercent: 0,
    points: 0,
    rank: 20,
    wins: 0,
    podiums: 0,
    teamColor: '#52E252',
    helmetImg: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/manual/Helmets2024/zhou.png',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/zhou.jpg',
    risk: 'high',
    history: [],
    attributes: { speed: 76, experience: 68, aggression: 65, consistency: 78, fanbase: 70 },
    marketCap: 0,
    volume24h: 0,
    rsi: 50,
    sentiment: 'neutral',
    rating: 'Hold',
    recentTrades: []
  }
];

// Generate race schedule from today to Feb 28, 2026
export const generateMockSchedule = (): Race[] => {
  const circuits = [
    {
      name: 'Bahrain Grand Prix',
      location: 'Sakhir',
      country: 'Bahrain',
      circuitId: 'bahrain',
      length: 5.412,
      laps: 57,
      weather: 'Hot & Dry',
      climate: 'Desert',
      lastWinner: 'Max Verstappen',
      lastWinnerYear: 2023,
      tireTypes: ['Soft', 'Medium', 'Hard'],
      conditions: 'Clear skies, high temperatures'
    },
    {
      name: 'Saudi Arabian Grand Prix',
      location: 'Jeddah',
      country: 'Saudi Arabia',
      circuitId: 'jeddah',
      length: 6.174,
      laps: 50,
      weather: 'Warm & Clear',
      climate: 'Urban',
      lastWinner: 'Max Verstappen',
      lastWinnerYear: 2023,
      tireTypes: ['Soft', 'Medium'],
      conditions: 'City circuit, wall of champions'
    },
    {
      name: 'Australian Grand Prix',
      location: 'Melbourne',
      country: 'Australia',
      circuitId: 'albert_park',
      length: 5.278,
      laps: 58,
      weather: 'Mild & Sunny',
      climate: 'Temperate',
      lastWinner: 'Carlos Sainz',
      lastWinnerYear: 2023,
      tireTypes: ['Soft', 'Medium', 'Hard'],
      conditions: 'Street circuit, variable weather'
    },
    {
      name: 'Japanese Grand Prix',
      location: 'Suzuka',
      country: 'Japan',
      circuitId: 'suzuka',
      length: 5.807,
      laps: 53,
      weather: 'Cool & Rainy',
      climate: 'Temperate',
      lastWinner: 'Max Verstappen',
      lastWinnerYear: 2022,
      tireTypes: ['Soft', 'Medium', 'Intermediate'],
      conditions: 'Figure-8 layout, often wet'
    },
    {
      name: 'Chinese Grand Prix',
      location: 'Shanghai',
      country: 'China',
      circuitId: 'shanghai',
      length: 5.451,
      laps: 56,
      weather: 'Warm & Humid',
      climate: 'Subtropical',
      lastWinner: 'Max Verstappen',
      lastWinnerYear: 2019,
      tireTypes: ['Soft', 'Medium', 'Hard'],
      conditions: 'High speed corners, humid'
    },
    {
      name: 'Miami Grand Prix',
      location: 'Miami',
      country: 'USA',
      circuitId: 'miami',
      length: 5.412,
      laps: 57,
      weather: 'Hot & Humid',
      climate: 'Tropical',
      lastWinner: 'Max Verstappen',
      lastWinnerYear: 2023,
      tireTypes: ['Soft', 'Medium'],
      conditions: 'Street circuit, very hot'
    },
    {
      name: 'Emilia Romagna Grand Prix',
      location: 'Imola',
      country: 'Italy',
      circuitId: 'imola',
      length: 4.909,
      laps: 63,
      weather: 'Variable',
      climate: 'Mediterranean',
      lastWinner: 'Max Verstappen',
      lastWinnerYear: 2022,
      tireTypes: ['Soft', 'Medium', 'Intermediate'],
      conditions: 'Historic circuit, unpredictable weather'
    },
    {
      name: 'Monaco Grand Prix',
      location: 'Monaco',
      country: 'Monaco',
      circuitId: 'monaco',
      length: 3.337,
      laps: 78,
      weather: 'Mild & Sunny',
      climate: 'Mediterranean',
      lastWinner: 'Max Verstappen',
      lastWinnerYear: 2023,
      tireTypes: ['Soft', 'Medium'],
      conditions: 'Street circuit, low speeds, barriers'
    },
    {
      name: 'Canadian Grand Prix',
      location: 'Montreal',
      country: 'Canada',
      circuitId: 'villeneuve',
      length: 4.361,
      laps: 70,
      weather: 'Cool & Rainy',
      climate: 'Temperate',
      lastWinner: 'Max Verstappen',
      lastWinnerYear: 2022,
      tireTypes: ['Soft', 'Medium', 'Intermediate'],
      conditions: 'Street circuit, often wet'
    },
    {
      name: 'Spanish Grand Prix',
      location: 'Barcelona',
      country: 'Spain',
      circuitId: 'catalunya',
      length: 4.675,
      laps: 66,
      weather: 'Warm & Sunny',
      climate: 'Mediterranean',
      lastWinner: 'Max Verstappen',
      lastWinnerYear: 2023,
      tireTypes: ['Soft', 'Medium', 'Hard'],
      conditions: 'Technical circuit, high grip'
    },
    {
      name: 'Austrian Grand Prix',
      location: 'Spielberg',
      country: 'Austria',
      circuitId: 'red_bull_ring',
      length: 4.318,
      laps: 71,
      weather: 'Cool & Sunny',
      climate: 'Alpine',
      lastWinner: 'Max Verstappen',
      lastWinnerYear: 2023,
      tireTypes: ['Soft', 'Medium'],
      conditions: 'High altitude, fast straights'
    },
    {
      name: 'British Grand Prix',
      location: 'Silverstone',
      country: 'UK',
      circuitId: 'silverstone',
      length: 5.891,
      laps: 52,
      weather: 'Cool & Variable',
      climate: 'Temperate',
      lastWinner: 'Max Verstappen',
      lastWinnerYear: 2023,
      tireTypes: ['Soft', 'Medium', 'Hard'],
      conditions: 'Historic circuit, variable weather'
    },
    {
      name: 'Hungarian Grand Prix',
      location: 'Budapest',
      country: 'Hungary',
      circuitId: 'hungaroring',
      length: 4.381,
      laps: 70,
      weather: 'Hot & Dry',
      climate: 'Continental',
      lastWinner: 'Max Verstappen',
      lastWinnerYear: 2022,
      tireTypes: ['Soft', 'Medium', 'Hard'],
      conditions: 'Technical, high degradation'
    },
    {
      name: 'Belgian Grand Prix',
      location: 'Spa',
      country: 'Belgium',
      circuitId: 'spa',
      length: 7.004,
      laps: 44,
      weather: 'Cool & Rainy',
      climate: 'Temperate',
      lastWinner: 'Max Verstappen',
      lastWinnerYear: 2023,
      tireTypes: ['Soft', 'Medium', 'Intermediate'],
      conditions: 'Long straights, Ardennes forest'
    },
    {
      name: 'Dutch Grand Prix',
      location: 'Zandvoort',
      country: 'Netherlands',
      circuitId: 'zandvoort',
      length: 4.259,
      laps: 72,
      weather: 'Cool & Windy',
      climate: 'Maritime',
      lastWinner: 'Max Verstappen',
      lastWinnerYear: 2022,
      tireTypes: ['Soft', 'Medium'],
      conditions: 'Dunes circuit, very windy'
    },
    {
      name: 'Italian Grand Prix',
      location: 'Monza',
      country: 'Italy',
      circuitId: 'monza',
      length: 5.793,
      laps: 53,
      weather: 'Warm & Sunny',
      climate: 'Mediterranean',
      lastWinner: 'Max Verstappen',
      lastWinnerYear: 2023,
      tireTypes: ['Soft', 'Medium'],
      conditions: 'Temple of Speed, high speeds'
    },
    {
      name: 'Azerbaijan Grand Prix',
      location: 'Baku',
      country: 'Azerbaijan',
      circuitId: 'baku',
      length: 6.003,
      laps: 51,
      weather: 'Hot & Dry',
      climate: 'Semi-arid',
      lastWinner: 'Sergio Perez',
      lastWinnerYear: 2023,
      tireTypes: ['Soft', 'Medium'],
      conditions: 'Street circuit, old city walls'
    },
    {
      name: 'Singapore Grand Prix',
      location: 'Singapore',
      country: 'Singapore',
      circuitId: 'marina_bay',
      length: 4.928,
      laps: 62,
      weather: 'Hot & Humid',
      climate: 'Tropical',
      lastWinner: 'Carlos Sainz',
      lastWinnerYear: 2023,
      tireTypes: ['Soft', 'Medium'],
      conditions: 'Night race, street circuit, humid'
    },
    {
      name: 'United States Grand Prix',
      location: 'Austin',
      country: 'USA',
      circuitId: 'americas',
      length: 5.513,
      laps: 56,
      weather: 'Hot & Dry',
      climate: 'Subtropical',
      lastWinner: 'Max Verstappen',
      lastWinnerYear: 2023,
      tireTypes: ['Soft', 'Medium', 'Hard'],
      conditions: 'High speeds, desert-like'
    },
    {
      name: 'Mexico City Grand Prix',
      location: 'Mexico City',
      country: 'Mexico',
      circuitId: 'rodriguez',
      length: 4.304,
      laps: 71,
      weather: 'Cool & Clear',
      climate: 'Highland',
      lastWinner: 'Max Verstappen',
      lastWinnerYear: 2022,
      tireTypes: ['Soft', 'Medium'],
      conditions: 'High altitude, thin air'
    },
  ];

  const races: Race[] = [];
  const today = new Date();

  // Create some completed races (fixed dates in the past)
  const completedRaces = [
    {
      round: 1,
      raceName: circuits[0].name,
      circuit: {
        circuitId: circuits[0].circuitId,
        circuitName: circuits[0].name,
        location: circuits[0].location,
        country: circuits[0].country,
        lat: '0',
        long: '0'
      },
      date: '2024-03-02',
      time: '18:00:00',
      completed: true,
      isLive: false,
      sessionKey: 1,
      laps: circuits[0].laps,
      weather: circuits[0].weather,
      climate: circuits[0].climate,
      lastWinner: circuits[0].lastWinner,
      lastWinnerYear: circuits[0].lastWinnerYear,
      tireTypes: circuits[0].tireTypes,
      conditions: circuits[0].conditions,
      results: [
        { position: 1, driverId: 'max_verstappen', driverNumber: 1, points: 25, laps: circuits[0].laps, status: 'Finished' },
        { position: 2, driverId: 'sergio_perez', driverNumber: 11, points: 18, laps: circuits[0].laps, status: 'Finished' },
        { position: 3, driverId: 'charles_leclerc', driverNumber: 16, points: 15, laps: circuits[0].laps, status: 'Finished' },
        { position: 4, driverId: 'lando_norris', driverNumber: 4, points: 12, laps: circuits[0].laps, status: 'Finished' },
        { position: 5, driverId: 'lewis_hamilton', driverNumber: 44, points: 10, laps: circuits[0].laps, status: 'Finished' },
        { position: 6, driverId: 'george_russell', driverNumber: 63, points: 8, laps: circuits[0].laps, status: 'Finished' },
        { position: 7, driverId: 'carlos_sainz', driverNumber: 55, points: 6, laps: circuits[0].laps, status: 'Finished' },
        { position: 8, driverId: 'oscar_piastri', driverNumber: 81, points: 4, laps: circuits[0].laps, status: 'Finished' },
        { position: 9, driverId: 'fernando_alonso', driverNumber: 14, points: 2, laps: circuits[0].laps, status: 'Finished' },
        { position: 10, driverId: 'pierre_gasly', driverNumber: 10, points: 1, laps: circuits[0].laps, status: 'Finished' }
      ]
    },
    {
      round: 2,
      raceName: circuits[1].name,
      circuit: {
        circuitId: circuits[1].circuitId,
        circuitName: circuits[1].name,
        location: circuits[1].location,
        country: circuits[1].country,
        lat: '0',
        long: '0'
      },
      date: '2024-03-09',
      time: '20:00:00',
      completed: true,
      isLive: false,
      sessionKey: 2,
      laps: circuits[1].laps,
      weather: circuits[1].weather,
      climate: circuits[1].climate,
      lastWinner: circuits[1].lastWinner,
      lastWinnerYear: circuits[1].lastWinnerYear,
      tireTypes: circuits[1].tireTypes,
      conditions: circuits[1].conditions,
      results: [
        { position: 1, driverId: 'max_verstappen', driverNumber: 1, points: 25, laps: circuits[1].laps, status: 'Finished' },
        { position: 2, driverId: 'lewis_hamilton', driverNumber: 44, points: 18, laps: circuits[1].laps, status: 'Finished' },
        { position: 3, driverId: 'sergio_perez', driverNumber: 11, points: 15, laps: circuits[1].laps, status: 'Finished' },
        { position: 4, driverId: 'charles_leclerc', driverNumber: 16, points: 12, laps: circuits[1].laps, status: 'Finished' },
        { position: 5, driverId: 'lando_norris', driverNumber: 4, points: 10, laps: circuits[1].laps, status: 'Finished' },
        { position: 6, driverId: 'carlos_sainz', driverNumber: 55, points: 8, laps: circuits[1].laps, status: 'Finished' },
        { position: 7, driverId: 'george_russell', driverNumber: 63, points: 6, laps: circuits[1].laps, status: 'Finished' },
        { position: 8, driverId: 'oscar_piastri', driverNumber: 81, points: 4, laps: circuits[1].laps, status: 'Finished' },
        { position: 9, driverId: 'fernando_alonso', driverNumber: 14, points: 2, laps: circuits[1].laps, status: 'Finished' },
        { position: 10, driverId: 'esteban_ocon', driverNumber: 31, points: 1, laps: circuits[1].laps, status: 'Finished' }
      ]
    }
  ];

  // Add completed races
  races.push(...completedRaces);

  // Create upcoming races (from today onwards)
  let currentDate = new Date(today);
  let round = 3;
  let circuitIndex = 2; // Start from Australian GP

  // Schedule next 10 races
  for (let i = 0; i < 10; i++) {
    // Schedule races every 2-4 weeks
    const weeksToAdd = 2 + Math.floor(Math.random() * 2);
    currentDate.setDate(currentDate.getDate() + weeksToAdd * 7);

    const circuit = circuits[circuitIndex % circuits.length];
    const raceDate = new Date(currentDate);
    raceDate.setHours(14 + Math.floor(Math.random() * 4), 0, 0, 0); // Random race time between 2-6 PM

    races.push({
      round,
      raceName: circuit.name,
      circuit: {
        circuitId: circuit.circuitId,
        circuitName: circuit.name,
        location: circuit.location,
        country: circuit.country,
        lat: '0',
        long: '0'
      },
      date: raceDate.toISOString().split('T')[0],
      time: raceDate.toISOString().split('T')[1].replace('Z', ''),
      completed: false,
      isLive: false,
      sessionKey: round,
      results: []
    });

    round++;
    circuitIndex++;
  }

  return races.sort((a, b) => a.round - b.round);
};

// Initialize Firebase with drivers and schedule
export const initializeDatabase = async () => {
  try {
    // Check if already initialized
    const driversRef = collection(db, 'drivers');
    const driversSnapshot = await getDocs(driversRef);

    if (driversSnapshot.empty) {
      console.log('Initializing database...');

      // Add all drivers
      for (const driver of INITIAL_DRIVERS) {
        await setDoc(doc(db, 'drivers', driver.id), driver);
      }

      // Check if schedule already exists
      const scheduleRef = collection(db, 'schedule');
      const scheduleSnapshot = await getDocs(scheduleRef);

      if (scheduleSnapshot.empty) {
        // Add race schedule only if it doesn't exist
        const schedule = generateMockSchedule();
        for (const race of schedule) {
          await setDoc(doc(db, 'schedule', `race_${race.round}`), race);
        }
      }

      // Initialize market state
      await setDoc(doc(db, 'market', 'state'), {
        vix: 45,
        sentiment: 'bullish',
        activeConnections: 0,
        globalVolume: 0,
        topMovers: {
          gainers: [],
          losers: []
        },
        lastUpdated: Date.now()
      });

      console.log('Database initialized successfully!');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Fetch real leaderboard from Firestore
export const fetchRealLeaderboard = async () => {
  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const leaderboard = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      const netWorth = (data.balance || 100000) + (data.portfolio || []).reduce((sum: number, item: any) => {
        return sum + (item.currentValue || 0);
      }, 0);
      
      return {
        userId: doc.id,
        username: data.username || 'Anonymous',
        netWorth,
        balance: data.balance || 100000,
        portfolioValue: netWorth - (data.balance || 100000),
        change: netWorth - 100000,
        changePercent: ((netWorth - 100000) / 100000) * 100,
        createdAt: data.createdAt || Date.now()
      };
    }).sort((a, b) => b.netWorth - a.netWorth);

    return leaderboard.map((user, index) => ({
      ...user,
      rank: index + 1
    }));
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
};

// Fetch drivers from Firestore
export const fetchDrivers = async (): Promise<Driver[]> => {
  try {
    const driversRef = collection(db, 'drivers');
    const driversSnapshot = await getDocs(driversRef);

    const fallbackById = new Map(INITIAL_DRIVERS.map(driver => [driver.id, driver]));

    return driversSnapshot.docs.map(doc => {
      const data = doc.data() as Driver;
      const id = data.id || doc.id;
      const fallback = fallbackById.get(id);

      return {
        ...fallback,
        ...data,
        id,
        photo: data.photo || fallback?.photo || '',
      } as Driver;
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return INITIAL_DRIVERS;
  }
};

// Fetch schedule from Firestore
export const fetchSchedule = async (): Promise<Race[]> => {
  try {
    const scheduleRef = collection(db, 'schedule');
    const scheduleSnapshot = await getDocs(scheduleRef);

    if (scheduleSnapshot.empty) {
      // Initialize schedule if it doesn't exist
      const schedule = generateMockSchedule();
      for (const race of schedule) {
        await setDoc(doc(db, 'schedule', `race_${race.round}`), race);
      }
      return schedule;
    }

    const races = scheduleSnapshot.docs.map(doc => doc.data() as Race);

    // Update completion status based on current date
    const today = new Date();
    const updatedRaces = races.map(race => {
      const raceDate = new Date(race.date);
      const isCompleted = raceDate < today && race.round <= 2; // Only first 2 races are completed
      return { ...race, completed: isCompleted };
    });

    // Update in Firestore
    for (const race of updatedRaces) {
      await setDoc(doc(db, 'schedule', `race_${race.round}`), race);
    }

    return updatedRaces.sort((a, b) => a.round - b.round);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return generateMockSchedule();
  }
};
