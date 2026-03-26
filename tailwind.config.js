const withOpacityValue = (variable) => `rgb(var(${variable}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
	darkMode: "class",
	content: ["./index.html", "./src/**/*.{ts,tsx}"],
	theme: {
		extend: {
			colors: {
				background: withOpacityValue("--color-background"),
				surface: withOpacityValue("--color-surface"),
				"surface-muted": withOpacityValue("--color-surface-muted"),
				"surface-strong": withOpacityValue("--color-surface-strong"),
				border: withOpacityValue("--color-border"),
				"border-muted": withOpacityValue("--color-border-muted"),
				foreground: withOpacityValue("--color-foreground"),
				"muted-foreground": withOpacityValue("--color-muted-foreground"),
				"subtle-foreground": withOpacityValue("--color-subtle-foreground"),
				accent: {
					DEFAULT: withOpacityValue("--color-accent"),
					foreground: withOpacityValue("--color-accent-foreground"),
					border: withOpacityValue("--color-accent-border"),
				},
				brand: {
					500: "#00E5A8",
					600: "#00C48A",
					700: "#009C6D",
				},
			},
			boxShadow: {
				glow: "0 0 30px -10px rgba(0, 229, 168, 0.45)",
			},
		},
	},
	plugins: [],
};
