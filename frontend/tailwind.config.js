/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chakra: {
          teal: {
            50: '#E6FFFA',
            100: '#B2F5EA',
            200: '#81E6D9',
            300: '#4FD1C5',
            400: '#38B2AC',
            500: '#319795', // Primary brand
            600: '#2C7A7B',
            700: '#285E61',
            800: '#234E52',
            900: '#1D4044',
          },
          gray: {
            50: '#F7FAFC',
            100: '#EDF2F7',
            200: '#E2E8F0',
            300: '#CBD5E0',
            400: '#A0AEC0',
            500: '#718096',
            600: '#4A5568',
            700: '#2D3748',
            800: '#1A202C', // Card background
            900: '#171923', // Body background
            950: '#0F1117',
          },
          blue: {
            50: '#EBF8FF',
            100: '#BEE3F8',
            200: '#90CDF4',
            300: '#63B3ED',
            400: '#4299E1',
            500: '#3182CE',
            600: '#2B6CB0',
            700: '#2C5282',
            800: '#2A4365',
            900: '#1A365D',
          },
          purple: {
            50: '#FAF5FF',
            100: '#E9D8FD',
            200: '#D6BCFA',
            300: '#B794F4',
            400: '#9F7AEA',
            500: '#805AD5',
            600: '#6B46C1',
            700: '#553C9A',
            800: '#44337A',
            900: '#322659',
          },
          green: {
            50: '#F0FFF4',
            100: '#C6F6D5',
            200: '#9AE6B4',
            300: '#68D391',
            400: '#48BB78',
            500: '#38A169',
            600: '#2F855A',
            700: '#276749',
            800: '#22543D',
            900: '#1C4532',
          },
          red: {
            50: '#FFF5F5',
            100: '#FED7D7',
            200: '#FEB2B2',
            300: '#FC8181',
            400: '#F56565',
            500: '#E53E3E',
            600: '#C53030',
            700: '#9B2C2C',
            800: '#742A2A',
            900: '#63171B',
          },
          orange: {
            50: '#FFFAF0',
            100: '#FEEBC8',
            200: '#FBD38D',
            300: '#F6AD55',
            400: '#ED8936',
            500: '#DD6B20',
            600: '#C05621',
            700: '#9C4221',
            800: '#7B341E',
            900: '#652B19',
          },
          cyan: {
            50: '#EDFDFD',
            100: '#C4F1F9',
            200: '#9DECF9',
            300: '#76E4F7',
            400: '#0BC5EA',
            500: '#00B5D8',
            600: '#00A3C4',
            700: '#0987A0',
            800: '#086F83',
            900: '#065666',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['"Merriweather"', '"Georgia"', 'Cambria', 'serif'],
        mono: ['"SFMono-Regular"', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      }
    },
  },
  plugins: [],
}
