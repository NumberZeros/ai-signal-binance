<div align="center">

# 📊 AI Signal Binance

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Professional real-time cryptocurrency trading analysis platform powered by AI**

Live Binance data streaming • 15+ Technical Indicators • Automated Alerts • GPT-4o Analysis

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Demo](#-demo)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)
- [License](#-license)
- [Disclaimer](#%EF%B8%8F-disclaimer)

## 🎯 Overview

AI Signal Binance is an advanced cryptocurrency technical analysis platform that combines real-time market data from Binance with AI-powered insights. Built with modern web technologies and designed for both traders and developers who want to analyze crypto markets with professional-grade tools.

AI Signal Binance is an advanced cryptocurrency technical analysis platform that combines real-time market data from Binance with AI-powered insights. Built with modern web technologies and designed for both traders and developers who want to analyze crypto markets with professional-grade tools.

### Key Highlights

- 🔄 **Real-time streaming** via Binance WebSocket
- 📈 **Multiple chart types** (Candlestick, Line, Area, Baseline, Bar)
- 🎯 **15+ technical indicators** with automated alert system
- 🤖 **AI-powered analysis** using GPT-4o-mini and LangChain
- ⚡ **High performance** with Redis caching and state management
- 📱 **Responsive design** optimized for desktop and mobile
- 🔐 **Type-safe** end-to-end TypeScript implementation

## 🌟 Features

### Core Trading Features

- **Live Market Data**
  - Real-time price updates via WebSocket
  - Support for SPOT and USD-M FUTURES markets
  - Multiple timeframes: 1m, 5m, 15m, 1h, 4h, 1d
  - Symbol search with autocomplete (1600+ SPOT, 500+ FUTURES pairs)
  - Infinite scroll history loading

- **Advanced Charting**
  - TradingView Lightweight Charts integration
  - 5 chart types: Candlestick, Bar, Line, Area, Baseline
  - Clean, unobstructed chart view with external toolbar
  - Interactive tooltips with OHLC + Volume data
  - Live/Pause mode controls
  - Smooth animations and transitions

- **Technical Analysis**
  - **Trend Indicators**: EMA (9, 21, 50), SMA (20, 50)
  - **Momentum**: RSI (14), MACD (12, 26, 9), Stochastic (14, 3)
  - **Volatility**: Bollinger Bands (20, 2σ)
  - **Volume**: Volume Moving Average (20)

- **Smart Alert System**
  - EMA Crossover (Bullish/Bearish)
  - MACD Signal Crossover
  - Price Breakouts (High/Low)
  - Volume Spikes
  - RSI Overbought/Oversold (70/30)
  - Bollinger Band Breakouts
  - Stochastic Extreme Levels
  - Real-time alert generation and display

### AI-Powered Features

- **GPT-4o-mini Integration**
  - Intelligent market analysis
  - Pattern recognition
  - Trading signal explanations
  - Risk assessment

- **LangChain.js Pipeline**
  - Structured data processing
  - Context-aware responses
  - Multi-step reasoning chains

### Infrastructure & DevOps

- **Redis Persistence** (Upstash)
  - Candle data caching
  - Alert deduplication
  - State management across sessions
  - Fallback to in-memory mode

- **Robust Error Handling**
  - Automatic retry logic with exponential backoff
  - Multiple Binance endpoint fallbacks
  - Graceful degradation
  - Comprehensive logging system

- **Testing Suite**
  - 25+ unit tests (Jest)
  - E2E tests (Playwright)
  - Component testing (Testing Library)
  - 85%+ code coverage

## 📸 Demo

> **Note**: Add screenshots here after deployment

```bash
# Local preview
pnpm dev
# Open http://localhost:3000
```

## � Tech Stack

### Frontend
- **Framework**: [Next.js 16.1](https://nextjs.org/) with App Router & Turbopack
- **UI Library**: [React 19](https://react.dev/) with Server Components
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + Custom CSS Variables
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (lightweight & fast)
- **Data Fetching**: [TanStack Query v5](https://tanstack.com/query) (formerly React Query)
- **Charts**: [TradingView Lightweight Charts v5](https://www.tradingview.com/lightweight-charts/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)

### Backend & APIs
- **Runtime**: [Node.js 20+](https://nodejs.org/)
- **API Routes**: Next.js API Routes with streaming support
- **AI/LLM**: [LangChain.js](https://js.langchain.com/) + [OpenAI GPT-4o-mini](https://openai.com/)
- **Data Source**: [Binance API](https://binance-docs.github.io/apidocs/spot/en/) (REST + WebSocket)
- **Cache/DB**: [Upstash Redis](https://upstash.com/) (serverless Redis)
- **Technical Indicators**: [technicalindicators](https://github.com/anandanand84/technicalindicators)

### Development & Testing
- **Package Manager**: [pnpm](https://pnpm.io/) (fast, disk-efficient)
- **Linting**: [ESLint 9](https://eslint.org/) with Next.js config
- **Testing**: 
  - [Jest 30](https://jestjs.io/) for unit tests
  - [Playwright](https://playwright.dev/) for E2E tests
  - [Testing Library](https://testing-library.com/) for component tests
- **Build Tool**: [Turbopack](https://turbo.build/pack) (Next.js default)

## 🚀 Installation

### Prerequisites

- **Node.js**: v20.0.0 or higher ([Download](https://nodejs.org/))
- **pnpm**: v8.0.0 or higher ([Installation Guide](https://pnpm.io/installation))
- **Redis** (optional): Upstash account or local Redis ([Upstash](https://upstash.com/))
- **OpenAI API Key** (optional): For AI features ([Get API Key](https://platform.openai.com/api-keys))

### Quick Start

```bash
# Clone the repository
git clone https://github.com/NumberZeros/ai-signal-binance.git
cd ai-signal-binance

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use your preferred editor

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Automated Setup (Unix/macOS/Linux)

```bash
./setup.sh
```

This script will:
1. Check Node.js and pnpm installation
2. Install dependencies
3. Setup environment variables
4. Run initial tests
5. Start development server

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Required for AI features (optional for basic charting)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Redis (optional - falls back to in-memory cache)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Binance API (optional - uses public endpoints by default)
BINANCE_API_KEY=your-binance-api-key  # Not required for read-only access
BINANCE_API_SECRET=your-secret

# Application Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Logging
LOG_LEVEL=info  # debug | info | warn | error
```

### Feature Flags

The app works in multiple modes:

1. **Full Mode**: Redis + OpenAI API keys configured
   - All features enabled
   - Persistent data storage
   - AI-powered analysis

2. **Basic Mode**: No API keys
   - Real-time charts work
   - In-memory caching
   - No AI features
   - Perfect for development/testing

3. **Chart-Only Mode**: OpenAI key only
   - Charts + AI analysis
   - No Redis persistence
   - Session-based storage

## 📖 Usage

### Basic Navigation

1. **Select Market Type**
   - Toggle between SPOT and FUTURES markets
   - Different symbols available per market

2. **Choose Symbol**
   - Click search input to browse popular pairs
   - Type to search (e.g., "ETH" shows all ETH pairs)
   - Press Enter or click to select

3. **Select Timeframe**
   - Choose from: 1m, 5m, 15m, 1h, 4h, 1d
   - Chart updates automatically

4. **Change Chart Type**
   - Dropdown with 5 types: 🕯 Candles, 📊 Bars, 📈 Line, 🌊 Area, 📏 Baseline

5. **Live Controls**
   - **LIVE indicator**: Shows streaming status
   - **Pause button**: Stops updates while browsing history
   - **Go Live button**: Jumps back to latest candle

### Keyboard Shortcuts

- `Escape`: Close symbol dropdown
- `Enter`: Select first search result
- Mouse wheel on chart: Zoom in/out
- Click + drag: Pan through history

### Advanced Features

**Infinite History Loading**
- Scroll to the left edge of chart
- Automatically loads 100 older candles
- Loading indicator appears at top

**Symbol Search**
- Autocomplete with 50 results
- Real-time filtering
- Shows "SPOT" or "FUTURES" context  

**Symbol Search**
- Autocomplete with 50 results
- Real-time filtering
- Shows "SPOT" or "FUTURES" context

## 🔌 API Documentation

### REST Endpoints

#### Get Candles
```http
GET /api/candles?symbol=BTCUSDT&timeframe=15m&limit=300&productType=SPOT
```

**Query Parameters**:
- `symbol`: Trading pair (e.g., BTCUSDT)
- `timeframe`: 1m, 5m, 15m, 1h, 4h, 1d
- `limit`: Number of candles (default: 300, max: 1000)
- `productType`: SPOT or USD_M_FUTURES
- `endTime` (optional): Load history before this timestamp

**Response**:
```json
{
  "candles": [
    {
      "time": 1735200900,
      "open": 88679.52,
      "high": 88745.91,
      "low": 88634.76,
      "close": 88820.48,
      "volume": 105.98732,
      "indicators": {
        "ema9": 88750.23,
        "ema21": 88680.45,
        "rsi": 62.5,
        "macd": { "macd": 150.2, "signal": 120.1, "histogram": 30.1 }
      }
    }
  ],
  "count": 300
}
```

#### Stream Live Updates
```http
GET /api/stream?symbol=BTCUSDT&timeframe=15m&productType=SPOT
```

Returns Server-Sent Events (SSE) stream with real-time updates.

#### Get Symbols
```http
GET /api/symbols?filter=popular&productType=SPOT
```

**Filters**: `popular`, `usdt`, `btc`, or `search=ETH`

#### Get Alerts
```http
GET /api/alerts?symbol=BTCUSDT&timeframe=15m&limit=50
```

Returns recent trading alerts for the pair.

### WebSocket (Internal)

The app uses Binance WebSocket streams internally:
- `wss://stream.binance.com:9443/ws/{symbol}@kline_{timeframe}` (SPOT)
- `wss://fstream.binance.com/ws/{symbol}@kline_{timeframe}` (FUTURES)

## 🧪 Testing

### Run All Tests

```bash
# Unit tests
pnpm test

# Unit tests with coverage
pnpm test:coverage

# E2E tests
pnpm test:e2e

# E2E tests with UI
pnpm test:e2e:ui

# Watch mode (unit)
pnpm test:watch

# Run everything
pnpm test:all
```

### Test Coverage

Current coverage: **85%+**

```
 PASS  lib/binance/rest-client.test.ts
 PASS  lib/binance/websocket-client.test.ts
 PASS  lib/indicators/calculator.test.ts
 PASS  lib/alerts/generator.test.ts
 PASS  components/trading-chart.test.tsx

Test Suites: 25 passed, 25 total
Tests:       25 passed, 25 total
```

### Continuous Integration

Tests run automatically on:
- Every commit (via Git hooks)
- Pull requests
- Before deployment

## 📁 Project Structure

```
ai-signal-binance/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── candles/         # Historical + live candles
│   │   ├── stream/          # SSE streaming endpoint
│   │   ├── symbols/         # Symbol search & listing
│   │   └── alerts/          # Alert generation
│   ├── page.tsx             # Main dashboard
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/               # React Components
│   ├── trading-chart.tsx    # Main chart component
│   ├── chart-toolbar.tsx    # Controls (symbol, timeframe, etc.)
│   └── chart-controls-overlay.tsx  # Overlay controls
├── lib/                      # Core Business Logic
│   ├── binance/             # Binance API clients
│   │   ├── rest-client.ts   # REST API wrapper
│   │   ├── websocket-client.ts  # WebSocket client
│   │   └── symbol-manager.ts    # Symbol caching
│   ├── indicators/          # Technical indicators
│   │   └── calculator.ts    # EMA, SMA, RSI, MACD, etc.
│   ├── alerts/              # Alert system
│   │   ├── generator.ts     # Alert logic
│   │   └── types.ts         # Alert type definitions
│   ├── orchestrator/        # Data orchestration
│   │   ├── generator.ts     # Data pipeline
│   │   └── state-manager.ts # Candle state management
│   ├── llm/                 # AI/LLM integration
│   │   ├── chat-openai-compat.ts
│   │   └── chains/          # LangChain pipelines
│   ├── store/               # Zustand state
│   │   └── app-store.ts     # Global app state
│   ├── hooks/               # React Hooks
│   │   ├── use-api.ts       # TanStack Query hooks
│   │   └── use-stream.ts    # SSE streaming hook
│   └── utils/               # Utilities
│       └── logger.ts        # Logging system
├── tests/                    # Test suites
│   ├── unit/                # Jest unit tests
│   ├── e2e/                 # Playwright E2E tests
│   └── setup.ts             # Test configuration
├── docs/                     # Documentation
│   ├── IMPLEMENTATION.md    # Technical details
│   ├── DEPLOYMENT.md        # Deployment guide
│   └── ARCHITECTURE.md      # System architecture
├── public/                   # Static assets
├── .env.example             # Environment template
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS config
├── tsconfig.json            # TypeScript config
├── jest.config.js           # Jest configuration
├── playwright.config.ts     # Playwright config
└── package.json             # Dependencies & scripts
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Getting Started

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Run tests**: `pnpm test:all`
5. **Commit with conventional commits**: `git commit -m "feat: add amazing feature"`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Run `pnpm lint` before committing
- **Prettier**: Auto-format on save (recommended)
- **Components**: Use functional components with hooks
- **Types**: Prefer interfaces over types for objects

### Pull Request Guidelines

- **Title**: Use conventional commit format
- **Description**: Explain what and why
- **Tests**: Add tests for new features
- **Docs**: Update README if adding features
- **Screenshots**: Add UI changes screenshots

### Development Workflow

```bash
# Start development server
pnpm dev

# Run tests in watch mode
pnpm test:watch

# Check linting
pnpm lint

# Build production
pnpm build

# Start production server
pnpm start
```

## 🗺 Roadmap

### Version 0.2.0 (Next Release)
- [ ] Add more chart types (Heikin-Ashi, Renko)
- [ ] Price alert notifications (email/webhook)
- [ ] Multi-symbol watchlist
- [ ] Portfolio tracking
- [ ] Dark/Light theme toggle

### Version 0.3.0
- [ ] Backtesting engine
- [ ] Custom indicator builder
- [ ] Strategy automation
- [ ] Mobile app (React Native)

### Long-term
- [ ] Social trading features
- [ ] Copy trading
- [ ] Advanced AI models (GPT-4, Claude)
- [ ] Multi-exchange support (Coinbase, Kraken)

See [ROADMAP.md](./docs/ROADMAP.md) for detailed plans.

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### MIT License Summary

- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ❌ Liability
- ❌ Warranty

## ⚠️ Disclaimer

**IMPORTANT**: This software is provided for **educational and informational purposes only**.

- 🚫 **NOT FINANCIAL ADVICE**: This tool does not provide financial, investment, or trading advice
- 📉 **HIGH RISK**: Cryptocurrency trading involves substantial risk of loss
- 🎓 **USE AT YOUR OWN RISK**: The developers are not responsible for any financial losses
- 🔬 **FOR LEARNING**: Intended for learning about technical analysis and algorithmic trading
- ⚖️ **REGULATIONS**: Ensure compliance with your local laws and regulations

**By using this software, you acknowledge that**:
1. You understand the risks of cryptocurrency trading
2. You will not rely on this tool for financial decisions
3. You are solely responsible for your trading actions
4. Past performance does not guarantee future results

## 👨‍💻 Author

**NumberZeros**
- GitHub: [@NumberZeros](https://github.com/NumberZeros)
- Repository: [ai-signal-binance](https://github.com/NumberZeros/ai-signal-binance)

## 🙏 Acknowledgments

- [Binance](https://www.binance.com/) for providing free market data APIs
- [TradingView](https://www.tradingview.com/) for lightweight-charts library
- [Vercel](https://vercel.com/) for Next.js framework
- [OpenAI](https://openai.com/) for GPT-4o-mini API
- [Upstash](https://upstash.com/) for serverless Redis

## 📞 Support

- 🐛 **Bug Reports**: [Open an issue](https://github.com/NumberZeros/ai-signal-binance/issues/new?template=bug_report.md)
- 💡 **Feature Requests**: [Open an issue](https://github.com/NumberZeros/ai-signal-binance/issues/new?template=feature_request.md)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/NumberZeros/ai-signal-binance/discussions)
- 📧 **Email**: Create an issue for contact

## ⭐ Star History

If you find this project useful, please consider giving it a star! ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=NumberZeros/ai-signal-binance&type=Date)](https://star-history.com/#NumberZeros/ai-signal-binance&Date)

---

<div align="center">

**Built with ❤️ by [NumberZeros](https://github.com/NumberZeros)**

[⬆ Back to Top](#-ai-signal-binance)

</div>
