// Markdown Renderer with TOC generation

window.SK = window.SK || {};

window.SK.renderer = (function() {
  // Configure marked.js
  marked.setOptions({
    gfm: true,
    breaks: false,
    headerIds: true,
    mangle: false,
  });

  // Custom renderer for marked
  const customRenderer = {
    heading(text, level) {
      const id = text.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      return `<h${level} id="${id}" class="group">
        ${text}
        <a href="#${id}" class="ml-2 opacity-0 group-hover:opacity-50 transition-opacity text-slate-400">#</a>
      </h${level}>`;
    },

    table(header, body) {
      return `<div class="table-wrapper overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>${header}</thead>
          <tbody>${body}</tbody>
        </table>
      </div>`;
    },

    code(code, language) {
      const highlighted = `<pre><code class="language-${language || 'plaintext'}">${escapeHtml(code)}</code></pre>`;
      return highlighted;
    },

    link(href, title, text) {
      if (!href) return text;
      const isExternal = !href.startsWith('#') && !href.startsWith('/');
      const attrs = isExternal ? `target="_blank" rel="noopener noreferrer"` : '';
      return `<a href="${href}" ${attrs} title="${title || ''}">${text}</a>`;
    },

    codespan(code) {
      return `<code>${escapeHtml(code)}</code>`;
    },

    image(href, title, text) {
      return `<img src="${href}" alt="${text}" title="${title || text}" class="rounded-lg max-w-full h-auto" loading="lazy">`;
    },

    list(body, ordered) {
      const tag = ordered ? 'ol' : 'ul';
      const attrs = ordered ? ' class="list-decimal"' : ' class="list-disc"';
      return `<${tag}${attrs}>${body}</${tag}>`;
    }
  };

  // Override marked's renderer
  marked.use({ renderer: customRenderer });

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Render markdown to HTML
  function renderMarkdown(markdown) {
    if (!markdown) return '';
    try {
      return marked.parse(markdown);
    } catch (error) {
      console.error('Markdown render error:', error);
      return `<p class="text-red-600">Error rendering content: ${escapeHtml(error.message)}</p>`;
    }
  }

  // Extract headings and build TOC
  function buildTableOfContents(htmlContent) {
    const container = document.createElement('div');
    container.innerHTML = htmlContent;

    const headings = Array.from(container.querySelectorAll('h2, h3, h4')).map(h => ({
      id: h.id || generateId(h.textContent),
      text: h.textContent.replace('#', '').trim(),
      level: parseInt(h.tagName[1]),
    }));

    return headings;
  }

  // Generate ID from text if missing
  function generateId(text) {
    return text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  // Render TOC as HTML
  function renderTOC(headings) {
    if (!headings || headings.length === 0) {
      return '<p class="text-slate-500 text-sm">No sections in this article</p>';
    }

    let html = '<ol class="space-y-2">';
    let currentLevel = 2;

    headings.forEach(h => {
      if (h.level > currentLevel) {
        // Open new nested lists
        for (let i = currentLevel; i < h.level; i++) {
          html += '<ol class="space-y-2 pl-4">';
        }
        currentLevel = h.level;
      } else if (h.level < currentLevel) {
        // Close nested lists
        for (let i = h.level; i < currentLevel; i++) {
          html += '</ol>';
        }
        currentLevel = h.level;
      }

      html += `<li><a href="#${h.id}" class="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm no-underline">${escapeHtml(h.text)}</a></li>`;
    });

    // Close any remaining open lists
    for (let i = 2; i < currentLevel; i++) {
      html += '</ol>';
    }
    html += '</ol>';

    return html;
  }

  // Set up intersection observer for active TOC highlighting
  function setupTOCObserver() {
    const toc = document.getElementById('toc-list');
    if (!toc) return;

    const links = toc.querySelectorAll('a');
    if (links.length === 0) return;

    const headings = Array.from(document.querySelectorAll('#article-body h2, #article-body h3, #article-body h4'));
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(entries => {
      let current = null;
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          current = entry.target.id;
        }
      });

      // Update active link in TOC
      links.forEach(link => {
        const href = link.getAttribute('href');
        link.classList.remove('active');
        
        if (current && href === '#' + current) {
          link.classList.add('active');
        }
      });
    }, {
      rootMargin: '-80px 0px -80% 0px'
    });

    headings.forEach(h => {
      if (h.id) observer.observe(h);
    });
  }

  // Full rendering pipeline
  function render(markdown) {
    if (!markdown) {
      return {
        html: '<p class="text-slate-500">No content available</p>',
        toc: '<p class="text-slate-500 text-sm">No sections</p>',
        headings: []
      };
    }

    try {
      const html = renderMarkdown(markdown);
      const headings = buildTableOfContents(html);
      const toc = renderTOC(headings);

      return { html, toc, headings };
    } catch (error) {
      console.error('Render pipeline error:', error);
      return {
        html: `<p class="text-red-600">Error rendering content</p>`,
        toc: '<p class="text-slate-500 text-sm">Error building TOC</p>',
        headings: []
      };
    }
  }

  return {
    render,
    renderMarkdown,
    renderTOC,
    buildTableOfContents,
    setupTOCObserver,
  };
})();
