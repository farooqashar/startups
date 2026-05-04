// Client-side full-text search

window.SK = window.SK || {};

window.SK.search = (function() {
  let searchIndex = [];
  const DEBOUNCE_DELAY = 200;
  let debounceTimer = null;

  // Build search index from markdown content
  function indexContent(path, title, markdown) {
    // Plain text: remove markdown syntax
    const plainText = markdown
      .replace(/[#\-\*\[\]()]/g, ' ')
      .replace(/\n+/g, ' ')
      .toLowerCase();

    searchIndex.push({
      path,
      title,
      url: '#/read/' + path.replace(/\.md$/, ''),
      text: plainText,
      snippet: plainText.substring(0, 200),
    });
  }

  // Clear search index
  function clearIndex() {
    searchIndex = [];
  }

  // Search with scoring
  function search(query) {
    if (!query || query.length < 2) return [];

    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    const results = [];

    searchIndex.forEach(entry => {
      let score = 0;
      let matchCount = 0;

      terms.forEach(term => {
        // Title match: 3x boost
        if (entry.title.toLowerCase().includes(term)) {
          score += 3;
          matchCount++;
        }

        // Snippet match: 1x base
        if (entry.snippet.includes(term)) {
          score += 1;
          matchCount++;
        }

        // Full text match: bonus
        if (entry.text.includes(term)) {
          score += 0.5;
        }
      });

      if (matchCount > 0) {
        // Bonus for matching all terms
        if (matchCount === terms.length) {
          score *= 1.5;
        }

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
    const index = text.toLowerCase().indexOf(term.toLowerCase());
    if (index === -1) return text.substring(0, length) + '...';

    const start = Math.max(0, index - length / 2);
    const end = Math.min(text.length, index + length / 2);
    let snippet = text.substring(start, end);

    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    // Highlight the matched term
    snippet = snippet.replace(
      new RegExp(`(${term})`, 'gi'),
      '<mark class="bg-accent-400 dark:bg-accent-500 font-semibold">$1</mark>'
    );

    return snippet;
  }

  // Render search results
  function renderResults(query, results) {
    if (results.length === 0) {
      return `<div class="text-center py-12">
        <p class="text-slate-600 dark:text-slate-400 mb-4">No results found for "<strong>${escapeHtml(query)}</strong>"</p>
        <p class="text-sm text-slate-500 dark:text-slate-500">Try different keywords or <a href="#/wiki/startup-fundamentals" class="text-primary-600 hover:underline">browse topics</a></p>
      </div>`;
    }

    return results.map(result => {
      const snippet = extractSnippet(result.text, query.split(/\s+/)[0]);
      return `<div class="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
        <a href="${result.url}" class="text-lg font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 no-underline">
          ${escapeHtml(result.title)}
        </a>
        <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">
          ${escapeHtml(result.path)}
        </p>
        <p class="text-sm text-slate-700 dark:text-slate-300 mt-2">
          ${snippet}
        </p>
      </div>`;
    }).join('');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Handle search input with debounce
  function setupSearchInput() {
    const searchInput = document.getElementById('header-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();

      if (query.length < 2) {
        document.getElementById('search-results').innerHTML = '';
        return;
      }

      debounceTimer = setTimeout(() => {
        const results = search(query);
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
          resultsContainer.innerHTML = renderResults(query, results);
        }
      }, DEBOUNCE_DELAY);
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
