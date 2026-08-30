/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#273033',
        primary1: '#3A4959',
        primary2: '#607A84',
        primary3: '#97B6C6',
        primary4: '#D7E9F4',
        primary5: '#E8EAE9',
        secondary: '#05B04A',
        appBg: '#F5F5F5',
        starColor: '#FFB904',
        moneyColor: '#18A25C',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
