// Network error handling utility
export interface NetworkError extends Error {
  status?: number;
  statusText?: string;
  url?: string;
}

export class NetworkHandler {
  static async fetchWithErrorHandling(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`) as NetworkError;
        error.status = response.status;
        error.statusText = response.statusText;
        error.url = url;
        throw error;
      }

      return response;
    } catch (error) {
      console.error('Network Error:', error);
      
      // Handle different types of network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network connection failed. Please check your internet connection.');
      }
      
      if (error instanceof Error && 'status' in error) {
        const networkError = error as NetworkError;
        switch (networkError.status) {
          case 404:
            throw new Error('The requested resource was not found.');
          case 500:
            throw new Error('Internal server error. Please try again later.');
          case 503:
            throw new Error('Service temporarily unavailable. Please try again later.');
          default:
            throw new Error(`Request failed with status ${networkError.status}: ${networkError.statusText}`);
        }
      }
      
      throw error;
    }
  }

  static async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Request attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }
    
    throw lastError!;
  }
}

// Example usage function
export const apiRequest = async (endpoint: string, options?: RequestInit) => {
  return NetworkHandler.retryRequest(async () => {
    const response = await NetworkHandler.fetchWithErrorHandling(endpoint, options);
    return response.json();
  });
};