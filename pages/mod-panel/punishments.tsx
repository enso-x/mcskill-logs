import React, { ChangeEvent, useEffect, useState } from 'react';
import styled from 'styled-components';
import { NextPage } from 'next';
import { Select, Table, Input, DatePicker } from 'antd';

import { Loading, LoadingContainer } from '@/components/mod-panel/Loading';
import { ModPanelPage, ModPanelPageControls, ModPanelPageContent } from '@/components/mod-panel/ModPanelPage';
import { HorizontalLayout } from '@/components/Styled';
import { useDebounce } from '@/helpers';
import { PUNISHMENT_TYPES } from '@/interfaces/PunishmentType';
import { SERVERS } from '@/interfaces/Server';
import { EUserRoles, IUser } from '@/interfaces/User';
import { IPunishment } from '@/models/Punishment';

const { RangePicker } = DatePicker;

const dateFormatter = Intl.DateTimeFormat('ru-RU', {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit'
});

const ModPageControlsStyled = styled(ModPanelPageControls)`
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;
`;

const ModPanelPunishmentsPage: NextPage = () => {
	const [ allUsers, setAllUsers ] = useState<IUser[]>([]);
	const [ punishments, setPunishments ] = useState<IPunishment[]>([]);
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
			render: (_: any, record: IPunishment) => {
				return (
					<span>
						{ SERVERS[record.server].label }
					</span>
				);
			},
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
		(async () => {
			const newUsers = await fetch('/api/users/getAll').then<IUser[]>(res => res.json());
			setAllUsers(newUsers);
			await fetchPunishments();
		})();
	}, []);

	useEffect(() => {
		fetchPunishments();
	}, [ debouncedPlayerName, debouncedServers, debouncedModerators, debouncedTypes, debouncedReason, debouncedRange ]);

	return (
		<ModPanelPage needRole={ EUserRoles.helper }>
			{
				!allUsers.length ? (
					<LoadingContainer>
						<Loading/>
					</LoadingContainer>
				) : (
					<>
						<ModPageControlsStyled>
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
										value: server.value
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
						</ModPageControlsStyled>
						<ModPanelPageContent>
							<Table bordered style={ {
								width: '100%'
							} } dataSource={ punishments.map(punish => {
								//@ts-ignore
								punish.key = punish.timestamp.toString();
								return punish;
							}) } columns={ columns }/>
						</ModPanelPageContent>
					</>
				)
			}
		</ModPanelPage>
	);
};

export default ModPanelPunishmentsPage;
