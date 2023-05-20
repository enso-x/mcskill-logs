import styled, { css } from 'styled-components';
import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Error from 'next/error';
import { Avatar, Button, ConfigProvider, Select, theme, Typography } from 'antd';
import { signIn, signOut } from 'next-auth/react';
import { JWT } from 'next-auth/jwt';
import 'antd/dist/reset.css';
import { protectedRoute } from '@/middleware/protectedRoute';
import Page from '@/components/Page';
import { ITestResult } from '@/models/TestResult';
import { EUserRoles, IUser, ROLES } from '@/interfaces/User';
import { SERVERS } from '@/interfaces/Server';
import { asyncDebounce, useDebounce } from '@/helpers';
import { ModalAddMember } from '@/components/modals/ModalAddMember';
import { EditOutlined, LogoutOutlined } from '@ant-design/icons';

const { darkAlgorithm } = theme;
const { Title } = Typography;

interface ITestResultsTableData extends ITestResult {
	timestamp: Date;
}

const Container = styled.div`
	height: 100vh;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
`;

const AppContainer = styled.div`
	display: flex;
	flex-direction: column;
	height: 100vh;
	background: #141414;
`;

const Header = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	align-items: center;
	height: 64px;
	border-bottom: 2px solid #242424;
	padding: 8px 16px;
`;

const HeaderUserInfo = styled.div`
	display: flex;
	align-items: center;
	gap: 16px;
`;

const HeaderTitle = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 16px;

	span {
		font-size: 24px;
		font-family: monospace;
		white-space: nowrap;
	}
`;

const HeaderLogo = styled.img`
	max-height: 48px;
`;

const HeaderControls = styled.div`
	display: flex;
	justify-content: flex-end;
	align-items: center;
	gap: 16px;
`;

const MainContainer = styled.div`
	display: flex;
	flex: 1;
`;

const Sidebar = styled.div`
	display: flex;
	flex-direction: column;
	width: 240px;
	flex-shrink: 0;
	border-right: 2px solid #242424;
`;

const PointsContainer = styled.span`
	display: flex;
	align-items: center;
	gap: 8px;
`;

interface ISidebarItemProps {
	$active?: boolean;
}

const SidebarItem = styled.a<ISidebarItemProps>`
	padding: 16px 32px;
	color: #fff;

	${ (props) => props.$active ? css`background: var(--accent-color);` : '' }
	&:not(:last-child) {
		border-bottom: 1px solid #242424;
	}
`;

const ContentContainer = styled.div`
	flex: 1;
	overflow: hidden;
	height: calc(100vh - 64px);
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

const ModeratorList = styled.div`
	display: flex;
	gap: 16px;
	height: 100%;
	padding: 16px;
	gap: 16px;
	flex-wrap: wrap;
	align-items: flex-start;
	overflow-y: auto;
`;

const ModeratorCard = styled.div`
	display: flex;
	flex-direction: column;
	min-width: 240px;
	gap: 14px;
	align-items: center;
	padding: 16px;
	border: 1px solid #242424;
	border-radius: 8px;

	img {
		max-height: 128px;
	}

	button {
		position: absolute;
		opacity: 0;
		align-self: flex-end;
	}

	&:hover {
		button {
			opacity: 1;
		}
	}
`;

const dateFormatter = Intl.DateTimeFormat('ru-RU', {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit'
});

const VerticalLayout = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
`;

const ErrorContainer = styled(VerticalLayout)`
	width: 100%;
	height: 100%;
	justify-content: center;
	align-items: center;

	> div {
		height: 100px !important;
	}
`;

const InfinityIcon = () => {
	return (
		<svg fill="#fff" height="24px" width="24px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg"
		     viewBox="0 0 512 512" stroke="#fff">
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				<g>
					<g>
						<path
							d="M373.333,117.333c-76.578,0-138.667,62.081-138.667,138.667c0,53.015-42.979,96-96,96c-53.007,0-96-42.993-96-96 c0-53.021,42.985-96,96-96c13.445,0,26.452,2.74,38.454,7.985c10.796,4.718,23.373-0.209,28.091-11.005 c4.718-10.796-0.209-23.373-11.005-28.091c-17.369-7.591-36.192-11.556-55.541-11.556C62.088,117.333,0,179.414,0,256 c0,76.571,62.095,138.667,138.667,138.667c76.586,0,138.667-62.089,138.667-138.667c0-53.021,42.985-96,96-96 c53.029,0,96,42.971,96,96c0,53.015-42.979,96-96,96c-13.416,0-26.421-2.749-38.422-8.002 c-10.794-4.724-23.373,0.196-28.097,10.99c-4.724,10.794,0.196,23.373,10.99,28.097c17.369,7.602,36.195,11.582,55.53,11.582 C449.919,394.667,512,332.578,512,256C512,179.407,449.926,117.333,373.333,117.333z"></path>
					</g>
				</g>
			</g>
		</svg>
	);
};

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
	const [ currentUser, setCurrentUser ] = useState<IUser>(user);
	const [ users, setUsers ] = useState<IUser[]>(allUsers);
	const [ selectedServers, setSelectedServers ] = useState<string[]>([]);
	const debouncedServers = useDebounce(selectedServers, 200);

	const onLogoutClick = async () => {
		await signOut();
	};

	const handleLogin = async () => {
		await signIn('discord');
	};

	const handleServerSelectChange = (value: string[]) => {
		setSelectedServers(value);
	};

	useEffect(() => {
		updateUserList();
	}, [ debouncedServers ]);

	const updateUserList = async () => {
		let newUsers;
		if (debouncedServers.length) {
			newUsers = await fetch(`/api/users/getByServers?ids=${ debouncedServers.join(',') }`).then(res => res.json());
		} else {
			newUsers = await fetch(`/api/users/getAll`).then(res => res.json());
		}
		newUsers.forEach((newUser: IUser) => {
			if (newUser.discord_id === currentUser.discord_id) {
				setCurrentUser(newUser);
			}
		});
		setUsers(newUsers);
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
						<ErrorContainer>
							<Error className="error" title="Not authorized" statusCode={ 401 }/>
							<Button onClick={ handleLogin }>Login</Button>
						</ErrorContainer>
					) : (
						<AppContainer>
							<Header>
								<HeaderUserInfo>
									<Avatar
										src={ `https://mcskill.net/MineCraft/?name=${ currentUser.username }&mode=5` }
										alt={ currentUser.username } size={ 32 }/>
									<span>{ currentUser.username }</span>
									<span>[<span
										className={ EUserRoles[currentUser.role] }>{ ROLES[currentUser.role] }</span>]</span>
									<PointsContainer>
										Баллы: { currentUser.points >= 0 ? currentUser.points : (
											<InfinityIcon/>
										) }
									</PointsContainer>
								</HeaderUserInfo>
								<HeaderTitle>
									<HeaderLogo src="/images/logo.png"/>
									<span>Pixelmon Mod panel</span>
								</HeaderTitle>
								<HeaderControls>

									<Button danger onClick={ onLogoutClick }>Выйти <LogoutOutlined/></Button>
								</HeaderControls>
							</Header>
							<MainContainer>
								<Sidebar>
									<SidebarItem $active>
										Мод состав
									</SidebarItem>
									<SidebarItem href="/mod-panel/punishments">
										Наказания
									</SidebarItem>
								</Sidebar>
								<ContentContainer>
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
									<ModeratorList>
										{
											users.filter(modUser => modUser.discord_id !== currentUser.discord_id).map(modUser => (
												<ModeratorCard key={ modUser.discord_id }>
													{
														currentUser.role >= EUserRoles.st && currentUser.role > modUser.role ? (
															<ModalAddMember user={ currentUser } edit={ modUser }
															                buttonContent={ <EditOutlined/> }
															                onSubmit={ updateUserList }/>
														) : null
													}
													<img
														src={ `https://mcskill.net/MineCraft/?name=${ modUser.username }&mode=1` }
														alt="User skin"/>
													<span
														className={ EUserRoles[modUser.role] }>{ ROLES[modUser.role] }</span>
													<span>{ modUser.username }</span>
													<PointsContainer>
														Баллы: { modUser.points >= 0 ? modUser.points : (
															<InfinityIcon/>
														) }
													</PointsContainer>
												</ModeratorCard>
											))
										}
									</ModeratorList>
								</ContentContainer>
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
