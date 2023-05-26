import { Html, Head, Main, NextScript } from 'next/document';
import React from 'react';

export default function Document() {
	return (
		<Html lang="en">
			<Head>
				<link rel="preconnect" href="https://fonts.googleapis.com"/>
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>
				<link
					href="https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,200;0,400;0,700;0,900;1,200;1,400;1,700;1,900&display=swap"
					rel="stylesheet"/>
				<link rel="stylesheet" href="/styles/skin-viewer3d.css"/>
			</Head>
			<body>
			<Main/>
			<NextScript/>
			</body>
		</Html>
	);
}
