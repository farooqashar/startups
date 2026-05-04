// GitHub API Client with 3-layer caching

window.SK = window.SK || {};

window.SK.github = (function() {
  const OWNER = 'farooqashar';
  const REPO = 'startups';
  const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}/contents`;
  const CACHE_PREFIX = 'sk_';
  const CACHE_TTL = 3600000; // 1 hour in milliseconds

  let rateLimitRemaining = 60;
  let rateLimitReset = null;
  let inFlight = new Set();

  // Fetch a file from GitHub with 3-tier caching strategy
  async function fetchFile(path) {
    // Check sessionStorage (same session, no requests)
    const sessionCached = sessionStorage.getItem(CACHE_PREFIX + path);
    if (sessionCached) {
      return sessionCached;
    }

    // Check localStorage (cross-session cache with TTL)
    const localCached = localStorage.getItem(CACHE_PREFIX + path);
    const localTimestamp = localStorage.getItem(CACHE_PREFIX + path + '_ts');
    if (localCached && localTimestamp) {
      const age = Date.now() - parseInt(localTimestamp);
      if (age < CACHE_TTL) {
        // Cache is still fresh, use it
        sessionStorage.setItem(CACHE_PREFIX + path, localCached);
        return localCached;
      }
    }

    // If rate-limited, use embedded fallback
    if (rateLimitRemaining <= 0) {
      const excerpt = window.SK.EXCERPTS[path];
      if (excerpt) {
        return excerpt + '\n\n> ⚠️ **Note**: Showing cached preview. [View full content on GitHub](https://github.com/farooqashar/startups/blob/main/' + path + ')';
      }
    }

    // Prevent duplicate requests for same file
    if (inFlight.has(path)) {
      return new Promise(resolve => {
        const checkInterval = setInterval(() => {
          const cached = sessionStorage.getItem(CACHE_PREFIX + path);
          if (cached) {
            clearInterval(checkInterval);
            resolve(cached);
          }
        }, 100);
      });
    }

    // Fetch from GitHub API
    inFlight.add(path);
    try {
      const response = await fetch(`${API_BASE}/${path}`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      // Update rate limit info
      const remaining = response.headers.get('x-ratelimit-remaining');
      const reset = response.headers.get('x-ratelimit-reset');
      if (remaining) rateLimitRemaining = parseInt(remaining);
      if (reset) rateLimitReset = new Date(parseInt(reset) * 1000);

      if (!response.ok) {
        // Use embedded fallback if API fails
        const excerpt = window.SK.EXCERPTS[path];
        if (excerpt) {
          return excerpt + '\n\n> ⚠️ **Error loading from GitHub**. [View full content on GitHub](https://github.com/farooqashar/startups/blob/main/' + path + ')';
        }
        throw new Error(`Failed to fetch ${path}: ${response.status}`);
      }

      const data = await response.json();
      const content = atob(data.content.replace(/\n/g, ''));

      // Cache in both sessionStorage and localStorage
      sessionStorage.setItem(CACHE_PREFIX + path, content);
      localStorage.setItem(CACHE_PREFIX + path, content);
      localStorage.setItem(CACHE_PREFIX + path + '_ts', Date.now().toString());

      return content;
    } catch (error) {
      console.error('GitHub API error:', error);
      // Fall back to embedded excerpt
      const excerpt = window.SK.EXCERPTS[path];
      if (excerpt) {
        return excerpt + '\n\n> ⚠️ **Unable to load full content**. [View on GitHub](https://github.com/farooqashar/startups/blob/main/' + path + ')';
      }
      throw error;
    } finally {
      inFlight.delete(path);
    }
  }

  // Get rate limit info
  function getRateLimitInfo() {
    return {
      remaining: rateLimitRemaining,
      resetTime: rateLimitReset,
    };
  }

  // Clear cache for a specific path or all paths
  function clearCache(path) {
    if (path) {
      sessionStorage.removeItem(CACHE_PREFIX + path);
      localStorage.removeItem(CACHE_PREFIX + path);
      localStorage.removeItem(CACHE_PREFIX + path + '_ts');
    } else {
      // Clear all cached files
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key.startsWith(CACHE_PREFIX)) keysToRemove.push(key);
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(CACHE_PREFIX)) keysToRemove.push(key);
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  }

  // Set rate limit (for testing)
  function setRateLimit(limit) {
    rateLimitRemaining = limit;
  }

  return {
    fetchFile,
    getRateLimitInfo,
    clearCache,
    setRateLimit,
  };
})();
