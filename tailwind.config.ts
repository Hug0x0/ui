import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: 'class',
    content: ['./src/pages/**/*.{js,ts,jsx,tsx,mdx}', './src/components/**/*.{js,ts,jsx,tsx,mdx}', './src/app/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
        extend: {
            fontFamily: {
                inter: ['var(--font-inter)', 'sans-serif'],
                'inter-tight': ['var(--font-inter-tight)', 'sans-serif'],
            },
            colors: {
                // Core colors from CSS variables
                background: 'hsl(var(--color-background) / <alpha-value>)',
                'background-opposite': 'hsl(var(--color-background-opposite) / <alpha-value>)',
                primary: 'hsl(var(--color-primary) / <alpha-value>)',
                default: 'hsl(var(--color-default) / <alpha-value>)',
                'hl-light-green': 'hsl(var(--color-hl-light-green) / <alpha-value>)',
                'hl-dark-green': 'hsl(var(--color-hl-dark-green) / <alpha-value>)',

                // Platform-specific colors
                'hyper-evm-lps': 'hsl(var(--color-hyper-evm-lps) / <alpha-value>)',
                'hyper-evm-balances': 'hsl(var(--color-hyper-evm-balances) / <alpha-value>)',
                'hyper-core-perps': 'hsl(var(--color-hyper-core-perps) / <alpha-value>)',
                'hyper-core-spots': 'hsl(var(--color-hyper-core-spots) / <alpha-value>)',

                // Status colors
                success: 'hsl(var(--color-success) / <alpha-value>)',
                warning: 'hsl(var(--color-warning) / <alpha-value>)',
                error: 'hsl(var(--color-error) / <alpha-value>)',
            },
            animation: {
                'skeleton-move': 'skeleton-move 2s infinite',
                flash: 'flash 0.8s ease-in-out',
                'gradient-shift': 'gradient-shift 3s ease-in-out infinite',
            },
            keyframes: {
                'skeleton-move': {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                'gradient-shift': {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
            },
        },
    },
    plugins: [],
    safelist: [
        // Platform-specific text colors used in sections
        'text-hyper-evm-lps',
        'text-hyper-evm-balances',
        'text-hyper-core-perps',
        'text-hyper-core-spots',
        'text-hyper-drive',
    ],
}

export default config
