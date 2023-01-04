import React from 'react';
import Page from '@/components/Page';
import { GetServerSideProps, NextPage } from 'next';
import { parse } from 'node-html-parser';
import styled from 'styled-components';

const Container = styled.div`
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
`;

const FileListWrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	font: 14px monospace;
	padding: 8px;
	background: linear-gradient(to bottom, #444, #222);
	border-radius: 8px;
	border: 1px solid #0f0f0f;
	box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
`;

const FileList = styled.ul`
	list-style-type: none;
	display: flex;
	flex-direction: column;
	font: 14px monospace;
	background: linear-gradient(to bottom, #222, #111);
	//width: 320px;
	border-radius: 4px;
	border: 1px solid #0f0f0f;
	box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255, 255, 255, 0.2);
	overflow: hidden;
`;

const FileItem = styled.li`
	display: grid;
	grid-template-columns: 1fr 200px;
	grid-auto-rows: 1fr;

	background: linear-gradient(to bottom, #444, #222);
	box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
	color: #fff;
	cursor: pointer;

	&:hover {
		filter: brightness(1.2);
	}

	&:active {
		background: linear-gradient(to bottom, #222, #111);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
	}
	
	a, span {
		display: flex;
		padding: 4px 8px;
		color: #fff;
	}
	
	&:not(:last-child) {
		box-sizing: border-box;
		border-bottom: 1px solid #0f0f0f;
	}
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
						<FileListWrapper>
							<FileList>
								{
									links.map(link => (
										<FileItem key={ link.link }>
											<a href={ link.link.endsWith('.txt') ? `/logs/${ encodeURIComponent(url + link.link) }` : `/files/${ encodeURIComponent(url + link.link) }` }>{ link.link }</a>
											<span>{ dateFormatter.format(new Date(link.date)) }</span>
										</FileItem>
									))
								}
							</FileList>
						</FileListWrapper>
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

export const config = {
	runtime: 'nodejs'
};
