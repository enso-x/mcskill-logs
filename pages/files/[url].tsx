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
	max-height: 100%;
`;

const FileListWrapperOverflow = styled.div`
	display: flex;
	flex-direction: column;
	background: linear-gradient(to bottom, #222, #111);
	border-radius: 4px;
	border: 1px solid #0f0f0f;
	box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255, 255, 255, 0.2);
	overflow: hidden;
	overflow-y: auto;

	&::-webkit-scrollbar {
		padding: 10px 0;
		width: 12px;
		height: 12px;
	}

	&::-webkit-scrollbar:vertical {
		border-left: 1px #111 solid;
		background: linear-gradient(to right, #424242, #242424);
		box-shadow: inset 1px 0 0 rgba(255,255,255,.1);
	}

	&::-webkit-scrollbar:horizontal {
		border-top: 1px #111 solid;
		background: linear-gradient(to bottom, #424242, #242424);
		box-shadow: inset 0 1px 0 rgba(255,255,255,.1);
	}

	&::-webkit-scrollbar-track {
		background: #242424;
		box-shadow: inset -1px 0 1px rgba(0,0,0,.5);
		border-radius: 99em;
		border: 1px #111 solid;
	}

	&::-webkit-scrollbar-button:vertical {
		background: linear-gradient(to right, #424242, #242424);
		box-shadow: inset 1px 0 0 rgba(255,255,255,.1);
		border-left: 1px #111 solid;
		height: 6px;
	}

	&::-webkit-scrollbar-button:horizontal {
		background: linear-gradient(to bottom, #424242, #242424);
		box-shadow: inset 0 1px 0 rgba(255,255,255,.1);
		border-top: 1px #111 solid;
		height: 6px;
	}

	&::-webkit-scrollbar-thumb {
		background: linear-gradient(to right, #424242, #363636);
		border-radius: 99em;
		border: 1px #111 solid;
		box-shadow: inset 1px 1px 0 rgba(255,255,255,.1), 0 1px 1px rgba(0,0,0,.5);
	}

	&::-webkit-scrollbar-thumb:vertical {
		background: linear-gradient(to right, #424242, #363636);
	}

	&::-webkit-scrollbar-thumb:horizontal {
		background: linear-gradient(to bottom, #424242, #363636);
	}

	&::-webkit-scrollbar-corner {
		border: 1px #111 solid;
		border-bottom: none;
		border-right: none;
		background: linear-gradient(90deg, #424242, #242424);
		box-shadow: inset 1px 1px 0 rgba(255,255,255,.1);
	}
`;

const FileList = styled.ul`
	list-style-type: none;
	display: flex;
	flex-direction: column;
	font: 14px monospace;
	//width: 320px;
`;

const FileItem = styled.li`
	a {
		display: grid;
		grid-template-columns: 1fr 140px;
		grid-auto-rows: 1fr;
		padding: 4px 8px;
		gap: 24px;

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
		
		span:last-child {
			text-align: right;
		}
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
							<FileListWrapperOverflow>
								<FileList>
									<FileItem>
										<a onClick={() => {
											history.back();
										}}>
											<span>../</span>
											<span></span>
										</a>
									</FileItem>
									{
										links.map(link => (
											<FileItem key={ link.link }>
												<a href={ link.link.endsWith('.txt') ? `/logs/${ encodeURIComponent(url + link.link) }` : `/files/${ encodeURIComponent(url + link.link) }` }>
													<span>{ link.link }</span>
													<span>{ dateFormatter.format(new Date(link.date)) }</span>
												</a>
											</FileItem>
										))
									}
								</FileList>
							</FileListWrapperOverflow>
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
