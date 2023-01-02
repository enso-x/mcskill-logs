import Page from '@/components/Page';
import Link from 'next/link';
import styled from 'styled-components';
import { parse } from 'node-html-parser';

import { NextPage, GetServerSideProps } from 'next';

const Container = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
`;

const FileList = styled.ul`
	list-style-type: none;
	display: flex;
	flex-direction: column;
	align-items: center;
	font: 14px monospace;
	padding: 16px;
`;

const FileItem = styled.li`
	&:not(:last-child) {
		box-sizing: border-box;
		padding-bottom: 8px;
		margin-bottom: 8px;
		border-bottom: 1px solid transparent;
		background: linear-gradient(to bottom, #000, #000), linear-gradient(to right, transparent, #fff, transparent);
		background-origin: border-box;
		background-clip: padding-box, border-box;
	}
`;

interface IHomeProps {
	fileList: string[];
}

const Home: NextPage<IHomeProps> = ({
	fileList
}) => {
	return (
		<Page>
			<Container>
				<FileList>
					{ fileList.map(link => (
						<FileItem key={ link }>
							<Link href={ `/files/${ encodeURIComponent(link + '/') }` }>{ link }</Link>
						</FileItem>
					)) }
				</FileList>
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
	const links: string[] = [];
	for (let link of linkElements) {
		//@ts-ignore
		links.push(link.attributes.href);
	}
	return {
		props: {
			fileList: links
		}
	};
};
