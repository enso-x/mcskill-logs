import '../public/styles/globals.css';
import '../public/styles/datepicker.minimal.css';
import 'antd/dist/reset.css';
import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { ConfigProvider, theme } from 'antd';
import 'dayjs/locale/ru';
import ru_RU from 'antd/lib/locale/ru_RU';

const { darkAlgorithm } = theme;

export default function App({ Component, pageProps }: AppProps) {
	useEffect(() => {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker
				.register('/sw/service-worker.js')
				.then((reg) => {
					console.log('ServiceWorker registered.');
				})
				.catch(console.error);
		}
	}, []);

	return (
		<SessionProvider session={ pageProps.session }>
			<ConfigProvider locale={ ru_RU } theme={ {
				algorithm: darkAlgorithm,
				token: {
					colorPrimary: '#722ed2',
				}
			} }>
				<Component { ...pageProps } />
			</ConfigProvider>
		</SessionProvider>
	);
}
