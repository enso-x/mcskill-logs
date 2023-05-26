import '../public/styles/globals.css';
import '../public/styles/datepicker.minimal.css';
import 'antd/dist/reset.css';
import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { ConfigProvider, theme } from 'antd';

const { darkAlgorithm } = theme;

export default function App({ Component, pageProps }: AppProps) {
	useEffect(() => {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker
				.register('./sw/service-worker.js')
				.then((reg) => {
					console.log('ServiceWorker registered.');
				})
				.catch(console.error);
		}
	}, []);

	return (
		<SessionProvider session={ pageProps.session }>
			<ConfigProvider theme={ {
				algorithm: darkAlgorithm,
				token: {
					colorPrimary: '#722ed1',
				}
			} }>
				<Component { ...pageProps } />
			</ConfigProvider>
		</SessionProvider>
	);
}
