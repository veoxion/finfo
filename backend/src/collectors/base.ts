import axios, { AxiosInstance } from 'axios'

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export interface CollectedData {
  indicatorCode: string
  date: Date
  value: number
}

export abstract class BaseCollector {
  protected readonly http: AxiosInstance
  protected readonly source: string

  private circuitState: CircuitState = 'CLOSED'
  private failureCount = 0
  private lastFailureTime?: number
  private readonly failureThreshold = 5
  private readonly cooldownMs = 60_000 // 1분

  constructor(source: string, baseURL: string, timeoutMs = 15_000) {
    this.source = source
    this.http = axios.create({ baseURL, timeout: timeoutMs })
  }

  async collect(): Promise<CollectedData[]> {
    if (this.circuitState === 'OPEN') {
      if (Date.now() - (this.lastFailureTime ?? 0) > this.cooldownMs) {
        this.circuitState = 'HALF_OPEN'
      } else {
        throw new Error(`[${this.source}] Circuit is OPEN, skipping collection`)
      }
    }

    try {
      const data = await this.fetchData()
      this.onSuccess()
      return data
    } catch (err) {
      this.onFailure()
      throw err
    }
  }

  protected abstract fetchData(): Promise<CollectedData[]>

  protected async withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: unknown
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn()
      } catch (err) {
        lastError = err
        if (attempt < maxRetries - 1) {
          await this.sleep(1000 * 2 ** attempt) // exponential backoff
        }
      }
    }
    throw lastError
  }

  protected sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private onSuccess() {
    this.failureCount = 0
    this.circuitState = 'CLOSED'
  }

  private onFailure() {
    this.failureCount++
    this.lastFailureTime = Date.now()
    if (this.failureCount >= this.failureThreshold) {
      this.circuitState = 'OPEN'
      console.warn(`[${this.source}] Circuit OPENED after ${this.failureCount} failures`)
    }
  }

  getCircuitState(): CircuitState {
    return this.circuitState
  }
}
