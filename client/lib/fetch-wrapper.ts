/**
 * Wrapper around fetch to handle common issues like FullStory interception,
 * network errors, and timeouts
 */

interface FetchWrapperOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export async function safeFetch(
  url: string, 
  options: FetchWrapperOptions = {}
): Promise<Response> {
  const {
    timeout = 10000,
    retries = 1,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Try to use original fetch if FullStory has overridden it
      const fetchFn = (window as any).__originalFetch || window.fetch;
      
      const response = await fetchFn(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      const isLastAttempt = attempt === retries;
      
      if (error instanceof Error) {
        // Handle specific error types
        if (error.name === 'AbortError') {
          console.warn(`Request timeout for ${url} (attempt ${attempt + 1})`);
        } else if (error.message.includes('Failed to fetch')) {
          console.warn(`Network error for ${url} (attempt ${attempt + 1}):`, error.message);
        } else if (error.message.includes('FullStory')) {
          console.warn(`FullStory interference detected for ${url} (attempt ${attempt + 1})`);
        } else {
          console.warn(`Fetch error for ${url} (attempt ${attempt + 1}):`, error.message);
        }
      }

      if (isLastAttempt) {
        throw error;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error('Unexpected error in safeFetch');
}

/**
 * Initialize fetch wrapper - store original fetch before any third-party overrides
 */
export function initializeFetchWrapper() {
  // Store original fetch before FullStory or other tools override it
  if (!((window as any).__originalFetch)) {
    (window as any).__originalFetch = window.fetch.bind(window);
  }
}
