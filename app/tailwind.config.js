/** 색은 src/index.css 의 CSS 변수에서 가져온다 (밝은/어두운 테마를 한 번에 바꾸기 위해) */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        bg2: v('bg2'),
        card: v('card'),
        ink: v('ink'),
        muted: v('muted'),
        line: v('line'),
        primary: v('primary'),
        'primary-ink': v('primary-ink'),
        'primary-soft': v('primary-soft'),
        sage: v('sage'),
        forest: v('forest'),
        butter: v('butter'),
        apricot: v('apricot'),
        brown: v('brown'),
      },
      fontFamily: {
        display: ['"Gowun Batang"', 'serif'],
      },
      borderRadius: {
        '4xl': '28px',
      },
      boxShadow: {
        soft: '0 1px 2px rgb(60 50 30 / 0.04), 0 10px 30px -12px rgb(60 50 30 / 0.18)',
      },
      keyframes: {
        sheet: { from: { transform: 'translateY(24px)', opacity: '0' }, to: { transform: 'none', opacity: '1' } },
        fade: { from: { opacity: '0' }, to: { opacity: '1' } },
        pop: { '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.12)' }, '100%': { transform: 'scale(1)' } },
        toast: { from: { transform: 'translate(-50%, 12px)', opacity: '0' }, to: { transform: 'translate(-50%, 0)', opacity: '1' } },
      },
      animation: {
        sheet: 'sheet .28s ease-out',
        fade: 'fade .2s ease-out',
        pop: 'pop .45s ease-out',
        toast: 'toast .3s ease-out',
      },
    },
  },
  plugins: [],
};
