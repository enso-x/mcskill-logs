import '../styles/globals.css';
import '../styles/datepicker.minimal.css';
import 'antd/dist/reset.css';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { ConfigProvider, theme } from 'antd';

const { darkAlgorithm } = theme;

export default function App({ Component, pageProps }: AppProps) {
	return (
		<ConfigProvider theme={ {
			algorithm: darkAlgorithm,
			token: {
				colorPrimary: '#722ed1',
			}
		} }>
			<SessionProvider session={ pageProps.session }>
				<Component { ...pageProps } />
			</SessionProvider>
		</ConfigProvider>
	);
}
