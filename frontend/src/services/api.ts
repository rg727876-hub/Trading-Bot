export interface CandleDto {
  close: string;
  high: string;
  low: string;
  open: string;
  symbol: string;
  timeframe: string;
  timestamp: string;
  volume: string;
}

export interface DashboardApi {
  getDashboard(): Promise<DashboardData>;
  setBotState(action: 'start' | 'pause' | 'stop'): Promise<BotStatus>;
}

export interface DashboardData {
  balance: { balance: string };
  market: CandleDto[];
  performance: PerformanceDto;
  positions: PositionDto[];
  status: BotStatus;
  trades: TradeDto[];
}

export interface BotStatus {
  mode: 'paper';
  status: 'RUNNING' | 'PAUSED' | 'STOPPED';
}

export interface PerformanceDto {
  maxDrawdown: string;
  netPnl: string;
  totalTrades: number;
  winRate: string;
}

export interface PositionDto {
  entryPrice: string;
  id: string;
  quantity: string;
  status: string;
  stopLoss: string;
  symbol: string;
  takeProfit: string;
}

export interface TradeDto {
  entryPrice: string;
  exitPrice: string;
  exitReason: string;
  id: string;
  profitLoss: string;
  quantity: string;
  symbol: string;
}

export function createDashboardApi(baseUrl = '/api'): DashboardApi {
  return {
    async getDashboard(): Promise<DashboardData> {
      const [status, balance, positions, trades, performance, market] = await Promise.all([
        request<BotStatus>(`${baseUrl}/status`),
        request<DashboardData['balance']>(`${baseUrl}/balance`),
        request<PositionDto[]>(`${baseUrl}/positions`),
        request<TradeDto[]>(`${baseUrl}/trades`),
        request<PerformanceDto>(`${baseUrl}/performance`),
        request<CandleDto[]>(`${baseUrl}/market/BTCUSDT?timeframe=1h`),
      ]);
      return { balance, market, performance, positions, status, trades };
    },
    setBotState: (action) => request<BotStatus>(`${baseUrl}/bot/${action}`, { method: 'POST' }),
  };
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`API request failed with status ${response.status}.`);
  return (await response.json()) as T;
}
