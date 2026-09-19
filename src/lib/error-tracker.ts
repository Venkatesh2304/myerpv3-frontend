export interface FailedRequestInfo {
  url?: string;
  method?: string;
  params?: any;
  data?: any;
  status?: number;
  statusText?: string;
  responseData?: any;
  timestamp: string;
}

class ErrorTracker {
  private failures: FailedRequestInfo[] = [];
  private listeners: Array<() => void> = [];

  public recordFailure(failure: FailedRequestInfo) {
    this.failures.push(failure);
    if (this.failures.length > 20) {
      this.failures.shift();
    }
    this.notify();
  }

  public getLatest(): FailedRequestInfo | null {
    if (this.failures.length === 0) return null;
    return this.failures[this.failures.length - 1];
  }

  public getAll(): FailedRequestInfo[] {
    return [...this.failures];
  }

  public clear() {
    this.failures = [];
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (e) {
        console.error(e);
      }
    });
  }
}

export const errorTracker = new ErrorTracker();
