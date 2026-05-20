import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Priority color tokens — used by Tag, PriorityBadge, and the Kanban
        // column accents. Centralized so a redesign touches one file.
        priority: {
          low: '#94a3b8',
          medium: '#6366f1',
          high: '#f59e0b',
          urgent: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};

export default config;
