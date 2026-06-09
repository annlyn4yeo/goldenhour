import type { Config } from 'tailwindcss'

export default {
  theme: {
    extend: {
      colors: {
        sky: {
          night: '#0b0c1a',
          dawn: '#1a1035',
          blueHourMorning: '#1e2d6e',
          goldenHourMorning: '#c45c2e',
          solar: '#e8a020',
          goldenHourEvening: '#b84a20',
          blueHourEvening: '#1e2a6a',
          dusk: '#0f0d2a',
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
