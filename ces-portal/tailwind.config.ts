import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          deep: 'var(--brand-deep)',
          teal: 'var(--brand-teal)',
          ink: 'var(--brand-ink)',
          bg: 'var(--brand-bg)',
          'bg-soft': 'var(--brand-bg-soft)',
          'bg-deep': 'var(--brand-bg-deep)',
          'tint-1': 'var(--brand-tint-1)',
          'tint-2': 'var(--brand-tint-2)',
          'tint-3': 'var(--brand-tint-3)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        muted: 'var(--muted)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        sans: 'var(--font-sans)',
        body: 'var(--font-body)',
      },
      fontSize: {
        'display-1': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-2': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
