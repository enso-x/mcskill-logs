import React from 'react';
import Head from 'next/head';
import styled from 'styled-components';

const Container = styled.main`
	height: 100%;
	display: flex;
	flex-direction: column;
`;

interface IPageProps extends React.PropsWithChildren {
	title?: string;
}

export function Page({
	children,
	title = 'McSkill Fancy logs'
}: IPageProps) {
	return (
		<>
			<Head>
				<title>{ title }</title>
				<meta name="description" content="McSkill Fancy logs created by @enso-x"/>
				<meta name="viewport" content="width=device-width, initial-scale=1"/>
				<link rel="icon" href="/favicon.ico"/>
			</Head>
			<Container>
				{ children }
			</Container>
		</>
	);
}
