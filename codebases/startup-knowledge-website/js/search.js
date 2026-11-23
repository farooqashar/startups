// Client-side full-text search

window.SK = window.SK || {};

window.SK.search = (function() {
  let searchIndex = [];
  let indexPromise = null;
  let indexReady = false;
  let lastBuild = 0;
  const DOC_TIMEOUT = 8000; // per-document wait before indexing a fallback
  const RETRY_DELAY = 60000; // minimum gap before refetching incomplete documents
  const DEBOUNCE_DELAY = 200;
  let debounceTimer = null;

  // Content quality, so a weaker fallback never replaces richer content
  const QUALITY_META = 0, QUALITY_EXCERPT = 1, QUALITY_FULL = 2;

  // Lowercase and swap markdown syntax and hyphens for spaces. Indexed text,
  // titles and queries all go through this so their terms line up
  function normalize(text) {
    return text
      .replace(/[#\-\*\[\]()]/g, ' ')
      .replace(/\n+/g, ' ')
      .toLowerCase()
      .trim();
  }

  // Query terms, normalized like the indexed text
  function queryTerms(query) {
    return normalize(query).split(/\s+/).filter(t => t.length > 0);
  }

  // Build search index from markdown content. Without an explicit quality,
  // content fetchFile cached for this session is the full article; anything
  // else it returned is an embedded excerpt
  function indexContent(path, title, markdown, quality) {
    if (!markdown || !title) return;
    if (quality === undefined) {
      quality = SK.github.isSessionCached(path) ? QUALITY_FULL : QUALITY_EXCERPT;
    }

    // Plain text: remove markdown syntax
    const plainText = normalize(markdown);

    const entry = {
      path,
      title,
      url: '#/read/' + path.replace(/\.md$/, ''),
      text: plainText,
      snippet: plainText.substring(0, 150),
      quality,
    };

    // Replace an existing entry only with content at least as rich
    const existingIndex = searchIndex.findIndex(item => item.path === path);
    if (existingIndex === -1) {
      searchIndex.push(entry);
    } else if (quality >= searchIndex[existingIndex].quality) {
      searchIndex[existingIndex] = entry;
    }
  }

  function indexMeta(item) {
    indexContent(item.path, item.title, item.title + '\n' + item.description, QUALITY_META);
  }

  // Fetch one document, waiting at most DOC_TIMEOUT. On a timeout or error the
  // title and description are indexed; a slow fetch that later succeeds still
  // indexes its content
  function indexDocument(item) {
    let timer;
    const fetched = SK.github.fetchFile(item.path)
      .then(markdown => indexContent(item.path, item.title, markdown))
      .catch(() => indexMeta(item))
      .finally(() => clearTimeout(timer));
    const timeout = new Promise(resolve => { timer = setTimeout(resolve, DOC_TIMEOUT); })
      .then(() => indexMeta(item));
    return Promise.race([fetched, timeout]);
  }

  function incompleteItems() {
    return SK.CONTENT_MANIFEST.filter(item => {
      const entry = searchIndex.find(e => e.path === item.path);
      return !entry || entry.quality < QUALITY_FULL;
    });
  }

  // Index every manifest entry. fetchFile reuses the session/local cache and
  // falls back to embedded excerpts. Later calls refetch documents that only
  // got a fallback, at most once per RETRY_DELAY
  function buildIndex() {
    if (indexPromise) return indexPromise;
    const items = indexReady ? incompleteItems() : SK.CONTENT_MANIFEST;
    if (items.length === 0 || (indexReady && Date.now() - lastBuild < RETRY_DELAY)) {
      return Promise.resolve();
    }
    lastBuild = Date.now();
    indexPromise = Promise.allSettled(items.map(indexDocument))
      .then(() => { indexReady = true; indexPromise = null; });
    return indexPromise;
  }

  // Clear search index
  function clearIndex() {
    searchIndex = [];
    indexPromise = null;
    indexReady = false;
    lastBuild = 0;
  }

  // Search with scoring
  function search(query) {
    if (!query || query.length < 1) return [];

    const terms = queryTerms(query);
    if (terms.length === 0) return [];
    const results = [];

    searchIndex.forEach(entry => {
      let score = 0;
      let matchCount = 0;

      terms.forEach(term => {
        const titleLower = normalize(entry.title);
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
    if (index === -1) return escapeHtml(text.substring(0, length)) + (text.length > length ? '...' : '');

    const start = Math.max(0, index - length / 2);
    const end = Math.min(text.length, start + length);
    let snippet = text.substring(start, end);

    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    // Highlight the matched term. Article text is escaped piece by piece so
    // only the highlight markup is HTML
    return snippet
      .split(new RegExp(`(${escapeRegex(term)})`, 'gi'))
      .map((part, i) => i % 2
        ? `<mark class="bg-yellow-200 dark:bg-yellow-700 font-semibold">${escapeHtml(part)}</mark>`
        : escapeHtml(part))
      .join('');
  }

  // What to highlight in text: the whole query when it appears as a phrase
  // (so "co-founder" highlights "co founder"), else the first term found
  function highlightTerm(query, text) {
    const terms = queryTerms(query);
    const phrase = terms.join(' ');
    if (text.includes(phrase)) return phrase;
    return terms.find(term => text.includes(term)) || terms[0];
  }

  // Escape special characters in regex
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Shown while the index is being built
  function renderSearching(query) {
    return `<div class="text-center py-12" data-search-pending>
      <p class="text-slate-600 dark:text-slate-400">Searching for "<strong>${escapeHtml(query)}</strong>"…</p>
    </div>`;
  }

  // Build the index if needed, then render results into container. Once the
  // first build is done, results render at once and again after any refetch.
  // isCurrent() returning false means a newer search replaced this one
  async function searchAndRender(query, container, isCurrent) {
    const render = () => {
      if (isCurrent && !isCurrent()) return;
      container.innerHTML = renderResults(query, search(query));
    };
    if (indexReady) {
      render();
    } else {
      container.innerHTML = renderSearching(query);
    }
    await buildIndex();
    render();
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
      const snippet = extractSnippet(result.text, highlightTerm(query, result.text));
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
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;
        if (query.length > 0) {
          searchAndRender(query, resultsContainer, () => searchInput.value.trim() === query);
        } else if (resultsContainer.querySelector('[data-search-pending]')) {
          // The pending search was cleared: drop its loading message
          resultsContainer.innerHTML = '';
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
