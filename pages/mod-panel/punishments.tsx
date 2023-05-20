import styled, { css } from 'styled-components';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { NextPage } from 'next';
import Error from 'next/error';
import { Avatar, Button, ConfigProvider, Select, theme, Typography, Table, Input, DatePicker } from 'antd';
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
import { IPunishment } from '@/models/Punishment';
import { PUNISHMENT_TYPES } from '@/interfaces/PunishmentType';

const { darkAlgorithm } = theme;
const { Title } = Typography;
const { RangePicker } = DatePicker;

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
`;

const ContentControls = styled.div`
	display: flex;
	flex-wrap: wrap;
	padding: 16px;
	gap: 16px;
	border-bottom: 2px solid #242424;

	.ant-select-show-search:where(.css-dev-only-do-not-override-a1szv).ant-select:not(.ant-select-customize-input) .ant-select-selector {
		cursor: pointer;
	}
`;

const PunishmentsContainer = styled.div`
	overflow: hidden;
`;

const PunishmentList = styled.div`
	height: calc(100vh - 64px - 114px);
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 16px;
	gap: 16px;
	align-items: flex-start;
	overflow: auto;
	word-break: break-all;
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

const HorizontalLayout = styled.div`
	display: flex;
	align-items: center;
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

interface ModPanelPunishmentsPageProps {
	discord: JWT;
	user: IUser;
	allUsers: IUser[];
	allPunishments: IPunishment[];
}

const ModPanelPunishmentsPage: NextPage<ModPanelPunishmentsPageProps> = ({
	discord,
	user,
	allUsers,
	allPunishments
}) => {
	const [ currentUser, setCurrentUser ] = useState<IUser>(user);
	const [ punishments, setPunishments ] = useState<IPunishment[]>(allPunishments);


	const [ playerName, setPlayerName ] = useState<string>('');
	const [ reason, setReason ] = useState<string>('');
	const [ selectedServers, setSelectedServers ] = useState<string[]>([]);
	const [ selectedModerators, setSelectedModerators ] = useState<string[]>([]);
	const [ selectedTypes, setSelectedTypes ] = useState<string[]>([]);
	const [ dateRange, setDateRange ] = useState<string[]>([]);


	const debouncedPlayerName = useDebounce(playerName, 200);
	const debouncedReason = useDebounce(reason, 200);
	const debouncedServers = useDebounce(selectedServers, 200);
	const debouncedModerators = useDebounce(selectedModerators, 200);
	const debouncedTypes = useDebounce(selectedTypes, 200);
	const debouncedRange = useDebounce(dateRange, 200);

	const columns = [
		{
			title: 'Сервер',
			dataIndex: 'server',
			key: 'server',
		},
		{
			title: 'Модератор',
			dataIndex: 'author',
			key: 'author',
			render: (_: any, record: IPunishment) => {
				const author = allUsers.find(au => au.discord_id === record.author.toString());
				return (
					<span>
						{ author ? author.username : record.author.toString() }
					</span>
				);
			},
		},
		{
			title: 'Игрок',
			dataIndex: 'player',
			key: 'player',
		},
		{
			title: 'Тип наказания',
			dataIndex: 'type',
			key: 'type',
		},
		{
			title: 'Причина',
			dataIndex: 'reason',
			key: 'reason',
		},
		{
			title: 'Дата и время',
			dataIndex: 'timestamp',
			key: 'timestamp',
			render: (_: any, record: IPunishment) => (
				<span>
					{ dateFormatter.format(new Date(record.timestamp as unknown as string)) }
				</span>
			),
		},
	];

	const onLogoutClick = async () => {
		await signOut();
	};

	const handleLogin = async () => {
		await signIn('discord');
	};

	const handlePlayerName = (e: ChangeEvent<HTMLInputElement>) => {
		setPlayerName(e.target.value);
	};

	const handleReason = (e: ChangeEvent<HTMLInputElement>) => {
		setReason(e.target.value);
	};

	const handleServerSelectChange = (value: string[]) => {
		setSelectedServers(value);
	};

	const handleModeratorSelectChange = (value: string[]) => {
		setSelectedModerators(value);
	};

	const handleTypesSelectChange = (value: string[]) => {
		setSelectedTypes(value);
	};

	const handleRangeChange = (_: any, dates: string[]) => {
		setDateRange(dates);
	};

	const fetchPunishments = async () => {
		const newPunishments = await fetch(`/api/punishments/get`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				server: debouncedServers.join(','),
				author: debouncedModerators.join(','),
				type: debouncedTypes.join(','),
				reason: debouncedReason,
				player: debouncedPlayerName,
				range: debouncedRange
			})
		}).then(res => res.json());
		setPunishments(newPunishments);
	};

	useEffect(() => {
		fetchPunishments();
	}, [ debouncedPlayerName, debouncedServers, debouncedModerators, debouncedTypes, debouncedReason, debouncedRange ]);

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
								<HorizontalLayout>
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
								</HorizontalLayout>
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
									<SidebarItem href="/mod-panel">
										Мод состав
									</SidebarItem>
									<SidebarItem $active>
										Наказания
									</SidebarItem>
								</Sidebar>
								<ContentContainer>
									<ContentControls>
										<HorizontalLayout>
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
													value: server.label
												})) }
											/>
											<Select
												mode="multiple"
												allowClear
												style={ { width: '240px', cursor: 'pointer' } }
												placeholder="Модератор"
												defaultValue={ [] }
												value={ selectedModerators }
												onChange={ handleModeratorSelectChange }
												options={ Object.values(allUsers).map((user) => ({
													label: user.username,
													value: user.discord_id
												})) }
											/>
											<Select
												mode="multiple"
												allowClear
												style={ { width: '240px', cursor: 'pointer' } }
												placeholder="Тип нарушения"
												defaultValue={ [] }
												value={ selectedTypes }
												onChange={ handleTypesSelectChange }
												options={ Object.values(PUNISHMENT_TYPES).map((type) => ({
													label: type.description,
													value: type.label
												})) }
											/>
										</HorizontalLayout>
										<HorizontalLayout>
											<Input style={ {
												width: '240px'
											} } placeholder="Ник игрока" value={ playerName }
											       onChange={ handlePlayerName }/>
											<Input style={ {
												width: '240px'
											} } placeholder="Причина" value={ reason }
											       onChange={ handleReason }/>
											<RangePicker onChange={ handleRangeChange }
											             format="YYYY-MM-DD"/>
										</HorizontalLayout>
									</ContentControls>
									<PunishmentsContainer>
										<PunishmentList>
											<Table style={ {
												width: '100%'
											} } dataSource={ punishments.map(punish => {
												//@ts-ignore
												punish.key = punish.timestamp.toString()
												return punish;
											}) } columns={ columns }/>
										</PunishmentList>
									</PunishmentsContainer>
								</ContentContainer>
							</MainContainer>
						</AppContainer>
					)
				}
			</Page>
		</ConfigProvider>
	);
};

export const getServerSideProps = protectedRoute<ModPanelPunishmentsPageProps>(async (context) => {
	const { siteFetch } = context;
	const allUsers = await siteFetch<IUser[]>('/api/users/getAll');
	const allPunishments = await siteFetch<IPunishment[]>('/api/punishments/get', { method: 'POST' });

	return ({
		props: {
			discord: context.session?.discord ?? null,
			user: context.session?.user ?? null,
			allUsers,
			allPunishments
		}
	});
});

export default ModPanelPunishmentsPage;

export const config = {
	runtime: 'nodejs'
};
