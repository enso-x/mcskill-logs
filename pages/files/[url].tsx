import React from 'react';
import Page from '@/components/Page';
import { GetServerSideProps, NextPage } from 'next';
import { parse } from 'node-html-parser';
import styled from 'styled-components';

const Container = styled.div`
	display: grid;
	grid-template-columns: 1fr 200px;
	grid-auto-rows: 1fr;
`;

type TFileLink = {
	link: string;
	date: string;
};

interface IFilesPageProps {
	url: string;
	links: TFileLink[];
	error?: string;
}

const dateFormatter = Intl.DateTimeFormat('ru-RU', {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit'
});

const FilesPage: NextPage<IFilesPageProps> = ({
	url,
	links,
	error
}) => {
	return (
		<Page>
			<Container>
				{
					error ? (
						error
					) : (
						<>
							<>
								<a href={ 'javascript:history.back()' }>../</a>
								<span></span>
							</>
							{
								links.map(link => (
									<React.Fragment key={ link.link }>
										<a href={ link.link.endsWith('.txt') ? `/logs/${ encodeURIComponent(url + link.link) }` : `/files/${ encodeURIComponent(url + link.link) }` }>{ link.link }</a>
										<span>{ dateFormatter.format(new Date(link.date)) }</span>
									</React.Fragment>
								))
							}
						</>
					)
				}
			</Container>
		</Page>
	);
};

export default FilesPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
	const filesUrl = context.params!.url as string;

	try {
		const content = await fetch(decodeURIComponent(filesUrl));
		const data = await content.text();

		const template = parse(data);
		const pre = template.querySelector('pre') as unknown as HTMLPreElement;
		if (!pre) {
			return {
				props: {
					error: '404 Not found.'
				}
			};
		}
		const linksList = pre.innerHTML.split('\r\n').slice(1, -1);
		const links: TFileLink[] = [];

		for (let line of linksList) {
			const dateReg = /\s+(?<datetime>\d{2}-\w{3}-\d{4}\s\d{2}:\d{2})/gi;
			const linkReg = /<a\s+href="(?<link>.*)">/gi;
			const link = linkReg.exec(line)?.groups!.link as string;
			const datetime = dateReg.exec(line)?.groups!.datetime as string;

			links.push({
				link,
				date: datetime
			});
		}

		return {
			props: {
				url: filesUrl,
				links
			}
		};
	} catch (e) {
		return {
			props: {
				error: '404 Not found.'
			}
		};
	}
};
