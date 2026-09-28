import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import {
	VApp,
	VAppBar,
	VBtn,
	VCard,
	VCardText,
	VContainer,
	VIcon,
	VMain,
	VSpacer,
	VToolbar,
} from 'vuetify/components'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/inter/latin-ext-400.css'
import '@fontsource/inter/latin-ext-500.css'
import '@fontsource/inter/latin-ext-600.css'
import '@fontsource/inter/latin-ext-700.css'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import App from './App.vue'
import './style.css'

const vuetify = createVuetify({
	components: {
		VApp,
		VAppBar,
		VBtn,
		VCard,
		VCardText,
		VContainer,
		VIcon,
		VMain,
		VSpacer,
		VToolbar,
	},
	theme: {
		defaultTheme: 'briefDark',
		themes: {
			briefDark: {
				dark: true,
				colors: {
					background: '#151b18',
					surface: '#202824',
					primary: '#91cbb8',
					secondary: '#efbd78',
					error: '#df8977',
					'on-background': '#f1f3ee',
					'on-surface': '#f1f3ee',
				},
			},
			briefLight: {
				dark: false,
				colors: {
					background: '#f2f5f1',
					surface: '#ffffff',
					primary: '#286b58',
					secondary: '#955817',
					error: '#a54536',
					'on-background': '#202a25',
					'on-surface': '#202a25',
				},
			},
		},
	},
})

createApp(App).use(vuetify).mount('#app')
