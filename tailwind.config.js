/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
          red: 'var(--color-red)',
          white: 'var(--color-white)',
          success: 'var(--color-success)',
          bg_primary: 'var(--color-bg-primary)',
          bg_secondary: 'var(--color-bg-secondary)',
          bg_tertiary: 'var(--color-bg-tertiary)',
          bg_dark: 'var(--color-bg-dark)',
          text_primary: 'var(--color-text-primary)',
          text_secondary: 'var(--color-text-secondary)',
          text_tertiary: 'var(--color-text-tertiary)',
          border_color: 'var(--color-border)',
          severity_info: 'var(--severity-color-info-bg)',
          severity_warning: 'var(--severity-color-warning-bg)',
          severity_average: 'var(--severity-color-average-bg)',
          severity_high: 'var(--severity-color-high-bg)',
          severity_disaster: 'var(--severity-color-disaster-bg)'
      },
    },
  },
  plugins: [],
};