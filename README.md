# F1 PlayStock - Formula 1 Driver Investment Platform

A production-ready React application that transforms Formula 1 drivers into tradeable assets, allowing users to invest, track performance, and compete in a virtual stock market based on real F1 data.

## 🏎️ What's New - Major Improvements

### ✅ Complete React Conversion
- Migrated from vanilla React to a modern, scalable React architecture
- Implemented React Router for seamless navigation
- Added Zustand for efficient state management
- Integrated TypeScript for type safety

### 🔥 Real F1 Data Integration
- **OpenF1 API**: Live race data, telemetry, positions, lap times (NO API KEY REQUIRED)
- **Ergast API**: Historical data, race results, driver standings, schedules
- Automatic caching system for optimal performance
- Real-time updates during live races

### 📱 Mobile-First Responsive Design
- Fully responsive layout optimized for all screen sizes
- Touch-friendly interfaces
- Adaptive navigation for mobile and desktop
- Progressive Web App (PWA) ready

### 🎨 Modern UI/UX
- Tailwind CSS for consistent, professional styling
- Framer Motion for smooth animations
- Dark mode by default with F1-inspired color scheme
- Glassmorphism and modern card designs

### 🚀 Production-Ready Features
- Firebase Authentication & Firestore database
- Real driver images from official F1 sources
- Live race tracking with position updates
- Advanced analytics and portfolio management
- Leaderboard system
- Mini-games and challenges
- Referral system

## 📁 Project Structure

```
f1-playstock-react/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.tsx
│   │   ├── DriverCard.tsx
│   │   ├── LiveTicker.tsx
│   │   ├── Chart.tsx
│   │   └── LoadingScreen.tsx
│   ├── pages/              # Route pages
│   │   ├── LandingPage.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Market.tsx
│   │   ├── Portfolio.tsx
│   │   ├── LiveRace.tsx
│   │   ├── Schedule.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── Analytics.tsx
│   │   ├── Games.tsx
│   │   ├── Login.tsx
│   │   └── Signup.tsx
│   ├── services/           # API and external services
│   │   ├── firebase.ts     # Firebase configuration
│   │   ├── f1Api.ts        # F1 data fetching
│   │   └── trading.ts      # Trading logic
│   ├── store/              # State management
│   │   └── appStore.ts     # Zustand store
│   ├── hooks/              # Custom React hooks
│   │   ├── useDrivers.ts
│   │   ├── useLiveRace.ts
│   │   └── usePortfolio.ts
│   ├── types/              # TypeScript definitions
│   │   └── index.ts
│   ├── utils/              # Utility functions
│   │   ├── calculations.ts
│   │   ├── formatters.ts
│   │   └── validators.ts
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Firebase account (free tier works)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd f1-playstock-react
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
   VITE_FIREBASE_MEASUREMENT_ID=G-ABCDEF
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
# or
yarn build
```

The production build will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
# or
yarn preview
```

## 🔧 Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project"
   - Follow the setup wizard

2. **Enable Authentication**
   - Navigate to Authentication > Sign-in method
   - Enable Email/Password
   - (Optional) Enable Google Sign-In

3. **Create Firestore Database**
   - Navigate to Firestore Database
   - Click "Create database"
   - Start in production mode
   - Choose your region

4. **Set up Security Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can only read/write their own data
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Everyone can read drivers and market data
       match /drivers/{driverId} {
         allow read: if true;
         allow write: if false; // Only server can write
       }
       
       match /market/{document} {
         allow read: if true;
         allow write: if false;
       }
       
       // Trades are public but only authenticated users can create
       match /trades/{tradeId} {
         allow read: if true;
         allow create: if request.auth != null;
       }
       
       // Leaderboard is public
       match /leaderboard/{userId} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

5. **Get your configuration**
   - Go to Project Settings > General
   - Scroll to "Your apps"
   - Click the web icon (</>)
   - Copy the config object values to your `.env` file

## 📊 Real F1 Data APIs

### OpenF1 API (Primary - Live Data)
- **Base URL**: `https://api.openf1.org/v1`
- **Rate Limit**: 3 req/s, 30 req/min (free tier)
- **No API Key Required** ✅
- **Features**:
  - Live race positions
  - Lap times and sector times
  - Driver telemetry
  - Team radio transcripts
  - Weather data
  - Race control messages

### Ergast API (Historical Data)
- **Base URL**: `https://ergast.com/api/f1`
- **Rate Limit**: Generous, no key required
- **Features**:
  - Driver standings
  - Race results
  - Season schedules
  - Historical data from 1950+

### Driver Images
Driver photos and helmets are sourced from official Formula 1 media:
```
https://media.formula1.com/content/dam/fom-website/drivers/2024Drivers/{DRIVER_CODE}.jpg
https://media.formula1.com/content/dam/fom-website/manual/Helmets2024/{driver_id}.png
```

## 🎮 Key Features

### 1. **Dynamic Driver Pricing**
- Prices fluctuate based on real race performance
- Points, positions, and fastest laps affect stock value
- Historical price tracking with interactive charts

### 2. **Live Race Tracking**
- Real-time position updates during races
- Lap-by-lap analysis
- Live portfolio value changes

### 3. **Portfolio Management**
- Buy/sell drivers like stocks
- Track profit/loss
- Performance analytics
- Diversification metrics

### 4. **Leaderboard & Competition**
- Global rankings
- Friend competitions
- Achievement system
- Referral rewards

### 5. **Mini-Games**
- Racing simulator
- Qualifying predictor
- Strategy challenges
- Daily quizzes

## 🎨 Design System

### Colors
- **Primary**: Red (#ef4444) - F1 Racing Red
- **Background**: Dark (#030712) - Almost Black
- **Cards**: Dark Gray (#1f2937) - Card Background
- **Accent**: Team colors dynamically applied

### Typography
- **Font**: System fonts for optimal performance
- **Headings**: Bold, uppercase for impact
- **Body**: Regular weight, high contrast

### Components
- Glass-morphism effects
- Smooth animations with Framer Motion
- Responsive grid layouts
- Touch-optimized buttons

## 📱 Mobile Optimization

- Responsive breakpoints: 640px, 768px, 1024px, 1280px
- Touch-friendly tap targets (minimum 44x44px)
- Optimized images and lazy loading
- Reduced motion for accessibility
- Offline support (PWA)

## 🔒 Security Best Practices

- Environment variables for sensitive data
- Firebase security rules
- Input validation
- XSS protection
- HTTPS only in production
- Rate limiting on API calls

## 🚦 Performance Optimization

- Code splitting with dynamic imports
- Image optimization and lazy loading
- API response caching (5-minute TTL)
- Memoized components
- Virtual scrolling for large lists
- Service Worker for offline support

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run e2e tests (when implemented)
npm run test:e2e
```

## 📈 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Drag and drop the dist folder to Netlify
```

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase init hosting
firebase deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Yes |
| `VITE_FIREBASE_MEASUREMENT_ID` | Google Analytics measurement ID | No |

## 🐛 Known Issues & Roadmap

### Current Limitations
- Historical data limited to 2023+ from OpenF1
- Live data updates every 3-4 seconds
- Rate limits on free tier APIs

### Upcoming Features
- [ ] Real-time multiplayer trading
- [ ] Advanced analytics with ML predictions
- [ ] Mobile app (React Native)
- [ ] Social features (chat, teams)
- [ ] NFT integration for achievements
- [ ] Cryptocurrency-based rewards

## 📚 Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [OpenF1 API Docs](https://openf1.org/docs)
- [Ergast API Docs](https://ergast.com/mrd/)

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🙏 Acknowledgments

- Formula 1 for the inspiration
- OpenF1 community for the amazing free API
- Ergast for historical F1 data
- All F1 fans and contributors

## 💬 Support

For support, email support@f1playstock.com or join our Discord server.

---

**Made with ❤️ by F1 fans for F1 fans**

🏁 Happy Trading! 🏁
