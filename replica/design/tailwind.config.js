/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          subtle: 'var(--surface-subtle)',
        },
        border: {
          DEFAULT: 'var(--border)',
          input: 'var(--border-input)',
        },
        text: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          light: 'var(--accent-light)',
        },
        'on-accent': 'var(--on-accent)',
        danger: {
          DEFAULT: 'var(--danger)',
          light: 'var(--danger-light)',
        },
        success: {
          DEFAULT: 'var(--success)',
          light: 'var(--success-light)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          light: 'var(--warning-light)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        '2xs': ['var(--text-2xs)', { lineHeight: '14px' }],
        xs: ['var(--text-xs)', { lineHeight: '16px' }],
        sm: ['var(--text-sm)', { lineHeight: '20px' }],
        base: ['var(--text-base)', { lineHeight: '24px' }],
        md: ['var(--text-md)', { lineHeight: '26px' }],
        lg: ['var(--text-lg)', { lineHeight: '28px' }],
        xl: ['var(--text-xl)', { lineHeight: '32px' }],
        '2xl': ['var(--text-2xl)', { lineHeight: '36px' }],
        display: ['var(--text-display)', { lineHeight: '48px' }],
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
        popover: 'var(--shadow-popover)',
      },
      transitionDuration: {
        fast: 'var(--motion-fast)',
        base: 'var(--motion-base)',
        spring: 'var(--motion-spring)',
      },
      transitionTimingFunction: {
        smooth: 'var(--motion-ease)',
      },
    },
  },
  plugins: [],
};
