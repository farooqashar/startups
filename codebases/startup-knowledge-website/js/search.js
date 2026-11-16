// Client-side full-text search

window.SK = window.SK || {};

window.SK.search = (function() {
  let searchIndex = [];
  let indexPromise = null;
  let indexReady = false;
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

    const entry = {
      path,
      title,
      url: '#/read/' + path.replace(/\.md$/, ''),
      text: plainText,
      snippet: plainText.substring(0, 150),
    };

    // Replace an existing entry so a full article supersedes a fallback excerpt
    const existingIndex = searchIndex.findIndex(item => item.path === path);
    if (existingIndex === -1) {
      searchIndex.push(entry);
    } else {
      searchIndex[existingIndex] = entry;
    }
  }

  // Index every manifest entry once. fetchFile reuses the session/local cache
  // and falls back to embedded excerpts; with neither, index title and description
  function buildIndex() {
    if (!indexPromise) {
      indexPromise = Promise.allSettled(SK.CONTENT_MANIFEST.map(item =>
        SK.github.fetchFile(item.path)
          .then(markdown => indexContent(item.path, item.title, markdown))
          .catch(() => indexContent(item.path, item.title, item.title + '\n' + item.description))
      )).then(() => { indexReady = true; });
    }
    return indexPromise;
  }

  // Clear search index
  function clearIndex() {
    searchIndex = [];
    indexPromise = null;
    indexReady = false;
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

  // Shown while the index is being built
  function renderSearching(query) {
    return `<div class="text-center py-12">
      <p class="text-slate-600 dark:text-slate-400">Searching for "<strong>${escapeHtml(query)}</strong>"…</p>
    </div>`;
  }

  // Build the index if needed, then render results into container.
  // isCurrent() returning false means a newer search replaced this one
  async function searchAndRender(query, container, isCurrent) {
    if (!indexReady) {
      container.innerHTML = renderSearching(query);
    }
    await buildIndex();
    if (isCurrent && !isCurrent()) return;
    container.innerHTML = renderResults(query, search(query));
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

  // Handle search input with debounce (header on desktop, sidebar on phones)
  function setupSearchInput() {
    ['header-search', 'sidebar-search'].forEach(id => {
      const searchInput = document.getElementById(id);
      if (searchInput) bindSearchInput(searchInput);
    });
  }

  function bindSearchInput(searchInput) {
    // Start building the index as soon as the visitor shows intent to search
    searchInput.addEventListener('focus', buildIndex);

    // Live search as you type
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();

      debounceTimer = setTimeout(() => {
        if (query.length > 0) {
          const resultsContainer = document.getElementById('search-results');
          if (resultsContainer) {
            searchAndRender(query, resultsContainer, () => searchInput.value.trim() === query);
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
          if (searchInput.id === 'sidebar-search') SK.app.toggleSidebar();
        }
      }
    });
  }

  return {
    indexContent,
    buildIndex,
    search,
    searchAndRender,
    renderResults,
    clearIndex,
    setupSearchInput,
  };
})();
