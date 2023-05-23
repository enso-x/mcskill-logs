import React, { ChangeEvent, useEffect, useState } from 'react';
import styled from 'styled-components';
import { NextPage } from 'next';
import { JWT } from 'next-auth/jwt';
import { ConfigProvider, Select, theme, Table, Input, DatePicker } from 'antd';
import 'antd/dist/reset.css';

import { protectedRoute } from '@/middleware/protectedRoute';
import { useDebounce } from '@/helpers';
import Page from '@/components/Page';
import { Header } from '@/components/mod-panel/Header';
import { NotAuthorized } from '@/components/mod-panel/errors/NotAuthorized';
import { Navigation } from '@/components/mod-panel/Navigation';
import { HorizontalLayout } from '@/components/Styled';
import { PUNISHMENT_TYPES } from '@/interfaces/PunishmentType';
import { SERVERS } from '@/interfaces/Server';
import { EUserRoles, IUser } from '@/interfaces/User';
import { IPunishment } from '@/models/Punishment';
import { Forbidden } from '@/components/mod-panel/errors/Forbidden';

const { darkAlgorithm } = theme;
const { RangePicker } = DatePicker;

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
	display: flex;
	flex-direction: column;
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

const ContentContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 16px;
	align-items: flex-start;
	overflow: auto;
	word-break: break-all;

	.ant-table-wrapper .ant-table-container {
		border-radius: 8px;
	}
	.ant-table-wrapper .ant-table-container table tr:not(thead > tr):last-child >*:last-child {
		border-end-end-radius: 8px;
	}
	.ant-table-wrapper .ant-table-container table tr:not(thead > tr):last-child >*:first-child {
		border-end-start-radius: 8px;
	}
`;

const dateFormatter = Intl.DateTimeFormat('ru-RU', {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit'
});

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
					!user ? (
						<NotAuthorized/>
					) : user.role < EUserRoles.helper ? (
						<Forbidden/>
					) : (
						<AppContainer>
							<Header/>
							<MainContainer>
								<Navigation/>
								<Content>
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
									<ContentContainer>
										<Table bordered style={ {
											width: '100%'
										} } dataSource={ punishments.map(punish => {
											//@ts-ignore
											punish.key = punish.timestamp.toString();
											return punish;
										}) } columns={ columns }/>
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
