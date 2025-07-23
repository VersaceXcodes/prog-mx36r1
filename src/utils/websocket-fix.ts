// WebSocket connection fix for development
export const setupWebSocketFix = () => {
  if (import.meta.env.DEV) {
    // Override WebSocket constructor to handle connection failures gracefully
    const originalWebSocket = window.WebSocket;
    
    window.WebSocket = class extends originalWebSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        
        this.addEventListener('error', (event) => {
          console.warn('WebSocket connection failed:', url, event);
          // Don't throw errors for HMR WebSocket failures in development
        });
        
        this.addEventListener('close', (event) => {
          if (event.code !== 1000) {
            console.warn('WebSocket closed unexpectedly:', url, event.code, event.reason);
          }
        });
      }
    };
  }
};