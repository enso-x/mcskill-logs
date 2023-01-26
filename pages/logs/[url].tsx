import React from 'react';
import Page from '@/components/Page';
import { GetServerSideProps, NextPage } from 'next';
import Error from 'next/error';
import Script from 'next/script';
import styled from 'styled-components';

interface ILogsPageProps {
	url: string;
	error?: string;
}

const Container = styled.div`
	display: flex;
	flex-direction: column;
`;

const LogsPage: NextPage<ILogsPageProps> = ({
	url,
	error
}) => {
	return (
		<Page>
			<Container>
				{
					error ? (
						<Error statusCode={ 404 }/>
					) : (
						<>
							<div id="app-root"></div>
							<script type="text/javascript" dangerouslySetInnerHTML={{__html: `window.updateUrl = '${ url }';`}}/>
							<Script src="/datepicker.js" defer/>
							<Script src="/logs.js" defer/>
						</>
					)
				}
			</Container>
		</Page>
	);
};

export default LogsPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
	if (!context.params) {
		return {
			props: {
				error: '404 Not found.'
			}
		};
	}

	const filesUrl = decodeURIComponent(context.params.url as string);

	try {
		return {
			props: {
				url: filesUrl,
				messages: []
			}
		};
	} catch (e) {
		console.error(e);
		return {
			props: {
				error: '404 Not found.'
			}
		};
	}
};

export const config = {
	runtime: 'nodejs'
};
