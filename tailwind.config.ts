import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				teal: 'hsl(var(--teal))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				'bg-primary': 'var(--bg-primary)',
				'bg-card': 'var(--bg-card)',
				'accent-green': 'var(--accent-green)',
				'accent-blue': 'var(--accent-blue)',
				'accent-pink': 'var(--accent-pink)',
				'brand-green': '#00b181',
				'brand-green-hover': '#4dbd74',
				'brand-teal': '#00b181',
				'brand-blue': '#254465',
				'brand-blue-dark': '#3d6b8b',
				'brand-bg': '#ecf0f1',

				// Logo cyan/teal
				'bp-cyan': '#20c9c9',
				'bp-cyan-light': '#1fd1d1',
				'bp-cyan-dark': '#00b8b8',

				// Card dark blue shades
				'bp-navy': '#0a1a2e',
				'bp-navy-light': '#0d2137',
				'bp-navy-mid': '#122a45',
				'bp-navy-deep': '#0b1726',

				// Button blue gradient
				'bp-blue': '#2a6bb5',
				'bp-blue-dark': '#1a4a8a',
				'bp-blue-mid': '#2c6db8',
				'bp-blue-deep': '#1e3f7a',

				// Text & accents
				'bp-white': '#ffffff',
				'bp-gray': '#a0aec0',
				'bp-gray-light': '#cbd5e0',
			},
			borderRadius: {
				xl: 'calc(var(--radius) + 4px)',
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				card: '18px',
				btn: '28px',
				logo: '50%',
			},
			boxShadow: {
				card: '0 10px 40px rgba(0, 0, 0, 0.45)',
				btn: '0 8px 20px rgba(0, 0, 0, 0.35), 0 4px 10px rgba(0, 0, 0, 0.25)',
				'btn-hover': '0 12px 28px rgba(0, 0, 0, 0.4)',
			},
			backgroundImage: {
				'card-gradient': 'linear-gradient(to bottom, #0d2137, #122a45)',
				'btn-gradient': 'linear-gradient(to bottom, #2a6bb5, #1a4a8a)',
				'btn-gradient-hover': 'linear-gradient(to bottom, #3a7bc5, #245a9a)',
				'page-pattern': "url('/img/bg-triangles.png')",
			},
			spacing: {
				'18': '4.5rem',
				'22': '5.5rem',
			},
			fontFamily: {
				sans: ['"Roboto Condensed"', 'Roboto', 'HelveticaNeue', '"Helvetica Neue"', 'Helvetica', 'Arial', '"Lucida Grande"', 'sans-serif'],
				condensed: ['"Roboto Condensed"', 'HelveticaNeue', 'Arial', 'sans-serif'],
				roboto: ['Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
				poppins: ['Poppins', 'sans-serif'],
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
