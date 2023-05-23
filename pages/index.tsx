import Page from '@/components/Page';
import Link from 'next/link';
import styled from 'styled-components';
import { parse } from 'node-html-parser';

import { NextPage, GetServerSideProps } from 'next';

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
	width: 320px;
	border-radius: 4px;
	border: 1px solid #0f0f0f;
	margin: 0;
	box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255, 255, 255, 0.2);
	overflow: hidden;
`;

const FileItem = styled.li`
	a {
		display: flex;
		justify-content: center;
		padding: 4px 8px;
		background: linear-gradient(to bottom, #444, #222);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
		color: #fff;
		
		&:hover {
			filter: brightness(1.2);
		}
		
		&:active {
			background: linear-gradient(to bottom, #222, #111);
			box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
		}
	}
	
	&:not(:last-child) {
		box-sizing: border-box;
		border-bottom: 1px solid #0f0f0f;
	}
`;

type TServerInfo = {
	url: string;
	name: string;
}

interface IHomeProps {
	fileList: TServerInfo[];
}

const Home: NextPage<IHomeProps> = ({
	fileList
}) => {
	return (
		<Page>
			<Container>
				<FileListWrapper>
					<FileList>
						{ fileList.map(link => (
							<FileItem key={ link.url }>
								<Link href={ `/files/${ encodeURIComponent(link.url + '/') }` }>{ link.name }</Link>
							</FileItem>
						)) }
					</FileList>
				</FileListWrapper>
			</Container>
		</Page>
	);
};

export default Home;

export const getServerSideProps: GetServerSideProps = async (context) => {
	const content = await fetch('https://mcskill.net/mpsl/');
	const data = await content.text();
	const template = parse(data);
	const linkElements = template.querySelectorAll('#LogsBlock ul li a') as unknown as HTMLLinkElement[];
	const links: TServerInfo[] = [];
	for (let link of linkElements) {
		links.push({
			//@ts-ignore
			url: link.attributes.href,
			name: link.innerText
		});
	}
	return {
		props: {
			fileList: links
		}
	};
};

export const config = {
	runtime: 'nodejs'
};
