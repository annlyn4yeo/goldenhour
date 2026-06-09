import type { Config } from 'tailwindcss'

export default {
  theme: {
    extend: {
      colors: {
        sky: {
          dawn: '#1a1035',
          blueHour: '#2d3a8c',
          goldenHour: '#e8843a',
          solar: '#f5c842',
          dusk: '#c45c2e',
          night: '#0b0c1a',
        },
        surface: {
          base: '#faf9f6',
          card: '#ffffff',
          muted: '#f2f0eb',
          border: 'rgba(0,0,0,0.08)',
        },
        ink: {
          primary: '#1a1814',
          secondary: '#6b6760',
          tertiary: '#a8a49f',
          inverse: '#faf9f6',
        },
      },
      fontFamily: {
        display: ['DM Serif Display', 'serif'],
        ui: ['Inter', 'sans-serif'],
      },
      fontSize: {
        label: '11px',
        caption: '12px',
        body: '14px',
        bodyLg: '16px',
        title: '18px',
        heading: '24px',
        display: '40px',
        hero: '64px',
      },
      spacing: {
        section: '80px',
        gutter: '48px',
      },
    },
  },
} satisfies Config
