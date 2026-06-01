// Client-side full-text search

window.SK = window.SK || {};

window.SK.search = (function() {
  let searchIndex = [];
  const DEBOUNCE_DELAY = 200;
  let debounceTimer = null;

  // Build search index from markdown content
  function indexContent(path, title, markdown) {
    if (!markdown || !title) return;

    // Plain text: remove markdown syntax
    const plainText = markdown
      .replace(/[#\-\*\[\]()]/g, ' ')
      .replace(/\n+/g, ' ')
      .toLowerCase()
      .trim();

    // Only index if not already indexed
    const exists = searchIndex.find(item => item.path === path);
    if (!exists) {
      searchIndex.push({
        path,
        title,
        url: '#/read/' + path.replace(/\.md$/, ''),
        text: plainText,
        snippet: plainText.substring(0, 150),
      });
    }
  }

  // Clear search index
  function clearIndex() {
    searchIndex = [];
  }

  // Search with scoring
  function search(query) {
    if (!query || query.length < 1) return [];

    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    const results = [];

    searchIndex.forEach(entry => {
      let score = 0;
      let matchCount = 0;

      terms.forEach(term => {
        const titleLower = entry.title.toLowerCase();
        const snippetLower = entry.snippet.toLowerCase();
        const textLower = entry.text.toLowerCase();

        // Title match: 5x boost
        if (titleLower.includes(term)) {
          score += 5;
          matchCount++;
        }
        // Snippet match: 2x boost
        else if (snippetLower.includes(term)) {
          score += 2;
          matchCount++;
        }
        // Full text match: 1x base
        else if (textLower.includes(term)) {
          score += 1;
          matchCount++;
        }
      });

      if (matchCount > 0) {
        // Bonus for matching more terms
        score *= (1 + (matchCount / terms.length) * 0.5);

        results.push({
          ...entry,
          score,
          matchCount,
        });
      }
    });

    // Sort by score (descending)
    return results.sort((a, b) => b.score - a.score).slice(0, 20);
  }

  // Extract snippet around match
  function extractSnippet(text, term, length = 120) {
    if (!text || !term) return 'No preview available';

    const index = text.toLowerCase().indexOf(term.toLowerCase());
    if (index === -1) return text.substring(0, length) + (text.length > length ? '...' : '');

    const start = Math.max(0, index - length / 2);
    const end = Math.min(text.length, start + length);
    let snippet = text.substring(start, end);

    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    // Highlight the matched term
    snippet = snippet.replace(
      new RegExp(`(${escapeRegex(term)})`, 'gi'),
      '<mark class="bg-yellow-200 dark:bg-yellow-700 font-semibold">$1</mark>'
    );

    return snippet;
  }

  // Escape special characters in regex
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Render search results
  function renderResults(query, results) {
    if (!results || results.length === 0) {
      return `<div class="text-center py-12">
        <div class="mb-4">
          <div class="text-4xl mb-2">🔍</div>
          <p class="text-lg font-semibold text-slate-900 dark:text-white mb-2">No results found</p>
          <p class="text-slate-600 dark:text-slate-400">No results for "<strong>${escapeHtml(query)}</strong>"</p>
        </div>
        <p class="text-sm text-slate-500 dark:text-slate-500 mt-6">
          Try different keywords or <a href="#/" class="text-primary-600 dark:text-primary-400 hover:underline">browse all topics</a>
        </p>
      </div>`;
    }

    return results.map(result => {
      const searchTerms = query.toLowerCase().split(/\s+/);
      const snippet = extractSnippet(result.text, searchTerms[0]);
      return `<div class="border border-slate-200 dark:border-slate-700 rounded-lg p-5 hover:border-primary-300 dark:hover:border-primary-500 hover:shadow-md transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-surface-700">
        <a href="${escapeHtml(result.url)}" class="block group">
          <div class="flex items-start justify-between mb-3">
            <h3 class="text-lg font-semibold text-primary-600 dark:text-primary-400 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
              ${escapeHtml(result.title)}
            </h3>
            <span class="badge text-xs">${Math.round(result.score)} pts</span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-3 font-mono">
            ${escapeHtml(result.path)}
          </p>
          <p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            ${snippet}
          </p>
        </a>
      </div>`;
    }).join('');
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Handle search input with debounce
  function setupSearchInput() {
    const searchInput = document.getElementById('header-search');
    if (!searchInput) return;

    // Live search as you type
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();

      debounceTimer = setTimeout(() => {
        if (query.length > 0) {
          const results = search(query);
          const resultsContainer = document.getElementById('search-results');
          if (resultsContainer) {
            if (results.length === 0) {
              resultsContainer.innerHTML = '';
            } else {
              resultsContainer.innerHTML = renderResults(query, results);
            }
          }
        }
      }, DEBOUNCE_DELAY);
    });

    // Navigate to results page on Enter
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          window.location.hash = '#/search?q=' + encodeURIComponent(query);
          searchInput.blur();
        }
      }
    });
  }

  return {
    indexContent,
    search,
    renderResults,
    clearIndex,
    setupSearchInput,
  };
})();
