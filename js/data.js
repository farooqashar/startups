// Startup Knowledge — Embedded Content & Manifest
// This file contains fallback content for offline use and content metadata

window.SK = window.SK || {};

// Content Manifest — all available documents
window.SK.CONTENT_MANIFEST = [
  {
    path: 'wiki/startup-fundamentals.md',
    title: 'Startup Fundamentals',
    description: 'What is a startup, lifecycle stages, key concepts',
    category: 'wiki',
    icon: '🚀',
    routeSlug: 'startup-fundamentals',
  },
  {
    path: 'wiki/startup-playbook.md',
    title: 'The Startup Playbook',
    description: 'Step-by-step guide from idea validation to PMF',
    category: 'wiki',
    icon: '📋',
    routeSlug: 'startup-playbook',
  },
  {
    path: 'wiki/funding-capital.md',
    title: 'Funding & Capital',
    description: 'Fundraising strategies, types of investors, valuations',
    category: 'wiki',
    icon: '💰',
    routeSlug: 'funding-capital',
  },
  {
    path: 'wiki/team-culture.md',
    title: 'Team & Culture',
    description: 'Hiring, compensation, equity, building teams',
    category: 'wiki',
    icon: '👥',
    routeSlug: 'team-culture',
  },
  {
    path: 'wiki/product-development.md',
    title: 'Product Development',
    description: 'Customer discovery, MVP building, metrics, iteration',
    category: 'wiki',
    icon: '🎯',
    routeSlug: 'product-development',
  },
  {
    path: 'wiki/business-models-operations.md',
    title: 'Business Models & Operations',
    description: 'Revenue models, unit economics, scaling operations',
    category: 'wiki',
    icon: '⚙️',
    routeSlug: 'business-models-operations',
  },
  {
    path: 'history/case-studies.md',
    title: 'Case Studies',
    description: 'Real startup stories: Airbnb, Slack, Stripe, and more',
    category: 'history',
    icon: '📖',
    routeSlug: 'case-studies',
  },
  {
    path: 'notes/common-mistakes.md',
    title: 'Common Mistakes',
    description: '20+ patterns of what goes wrong at each startup stage',
    category: 'notes',
    icon: '⚠️',
    routeSlug: 'common-mistakes',
  },
  {
    path: 'notes/startup-patterns.md',
    title: 'Startup Patterns',
    description: '10 repeating patterns from successful companies',
    category: 'notes',
    icon: '🔄',
    routeSlug: 'startup-patterns',
  },
  {
    path: 'notes/frameworks-methodologies.md',
    title: 'Frameworks & Methodologies',
    description: 'Lean Startup, OKRs, Jobs to be Done, and more',
    category: 'notes',
    icon: '🛠️',
    routeSlug: 'frameworks-methodologies',
  },
  {
    path: 'resources/quick-reference.md',
    title: 'Quick Reference',
    description: 'Metrics, checklists, templates, and definitions',
    category: 'resources',
    icon: '📊',
    routeSlug: 'quick-reference',
  },
  {
    path: 'resources/tools-and-links.md',
    title: 'Tools & Resources',
    description: 'Curated list of tools for each startup stage',
    category: 'resources',
    icon: '🔧',
    routeSlug: 'tools-and-links',
  },
];

// Case Study Summaries — hardcoded for home page
window.SK.CASE_STUDIES = [
  {
    company: 'Airbnb',
    year: 2008,
    lesson: 'Persistence through rejection',
    outcome: 'success',
    summary: 'Founders rented air mattresses to pay rent. Rejected by every VC. Succeeded through relentless iteration and customer obsession.',
  },
  {
    company: 'Slack',
    year: 2013,
    lesson: 'Built from a real problem',
    outcome: 'success',
    summary: 'Started as internal tool for a game studio. Recognized the tool was more valuable than the game itself.',
  },
  {
    company: 'Stripe',
    year: 2010,
    lesson: 'Understanding your market deeply',
    outcome: 'success',
    summary: 'Founders understood payment processing pain. Took 2 years to get first customers but built right product.',
  },
  {
    company: 'Instagram',
    year: 2010,
    lesson: 'The pivot',
    outcome: 'success',
    summary: 'Launched as Burbn (complex location app), noticed users only used photos. Pivoted and became billion-dollar company.',
  },
  {
    company: 'WeWork',
    year: 2010,
    lesson: 'When unit economics fail',
    outcome: 'cautionary',
    summary: 'Explosive growth but negative unit economics. Burned billions, went bankrupt. Growth at any cost doesn\'t work.',
  },
  {
    company: 'Zoom',
    year: 2011,
    lesson: 'Right place, right time',
    outcome: 'success',
    summary: 'Built reliable video conferencing for years. COVID-19 happened, and world needed Zoom. Exploded from 10M to 300M users.',
  },
];

// Quick Reference — Key Metrics Tables (embedded for offline access)
window.SK.QUICK_REFERENCE_METRICS = {
  early_stage: [
    { metric: 'Day 7 Retention', good: '40%+', excellent: '50%+' },
    { metric: 'Day 30 Retention', good: '20%+', excellent: '30%+' },
    { metric: 'Monthly Growth', good: '5% MoM', excellent: '10%+ MoM' },
    { metric: 'NPS', good: '20+', excellent: '40+' },
    { metric: 'Customer interviews/month', good: '10+', excellent: '20+' },
  ],
  growth_stage: [
    { metric: 'MoM Growth', good: '10%', excellent: '20%+' },
    { metric: 'Day 30 Retention', good: '30%+', excellent: '40%+' },
    { metric: 'CAC Payback', good: '<12 mo', excellent: '<6 mo' },
    { metric: 'LTV/CAC Ratio', good: '3x', excellent: '5x+' },
    { metric: 'Monthly Churn', good: '<5%', excellent: '<2%' },
  ],
  saas_benchmarks: [
    { metric: 'Gross Margin', benchmark: '70%+' },
    { metric: 'Magic Number', benchmark: '>0.75' },
    { metric: 'CAC Payback', benchmark: '6-12 months' },
    { metric: 'Expansion Revenue', benchmark: '10-20%' },
  ],
};

// Excerpts from key documents (first ~500 words from each, for offline fallback)
window.SK.EXCERPTS = {
  'wiki/startup-fundamentals.md': `# Startup Fundamentals

## What is a Startup?

A startup is a young company founded to develop a unique product or service, bring it to a market, and scale it to reach many customers. Key characteristics:

- **Young and small** — Recently founded, typically small team
- **Innovation-focused** — Solving a new problem or solving existing problems in new ways
- **High growth potential** — Designed to scale rapidly
- **High risk** — Significant probability of failure, but potential for outsized returns
- **Resource-constrained** — Limited capital, limited time, limited people

This is different from a **small business** (generates income for owners, not designed to scale dramatically) and a **growth-stage company** (larger, more established business model).

## The Startup Lifecycle

### Stage 1: Ideation & Validation (Pre-Launch)
- **Goal**: Validate that the problem is real and worth solving
- **Activities**: Research, customer interviews, proof-of-concept
- **Metrics**: Customer validation, problem severity, market size
- **Funding**: Founder's own money, friends & family

### Stage 2: MVP & Launch (Early Stage)
- **Goal**: Build and launch first version of product, get initial customers
- **Activities**: Product development, first sales/users, iterate based on feedback
- **Metrics**: User acquisition, retention, engagement, product-market fit signals
- **Funding**: Seed funding, angel investors

### Stage 3: Growth (Growth Stage)
- **Goal**: Achieve product-market fit and scale
- **Activities**: Increase marketing/sales, expand team, optimize operations
- **Metrics**: Growth rate, unit economics, customer acquisition cost (CAC), lifetime value (LTV)
- **Funding**: Series A, B, C funding rounds

### Stage 4: Scale (Late Stage)
- **Goal**: Dominate market, prepare for profitability or exit
- **Activities**: Enter new markets, vertical integration, efficiency
- **Metrics**: Market share, profitability, unit economics optimization
- **Funding**: Later rounds, debt financing, strategic investors`,

  'wiki/funding-capital.md': `# Funding & Capital for Startups

Understanding how to fund your startup and work with investors.

## Overview: Sources of Startup Capital

### 1. Bootstrapping (Self-Funded)
**What it is**: Using your own money, revenue, and resources to fund the company

**Pros**:
- Complete control and ownership
- No pressure to grow beyond what makes sense
- Forced discipline on spending
- Keep all upside

**Cons**:
- Limited capital limits speed
- Personal financial risk
- Harder to hire top talent
- Slower to market

### 2. Friends & Family
**What it is**: Loans or investments from people who know you

**Pros**:
- Easier to get than institutional funding
- More flexible terms
- Relationship-based

**Cons**:
- Mixes money and relationships (risky)
- May lack sophistication on structures
- Limited capital
- Can damage relationships if things fail

### 3. Angel Investors
**What it is**: Wealthy individuals who invest their own money in early-stage startups

**Pros**:
- Bring experience and networks
- Flexible with terms
- Often faster decision than VCs
- Can mentor you

**Cons**:
- Give up equity
- Each check is relatively small ($25k-$250k)
- Need to convince individually`,

  'resources/quick-reference.md': `# Startup Quick Reference Guide

Quick lookup tables and checklists for common startup tasks.

## Pre-Launch Checklist
- [ ] Validated problem with 20+ potential customers
- [ ] Built MVP (can use no-code tools)
- [ ] Clear onboarding and how product works
- [ ] Way to collect feedback (email, form)
- [ ] Analytics setup (Google Analytics at minimum)
- [ ] Way to reach out if needed issues

## Series A Readiness Checklist
- [ ] $10K+ ARR minimum (proof of concept)
- [ ] 30%+ monthly growth for 3+ months
- [ ] >50% customer retention at 6 months
- [ ] Clear unit economics (CAC, LTV)
- [ ] Team of at least 3-5 people
- [ ] Professional financial projections
- [ ] Customer references who love your product

## Quick Definitions

**MRR**: Monthly recurring revenue (subscription pricing × active customers)

**ARR**: Annual recurring revenue (MRR × 12)

**CAC**: Customer acquisition cost (total sales/marketing spend ÷ new customers)

**LTV**: Lifetime value (average revenue per customer × average customer lifetime)

**PMF**: Product-market fit (when customers want and use your product)

**MVP**: Minimum viable product (smallest product to test hypothesis)

**Burn rate**: Monthly cash spending

**Runway**: Months until cash runs out (current cash ÷ monthly burn rate)`,
};
