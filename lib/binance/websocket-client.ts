// Binance WebSocket client for real-time candle updates

import WebSocket from 'ws';
import { Candle, BinanceWebSocketMessage, Symbol, Timeframe, BinanceProductType } from '@/lib/types';
import { BINANCE_URLS, BINANCE_PRODUCT_TYPE } from '@/lib/config/constants';
import { logger } from '@/lib/utils/logger';

type CandleUpdateCallback = (candle: Candle, isClosed: boolean) => void;
type ErrorCallback = (error: Error) => void;

export class BinanceWebSocketClient {
  private ws: WebSocket | null = null;
  private symbol: Symbol;
  private timeframe: Timeframe;
  private productType: BinanceProductType;
  private onCandleUpdate: CandleUpdateCallback;
  private onError: ErrorCallback;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  constructor(
    symbol: Symbol,
    timeframe: Timeframe,
    onCandleUpdate: CandleUpdateCallback,
    onError: ErrorCallback,
    productType: BinanceProductType = BINANCE_PRODUCT_TYPE
  ) {
    this.symbol = symbol;
    this.timeframe = timeframe;
    this.productType = productType;
    this.onCandleUpdate = onCandleUpdate;
    this.onError = onError;
  }

  /**
   * Connect to Binance WebSocket stream
   */
  connect(): void {
    try {
      // Get WebSocket URL based on product type
      const wsUrl = BINANCE_URLS[this.productType].WS;
      const stream = `${this.symbol.toLowerCase()}@kline_${this.timeframe}`;
      const url = `${wsUrl}/${stream}`;

      logger.info(`Connecting to Binance ${this.productType} WebSocket: ${stream}`);

      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        logger.info('WebSocket connected');
        this.reconnectAttempts = 0;
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const message: BinanceWebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          logger.error('Failed to parse WebSocket message', error);
        }
      });

      this.ws.on('error', (error) => {
        logger.error('WebSocket error', error);
        this.onError(error);
      });

      this.ws.on('close', () => {
        logger.warn('WebSocket closed');
        this.attemptReconnect();
      });

      this.ws.on('ping', () => {
        this.ws?.pong();
      });

    } catch (error) {
      logger.error('Failed to connect WebSocket', error);
      this.onError(error instanceof Error ? error : new Error('Unknown WebSocket error'));
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: BinanceWebSocketMessage): void {
    if (message.e !== 'kline') {
      return;
    }

    const kline = message.k;
    const candle: Candle = {
      timestamp: kline.t,
      open: parseFloat(kline.o),
      high: parseFloat(kline.h),
      low: parseFloat(kline.l),
      close: parseFloat(kline.c),
      volume: parseFloat(kline.v),
      closeTime: kline.T,
    };

    const isClosed = kline.x;

    logger.debug(`Candle update: ${isClosed ? 'CLOSED' : 'UPDATE'}`, {
      price: candle.close,
      volume: candle.volume,
    });

    this.onCandleUpdate(candle, isClosed);
  }

  /**
   * Attempt to reconnect after connection loss
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnect attempts reached');
      this.onError(new Error('WebSocket reconnection failed'));
      return;
    }

    this.reconnectAttempts++;
    logger.info(`Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    if (this.ws) {
      logger.info('Disconnecting WebSocket');
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
