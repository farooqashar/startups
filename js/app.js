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
    });

    // Update icon visibility
    updateDarkModeIcon();
  }

  function updateDarkModeIcon() {
    const html = document.documentElement;
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');
    if (html.classList.contains('dark')) {
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

    // Case studies
    const caseStudies = document.querySelector('#featured-case-studies > div > div');
    caseStudies.innerHTML = SK.CASE_STUDIES.map(cs => `
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
          <p class="text-slate-600 dark:text-slate-400 text-sm">
            ${cs.summary.substring(0, 100)}...
          </p>
        </div>
      </a>
    `).join('');

    // Quick reference preview
    const tbody = document.querySelector('#quick-reference-preview tbody');
    tbody.innerHTML = SK.QUICK_REFERENCE_METRICS.early_stage.map(row => `
      <tr>
        <td class="px-4 py-3">${row.metric}</td>
        <td class="px-4 py-3 font-medium">${row.good}</td>
        <td class="px-4 py-3 text-primary-600 dark:text-primary-400 font-bold">${row.excellent}</td>
      </tr>
    `).join('');

    // Sidebar navigation
    const sidebar = document.getElementById('sidebar-content');
    const groupedItems = {};
    SK.CONTENT_MANIFEST.forEach(item => {
      if (!groupedItems[item.category]) groupedItems[item.category] = [];
      groupedItems[item.category].push(item);
    });

    sidebar.innerHTML = Object.entries(groupedItems).map(([category, items]) => `
      <div class="mb-6">
        <h3 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">
          ${category === 'wiki' ? '📚 Wiki' : category === 'notes' ? '📝 Notes' : '🔧 Resources'}
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

  // Setup routing
  function setupRouting() {
    window.addEventListener('hashchange', handleRoute);
  }

  // Handle hash route changes
  function handleRoute() {
    const hash = window.location.hash || '#/';
    const [path, query] = hash.substring(2).split('?');
    const parts = path.split('/');

    if (path === '' || path === '/') {
      showView('home');
    } else if (parts[0] === 'read' && parts[1] && parts[2]) {
      const filePath = `${parts[1]}/${parts[2]}.md`;
      loadArticle(filePath);
    } else if (parts[0] === 'quick-reference') {
      showQuickReference();
    } else if (parts[0] === 'search') {
      showSearch(new URLSearchParams(query).get('q'));
    } else if (parts[0] === 'wiki' || parts[0] === 'notes' || parts[0] === 'history' || parts[0] === 'resources') {
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
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
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
    const slug = parts[1].replace('.md', '');
    const item = SK.CONTENT_MANIFEST.find(m => m.path === filePath);

    const breadcrumb = document.getElementById('breadcrumb');
    breadcrumb.innerHTML = `
      <a href="#/" class="hover:text-primary-600">Home</a> /
      <span class="text-slate-400">${category}</span> /
      <span class="font-semibold">${item?.title || slug}</span>
    `;

    // Show loading state
    const articleBody = document.getElementById('article-body');
    articleBody.innerHTML = '<div class="skeleton h-8 w-1/3 mb-4"></div><div class="skeleton h-4 w-full mb-2"></div><div class="skeleton h-4 w-full mb-2"></div>';

    try {
      // Fetch content
      const markdown = await SK.github.fetchFile(filePath);

      // Render markdown
      const { html, toc, headings } = SK.renderer.render(markdown);

      // Update article body
      articleBody.innerHTML = html;

      // Update TOC
      const tocList = document.getElementById('toc-list');
      tocList.innerHTML = toc;

      // Set up TOC observer
      SK.renderer.setupTOCObserver();

      // Index content for search
      SK.search.indexContent(filePath, item?.title || slug, markdown);

      // Update article navigation
      updateArticleNavigation(filePath);
    } catch (error) {
      console.error('Failed to load article:', error);
      articleBody.innerHTML = `<div class="text-red-600 dark:text-red-400">Failed to load article. Please try again.</div>`;
    }

    currentPath = filePath;
  }

  // Update prev/next article navigation
  function updateArticleNavigation(filePath) {
    const currentIndex = SK.CONTENT_MANIFEST.findIndex(m => m.path === filePath);
    const prev = currentIndex > 0 ? SK.CONTENT_MANIFEST[currentIndex - 1] : null;
    const next = currentIndex < SK.CONTENT_MANIFEST.length - 1 ? SK.CONTENT_MANIFEST[currentIndex + 1] : null;

    const nav = document.getElementById('article-nav');
    nav.innerHTML = `
      ${prev ? `
        <a href="#/read/${prev.path.replace(/\.md$/, '')}" class="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors text-left">
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">← Previous</div>
          <div class="font-semibold text-slate-900 dark:text-white">${prev.title}</div>
        </a>
      ` : '<div></div>'}

      ${next ? `
        <a href="#/read/${next.path.replace(/\.md$/, '')}" class="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors text-right">
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Next →</div>
          <div class="font-semibold text-slate-900 dark:text-white">${next.title}</div>
        </a>
      ` : '<div></div>'}
    `;
  }

  // Show quick reference
  async function showQuickReference() {
    showView('quickref');

    const container = document.getElementById('quickref-content');
    container.innerHTML = '<div class="skeleton h-8 w-1/3 mb-4"></div>';

    try {
      const markdown = await SK.github.fetchFile('resources/quick-reference.md');
      const { html } = SK.renderer.render(markdown);
      container.innerHTML = html;
      SK.renderer.setupTOCObserver();
    } catch (error) {
      container.innerHTML = `<div class="text-red-600 dark:text-red-400">Failed to load quick reference.</div>`;
    }
  }

  // Show search results
  function showSearch(query) {
    showView('search');

    if (!query) {
      document.getElementById('search-results').innerHTML = `
        <div class="text-center py-12">
          <p class="text-slate-600 dark:text-slate-400">Use the search bar above to find topics</p>
        </div>
      `;
      return;
    }

    const results = SK.search.search(query);
    const resultsHtml = SK.search.renderResults(query, results);
    document.getElementById('search-results').innerHTML = resultsHtml;
  }

  // Browse category
  function showBrowse(category) {
    showView('home');
    // For now, just show home. Could expand this to show filtered results
  }

  // Mobile menu
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  mobileMenuBtn?.addEventListener('click', toggleSidebar);

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
