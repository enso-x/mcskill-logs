import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import { JWT } from 'next-auth/jwt';
import { ConfigProvider, Select, theme } from 'antd';
import 'antd/dist/reset.css';

import { protectedRoute } from '@/middleware/protectedRoute';
import { useDebounce } from '@/helpers';
import Page from '@/components/Page';
import { Header } from '@/components/mod-panel/Header';
import { Navigation } from '@/components/mod-panel/Navigation';
import { NotAuthorized } from '@/components/mod-panel/errors/NotAuthorized';
import { ModeratorCard } from '@/components/mod-panel/ModeratorCard';
import { ModalAddMember } from '@/components/mod-panel/modals/ModalAddMember';
import { EUserRoles, IUser } from '@/interfaces/User';
import { SERVERS } from '@/interfaces/Server';

const { darkAlgorithm } = theme;

const AppContainer = styled.div`
	display: flex;
	flex-direction: column;
	height: 100vh;
	background: #141414;
`;

const MainContainer = styled.div`
	display: flex;
	flex: 1;
	overflow: hidden;
`;

const Content = styled.div`
	flex: 1;
	overflow: hidden;
	display: flex;
	flex-direction: column;
`;

const ContentControls = styled.div`
	display: flex;
	padding: 16px;
	justify-content: space-between;
	border-bottom: 2px solid #242424;

	.ant-select-show-search:where(.css-dev-only-do-not-override-a1szv).ant-select:not(.ant-select-customize-input) .ant-select-selector {
		cursor: pointer;
	}
`;

const ContentContainer = styled.div`
	display: flex;
	gap: 16px;
	padding: 16px;
	flex-wrap: wrap;
	align-items: flex-start;
	overflow-y: auto;
`;

interface ModPanelPageProps {
	discord: JWT;
	user: IUser;
	allUsers: IUser[];
}

const ModPanelPage: NextPage<ModPanelPageProps> = ({
	discord,
	user,
	allUsers
}) => {
	const { update: updateSession } = useSession();
	const [ currentUser, setCurrentUser ] = useState<IUser>(user);
	const [ users, setUsers ] = useState<IUser[]>(allUsers);
	const [ selectedServers, setSelectedServers ] = useState<string[]>([]);
	const debouncedServers = useDebounce(selectedServers, 200);

	const handleServerSelectChange = (value: string[]) => {
		setSelectedServers(value);
	};

	useEffect(() => {
		updateUserList();
	}, [ debouncedServers ]);

	const updateUserList = async () => {
		if (currentUser) {
			let newUsers;
			if (debouncedServers.length) {
				newUsers = await fetch(`/api/users/getByServers?ids=${ debouncedServers.join(',') }`).then(res => res.json());
			} else {
				newUsers = await fetch(`/api/users/getAll`).then(res => res.json());
			}
			newUsers.forEach((newUser: IUser) => {
				if (newUser.discord_id === currentUser.discord_id) {
					setCurrentUser(newUser);
					updateSession();
				}
			});
			setUsers(newUsers);
		}
	};

	return (
		<ConfigProvider theme={ {
			algorithm: darkAlgorithm,
			token: {
				colorPrimary: '#722ed1',
			}
		} }>
			<Page>
				{
					!currentUser ? (
						<NotAuthorized/>
					) : (
						<AppContainer>
							<Header/>
							<MainContainer>
								<Navigation/>
								<Content>
									<ContentControls>
										<Select
											mode="multiple"
											allowClear
											style={ { width: '240px', cursor: 'pointer' } }
											placeholder="Сервер"
											defaultValue={ [] }
											value={ selectedServers }
											onChange={ handleServerSelectChange }
											options={ Object.values(SERVERS).map((server) => ({
												label: server.label,
												value: server.value
											})) }
										/>
										{
											currentUser.role >= EUserRoles.st ? (
												<ModalAddMember user={ currentUser } onSubmit={ updateUserList }/>
											) : null
										}
									</ContentControls>
									<ContentContainer>
										{
											users.filter(modUser => modUser.discord_id !== currentUser.discord_id)
												.sort((a, b) => {
													return a.username.localeCompare(b.username) * -1;
												}).sort((a, b) => {
												return a.role >= b.role ? -1 : 1;
											}).map(modUser => (
												<ModeratorCard key={ modUser.discord_id } user={ currentUser }
												               moderator={ modUser } onUpdate={ updateUserList }/>
											))
										}
									</ContentContainer>
								</Content>
							</MainContainer>
						</AppContainer>
					)
				}
			</Page>
		</ConfigProvider>
	);
};

export const getServerSideProps = protectedRoute<ModPanelPageProps>(async (context) => {
	const { siteFetch } = context;
	const allUsers = await siteFetch<IUser[]>('/api/users/getAll');

	return ({
		props: {
			discord: context.session?.discord ?? null,
			user: context.session?.user ?? null,
			allUsers
		}
	});
});

export default ModPanelPage;

export const config = {
	runtime: 'nodejs'
};
