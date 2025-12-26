#!/bin/bash

# Quick start script for AI Crypto Signal Analyzer

echo "🚀 Starting AI Crypto Signal Analyzer Setup..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env and add your OPENAI_API_KEY"
    echo "   Get your API key from: https://platform.openai.com/api-keys"
    echo ""
    read -p "Press Enter after you've added your OpenAI API key..."
else
    echo "✅ .env file already exists"
fi

echo ""
echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "🔍 Type-checking project..."
pnpm tsc --noEmit

if [ $? -eq 0 ]; then
    echo "✅ Type check passed!"
else
    echo "⚠️  Type check found some issues, but we can proceed"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the development server, run:"
echo "  pnpm dev"
echo ""
echo "Then open http://localhost:3000 in your browser"
echo ""
echo "📚 Features available:"
echo "  - Real-time Binance candle data"
echo "  - Technical indicators (EMA, SMA, RSI)"
echo "  - Automated alert detection"
echo "  - AI-powered explanations"
echo ""
echo "⚠️  Remember: This is for educational purposes only, not financial advice!"
