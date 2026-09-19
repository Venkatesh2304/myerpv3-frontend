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

type ErrorListener = (failure: FailedRequestInfo) => void;

class ErrorTracker {
  private failures: FailedRequestInfo[] = [];
  private listeners: Array<ErrorListener> = [];

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("unhandledrejection", (event) => {
        // Ignore cancelled requests or assistant endpoint errors to avoid loops
        const reason = event.reason;
        if (reason?.config?.url?.includes("/assistant/chat")) return;
        this.recordFailure({
          url: reason?.config?.url || window.location.pathname,
          method: reason?.config?.method?.toUpperCase() || "ASYNC",
          status: reason?.response?.status || 500,
          statusText: reason?.message || "Unhandled Promise Rejection",
          responseData: reason?.response?.data || String(reason),
          timestamp: new Date().toISOString(),
        });
      });
    }
  }

  public recordFailure(failure: FailedRequestInfo) {
    // Avoid tracking errors originating from the assistant endpoint itself to prevent feedback loops
    if (failure.url?.includes("/assistant/chat")) return;

    this.failures.push(failure);
    if (this.failures.length > 20) {
      this.failures.shift();
    }
    this.notify(failure);
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
  }

  public subscribe(listener: ErrorListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(failure: FailedRequestInfo) {
    this.listeners.forEach((l) => {
      try {
        l(failure);
      } catch (e) {
        console.error("Error in errorTracker listener", e);
      }
    });
  }
}

export const errorTracker = new ErrorTracker();
