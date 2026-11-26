// Main application controller and router

window.SK = window.SK || {};

window.SK.app = (function() {
  let currentView = 'home';
  let currentPath = null;
  let loadingContentCache = {};

  // Initialize app on DOM ready
  function init() {
    setupDarkMode();
    populateHome();
    setupRouting();
    SK.search.setupSearchInput();
    handleInitialRoute();
  }

  // Dark mode setup
  function setupDarkMode() {
    const html = document.documentElement;
    const isDark = localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      html.classList.add('dark');
      html.setAttribute('data-theme', 'dark');
    } else {
      html.classList.remove('dark');
      html.setAttribute('data-theme', 'light');
    }

    const darkModeToggle = document.getElementById('dark-mode-toggle');
    darkModeToggle.addEventListener('click', () => {
      const isDark = html.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      html.setAttribute('data-theme', isDark ? 'dark' : 'light');
      updateDarkModeIcon();
    });

    // Update icon visibility
    updateDarkModeIcon();
  }

  function updateDarkModeIcon() {
    const html = document.documentElement;
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');
    const isDark = html.classList.contains('dark');
    document.getElementById('dark-mode-toggle').setAttribute('aria-pressed', String(isDark));
    if (isDark) {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    } else {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    }
  }

  // Populate home page
  function populateHome() {
    // Topic grid
    const topicGrid = document.querySelector('#topic-grid > div');
    if (topicGrid) {
      topicGrid.innerHTML = SK.CONTENT_MANIFEST.map(item => `
        <a href="#/read/${item.path.replace(/\.md$/, '')}" class="group">
          <div class="border-2 border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-slate-50 dark:hover:bg-surface-700 transition-all cursor-pointer">
            <div class="text-3xl mb-4">${item.icon}</div>
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-primary-600 transition-colors">
              ${item.title}
            </h3>
            <p class="text-slate-600 dark:text-slate-400 text-sm">
              ${item.description}
            </p>
          </div>
        </a>
      `).join('');
    }

    // Case studies
    const caseStudiesContainer = document.querySelector('#featured-case-studies > div > div');
    if (caseStudiesContainer && SK.CASE_STUDIES) {
      caseStudiesContainer.innerHTML = SK.CASE_STUDIES.map(cs => `
        <a href="#/read/history/case-studies" class="group">
          <div class="bg-white dark:bg-surface-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600 hover:border-primary-500 dark:hover:border-primary-500 transition-colors">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h3 class="text-lg font-semibold text-slate-900 dark:text-white">${cs.company}</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400">Founded ${cs.year}</p>
              </div>
              <span class="badge ${cs.outcome === 'success' ? 'success' : 'warning'}">
                ${cs.outcome === 'success' ? '✓ Success' : '⚠ Cautionary'}
              </span>
            </div>
            <p class="text-slate-700 dark:text-slate-300 text-sm mb-3 font-medium">
              ${cs.lesson}
            </p>
            <p class="text-slate-600 dark:text-slate-400 text-sm line-clamp-2">
              ${cs.summary.substring(0, 120)}...
            </p>
          </div>
        </a>
      `).join('');
    }

    // Quick reference preview
    const tbody = document.querySelector('#quick-reference-preview tbody');
    if (tbody && SK.QUICK_REFERENCE_METRICS && SK.QUICK_REFERENCE_METRICS.early_stage) {
      tbody.innerHTML = SK.QUICK_REFERENCE_METRICS.early_stage.map(row => `
        <tr>
          <td class="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">${row.metric}</td>
          <td class="px-4 py-3 text-slate-700 dark:text-slate-300">${row.good}</td>
          <td class="px-4 py-3 text-primary-600 dark:text-primary-400 font-bold">${row.excellent}</td>
        </tr>
      `).join('');
    }

    // Sidebar navigation
    const sidebar = document.getElementById('sidebar-content');
    if (sidebar && SK.CONTENT_MANIFEST) {
      const groupedItems = {};
      SK.CONTENT_MANIFEST.forEach(item => {
        if (!groupedItems[item.category]) groupedItems[item.category] = [];
        groupedItems[item.category].push(item);
      });

      sidebar.innerHTML = Object.entries(groupedItems).map(([category, items]) => `
        <div class="mb-6">
          <h3 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">
            ${category === 'wiki' ? '📚 Wiki' : category === 'notes' ? '📝 Notes' : category === 'history' ? '📖 History' : '🔧 Resources'}
          </h3>
          <div class="space-y-1">
            ${items.map(item => `
              <a href="#/read/${item.path.replace(/\.md$/, '')}" onclick="SK.app.toggleSidebar()"
                 class="block px-3 py-2 text-sm rounded hover:bg-slate-100 dark:hover:bg-surface-700 text-slate-700 dark:text-slate-300 hover:text-primary-600 transition-colors">
                ${item.title}
              </a>
            `).join('')}
          </div>
        </div>
      `).join('');
    }
  }

  // Setup routing
  function setupRouting() {
    window.addEventListener('hashchange', handleRoute);
    document.addEventListener('click', handleSectionLinkClick);
  }

  // In-page section links (TOC entries, heading "#" anchors) would replace the
  // route hash, so scroll to the section instead of navigating
  function handleSectionLinkClick(event) {
    const link = event.target.closest('#article-body a, #toc-list a, #quickref-content a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#') || href.startsWith('#/')) return;

    event.preventDefault();
    const view = link.closest('main > section') || document;
    const target = view.querySelector('#' + CSS.escape(decodeURIComponent(href.substring(1))));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Handle hash route changes
  function handleRoute() {
    const hash = window.location.hash || '#/';
    const [path, query] = hash.substring(2).split('?');
    const parts = path.split('/').filter(p => p);

    if (parts.length === 0) {
      showView('home');
    } else if (parts[0] === 'read' && parts.length >= 2) {
      const filePath = parts.slice(1).join('/') + '.md';
      loadArticle(filePath);
    } else if (parts[0] === 'quick-reference') {
      showQuickReference();
    } else if (parts[0] === 'search') {
      showSearch(new URLSearchParams(query).get('q'));
    } else if (['wiki', 'notes', 'history', 'resources'].includes(parts[0])) {
      showBrowse(parts[0]);
    } else {
      showView('home');
    }
  }

  function handleInitialRoute() {
    const hash = window.location.hash;
    if (hash && hash !== '#/') {
      handleRoute();
    }
  }

  // Navigate to a route
  function navigate(route) {
    window.location.hash = route;
  }

  // Toggle mobile sidebar
  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const menuBtn = document.getElementById('mobile-menu-btn');
    const isOpen = sidebar.classList.toggle('-translate-x-full') === false;
    overlay.classList.toggle('hidden', !isOpen);

    // Keep the closed sidebar out of the Tab order and the accessibility tree
    sidebar.inert = !isOpen;
    sidebar.setAttribute('aria-hidden', String(!isOpen));
    menuBtn.setAttribute('aria-expanded', String(isOpen));
    menuBtn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');

    if (isOpen) {
      document.getElementById('sidebar-search').focus({ preventScroll: true });
    } else {
      menuBtn.focus();
    }
  }

  function isSidebarOpen() {
    return !document.getElementById('sidebar').classList.contains('-translate-x-full');
  }

  // Show a view
  function showView(viewName) {
    // Hide all views
    document.querySelectorAll('main > section').forEach(section => {
      section.classList.add('hidden');
    });

    // Show selected view
    const view = document.getElementById('view-' + viewName);
    if (view) {
      view.classList.remove('hidden');
      view.classList.add('view-enter');
    }

    currentView = viewName;
    window.scrollTo(0, 0);
  }

  // Load and display article
  async function loadArticle(filePath) {
    showView('reader');

    // Update breadcrumb
    const parts = filePath.split('/');
    const category = parts[0];
    const slug = parts[parts.length - 1].replace('.md', '');
    const item = SK.CONTENT_MANIFEST.find(m => m.path === filePath);

    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) {
      breadcrumb.innerHTML = `
        <a href="#/" class="hover:text-primary-600">Home</a>
        <span class="text-slate-400 mx-2">/</span>
        <a href="#/${category}" class="hover:text-primary-600 capitalize">${category}</a>
        <span class="text-slate-400 mx-2">/</span>
        <span class="font-semibold text-slate-900 dark:text-white">${item?.title || slug}</span>
      `;
    }

    // Show loading state
    const articleBody = document.getElementById('article-body');
    if (articleBody) {
      articleBody.innerHTML = '<div class="skeleton h-8 w-1/3 mb-4"></div><div class="skeleton h-4 w-full mb-2"></div><div class="skeleton h-4 w-full mb-2"></div>';
    }

    try {
      // Fetch content
      const markdown = await SK.github.fetchFile(filePath);

      if (!markdown) {
        throw new Error('No content returned');
      }

      // Render markdown
      const { html, toc, headings } = SK.renderer.render(markdown);

      // Update article body
      if (articleBody) {
        articleBody.innerHTML = html;
      }

      // Update TOC
      const tocList = document.getElementById('toc-list');
      if (tocList) {
        tocList.innerHTML = toc;
      }

      // Set up TOC observer
      setTimeout(() => {
        SK.renderer.setupTOCObserver();
      }, 100);

      // Index content for search
      SK.search.indexContent(filePath, item?.title || slug, markdown);

      // Update article navigation
      updateArticleNavigation(filePath);
    } catch (error) {
      console.error('Failed to load article:', error);
      if (articleBody) {
        articleBody.innerHTML = `<div class="text-center py-12">
          <p class="text-red-600 dark:text-red-400 font-semibold mb-4">Failed to load article</p>
          <p class="text-slate-600 dark:text-slate-400 mb-6">We couldn't load this content. Please try again or view it on GitHub.</p>
          <a href="https://github.com/farooqashar/startups/blob/main/${filePath}" target="_blank" class="text-primary-600 dark:text-primary-400 hover:underline">
            View on GitHub →
          </a>
        </div>`;
      }
    }

    currentPath = filePath;
  }

  // Update prev/next article navigation
  function updateArticleNavigation(filePath) {
    const currentIndex = SK.CONTENT_MANIFEST.findIndex(m => m.path === filePath);
    const prev = currentIndex > 0 ? SK.CONTENT_MANIFEST[currentIndex - 1] : null;
    const next = currentIndex < SK.CONTENT_MANIFEST.length - 1 ? SK.CONTENT_MANIFEST[currentIndex + 1] : null;

    const nav = document.getElementById('article-nav');
    if (nav) {
      nav.innerHTML = `
        ${prev ? `
          <a href="#/read/${prev.path.replace(/\.md$/, '')}" class="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors text-left hover:bg-slate-50 dark:hover:bg-surface-700">
            <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">← Previous</div>
            <div class="font-semibold text-slate-900 dark:text-white">${prev.title}</div>
          </a>
        ` : '<div></div>'}

        ${next ? `
          <a href="#/read/${next.path.replace(/\.md$/, '')}" class="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors text-right hover:bg-slate-50 dark:hover:bg-surface-700">
            <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Next →</div>
            <div class="font-semibold text-slate-900 dark:text-white">${next.title}</div>
          </a>
        ` : '<div></div>'}
      `;
    }
  }

  // Show quick reference
  async function showQuickReference() {
    showView('quickref');

    const container = document.getElementById('quickref-content');
    if (!container) return;

    container.innerHTML = '<div class="skeleton h-8 w-1/3 mb-4"></div><div class="skeleton h-4 w-full"></div><div class="skeleton h-4 w-full"></div>';

    try {
      const markdown = await SK.github.fetchFile('resources/quick-reference.md');
      if (!markdown) throw new Error('No content');
      const { html } = SK.renderer.render(markdown);
      container.innerHTML = html;
      setTimeout(() => {
        SK.renderer.setupTOCObserver();
      }, 100);
    } catch (error) {
      console.error('Failed to load quick reference:', error);
      container.innerHTML = `<div class="text-center py-12">
        <p class="text-red-600 dark:text-red-400 font-semibold mb-4">Failed to load quick reference</p>
        <a href="https://github.com/farooqashar/startups/blob/main/resources/quick-reference.md" target="_blank" class="text-primary-600 dark:text-primary-400 hover:underline">
          View on GitHub →
        </a>
      </div>`;
    }
  }

  // Show search results
  function showSearch(query) {
    showView('search');

    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;

    if (!query || query.trim() === '') {
      resultsContainer.innerHTML = `
        <div class="text-center py-12">
          <p class="text-slate-600 dark:text-slate-400 mb-4">Use the search bar to find topics</p>
          <p class="text-sm text-slate-500 dark:text-slate-500">Try searching for "funding", "team", "product", or other startup topics.</p>
        </div>
      `;
      return;
    }

    const hash = window.location.hash;
    SK.search.searchAndRender(query, resultsContainer, () => window.location.hash === hash);
  }

  // Browse category
  function showBrowse(category) {
    showView('home');
    // Filter and highlight category if needed
  }

  // Mobile menu
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', toggleSidebar);
  }

  // Close the mobile menu on Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isSidebarOpen()) {
      toggleSidebar();
    }
  });

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    navigate,
    toggleSidebar,
  };
})();
