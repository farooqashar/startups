# Startup Knowledge Website

An interactive, beautiful knowledge base website for learning about startups. Built with pure HTML/CSS/JavaScript, no build system required.

**Live at:** https://farooqashar.github.io/startups

## Features

- **Dynamic Content Loading** — Fetches markdown from GitHub API with intelligent caching
- **Beautiful UI** — Responsive design with dark mode support, built with Tailwind CSS
- **Progressive Enhancement** — Works offline with embedded content fallbacks
- **Fast & Lightweight** — No build process, no npm, no frameworks
- **Search** — Client-side full-text search across all content
- **Mobile Friendly** — Responsive design with hamburger menu
- **Accessible** — Semantic HTML, keyboard navigation, focus management

## Tech Stack

- **HTML/CSS/JavaScript** — Pure vanilla, no frameworks
- **Tailwind CSS** — Loaded via CDN
- **marked.js** — Markdown parsing
- **GitHub API** — Dynamic content source
- **GitHub Pages** — Hosting

## Project Structure

```
startup-knowledge-website/
├── index.html          # Single-page app entry point
├── css/
│   └── styles.css      # Custom styles (animations, TOC, code blocks, etc.)
└── js/
    ├── app.js          # Router and view management
    ├── data.js         # Embedded content fallbacks & manifest
    ├── github.js       # GitHub API client with 3-tier caching
    ├── renderer.js     # Markdown rendering with TOC generation
    └── search.js       # Client-side full-text search
```

## Content Caching Strategy

The website uses a 3-tier caching approach to minimize API requests and work offline:

1. **sessionStorage** — Same session re-navigations cost zero requests
2. **localStorage** — Return visitors within 1 hour cost zero requests  
3. **Embedded excerpts** — If API is rate-limited or offline, shows cached content with GitHub links

This keeps the website snappy and respects GitHub's 60 req/hour unauthenticated API rate limit.

## How It Works

### Home Page
- Topic grid with 10 guides
- Featured case studies (6 companies)
- Quick metrics reference table
- Links to GitHub repo

### Article Reader
- Renders markdown from GitHub dynamically
- Auto-generated table of contents with sticky sidebar
- Active heading tracking while scrolling
- Previous/next article navigation
- Dark mode support

### Search
- Live search as you type
- Scored results (title matches boost score)
- Works across all loaded content

## Deployment

The website is live at: **https://farooqashar.github.io/startups**

### How GitHub Pages Works
- Files at repo root (`index.html`, `css/`, `js/`) are served by GitHub Pages
- Source code is organized in `codebases/startup-knowledge-website/` for better organization
- Both locations stay in sync (root copies are used for serving)

### Local Development
Simply open `index.html` in a browser. Works with `file://` protocol.

```bash
# From this directory
open index.html
```

## Customization

### Colors
Edit the Tailwind config in `index.html`:
```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: { ... },
        accent: { ... },
      }
    }
  }
}
```

### Dark Mode
Dark mode is automatic based on system preference, with toggle in header. Preference is saved to localStorage.

### Content
Content is pulled from the GitHub repo's wiki, notes, history, and resources folders. The manifest in `js/data.js` controls which files appear in the navigation.

## Performance

- No build process = instant loading in any environment
- Minimal JavaScript = fast parsing and execution
- Smart caching = return visitors see instant load times
- Markdown from GitHub = SEO-friendly, searchable content

## Browser Support

Works in all modern browsers that support:
- ES6 (async/await, arrow functions, template literals)
- Fetch API
- localStorage/sessionStorage
- IntersectionObserver

## License

Open source. Feel free to fork and adapt for your own startup knowledge base.
