import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import moment from 'moment';
import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import { Button, Select, Table } from 'antd';
import { CloseCircleOutlined, EditOutlined } from '@ant-design/icons';

import { Loading, LoadingContainer } from '@/components/mod-panel/Loading';
import { ModPanelPage, ModPanelPageContent, ModPanelPageControls } from '@/components/mod-panel/ModPanelPage';
import { HorizontalLayout } from '@/components/Styled';
import { useDebounce } from '@/helpers';
import { EUserRoles, IUser } from '@/interfaces/User';
import { getUserHasAccess } from '@/helpers/users';
import { IVacation } from '@/interfaces/Vacation';
import { ModalAddVacation } from '@/components/mod-panel/modals/ModalAddVacation';

const dateFormatter = Intl.DateTimeFormat('ru-RU', {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit'
});

const ModPanelVacationsPage: NextPage = () => {
	const { data: session } = useSession();
	const [ allUsers, setAllUsers ] = useState<IUser[]>([]);
	const [ vacations, setVacations ] = useState<IVacation[]>([]);
	const [ selectedModerators, setSelectedModerators ] = useState<string[]>([]);
	const [ selectedTypes, setSelectedTypes ] = useState<string[]>([]);
	const [ selectedStatuses, setSelectedStatuses ] = useState<string[]>([]);

	const debouncedModerators = useDebounce(selectedModerators, 200);
	const debouncedTypes = useDebounce(selectedTypes, 200);
	const debouncedStatuses = useDebounce(selectedStatuses, 200);

	const user = useMemo(() => {
		return session && session.user;
	}, [ session ]);

	const columns = [
		{
			title: 'Модератор',
			dataIndex: 'username',
			key: 'username',
			render: (_: any, record: IVacation) => {
				return (
					<span>
						{ record.username }
					</span>
				);
			},
		},
		{
			title: 'Дата начала',
			dataIndex: 'from',
			key: 'from',
			render: (_: any, record: IVacation) => {
				return (
					<span>
						{ dateFormatter.format(new Date(record.from as unknown as string)) }
					</span>
				);
			},
		},
		{
			title: 'Дата окончания',
			dataIndex: 'to',
			key: 'to',
			render: (_: any, record: IVacation) => {
				return (
					<span>
						{ dateFormatter.format(new Date(record.to as unknown as string)) }
					</span>
				);
			},
		},
		{
			title: 'Статус',
			key: 'status',
			render: (_: any, record: IVacation) => {
				const now = moment();
				const fromMoment = moment(record.from);
				const toMoment = moment(record.to);
				const isVacationActive = now.isBetween(fromMoment, toMoment);
				const isVacationPlanned = now.isBefore(fromMoment) && now.isBefore(toMoment);

				return (
					<span>
						{ isVacationPlanned ? 'Запланирован' : isVacationActive ? 'Активен' : 'Завершен' }
					</span>
				);
			},
		},
		{
			title: 'Действия',
			key: 'actions',
			render: (_: any, record: IVacation) => {
				const hasAccess = getUserHasAccess(user, null);
				const now = moment();
				const fromMoment = moment(record.from);
				const toMoment = moment(record.to);
				const isVacationActive = now.isBetween(fromMoment, toMoment);
				const isVacationPlanned = now.isBefore(fromMoment) && now.isBefore(toMoment);

				const handleCancelVacation = async () => {
					const [ cancelledVacation ] = await fetch('/api/vacations/edit', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							id: record._id,
							to: now.toDate()
						})
					}).then(res => res.json());

					if (cancelledVacation) {
						await fetchVacations();
					}
				};

				return hasAccess(EUserRoles.gm) && (isVacationActive || isVacationPlanned) ? (
					<HorizontalLayout>
						<ModalAddVacation allUsers={ allUsers } vacation={ record } buttonContent={ <EditOutlined/> }
						                  onSubmit={ fetchVacations }/>
						<Button danger onClick={ handleCancelVacation }>
							<CloseCircleOutlined/>
						</Button>
					</HorizontalLayout>
				) : 'Недоступно';
			}
		}
	];

	const handleModeratorSelectChange = (value: string[]) => {
		setSelectedModerators(value);
	};

	const handleTypesSelectChange = (value: string[]) => {
		setSelectedTypes(value);
	};

	const handleStatusesSelectChange = (value: string[]) => {
		setSelectedStatuses(value);
	};

	const fetchVacations = async () => {
		const newOrders = await fetch(`/api/vacations/get`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				username: debouncedModerators.join(','),
				type: debouncedTypes.join(','),
				status: debouncedStatuses.join(',')
			})
		}).then(res => res.json());
		setVacations(newOrders);
	};

	const hasAccess = getUserHasAccess(user, null);

	useEffect(() => {
		(async () => {
			const newUsers = await fetch('/api/users/getAll').then<IUser[]>(res => res.json());
			setAllUsers(newUsers);
			await fetchVacations();
		})();
	}, []);

	useEffect(() => {
		fetchVacations();
	}, [ debouncedModerators, debouncedTypes, debouncedStatuses ]);

	return (
		<ModPanelPage needRole={ EUserRoles.trainee }>
			{
				!user || !allUsers.length ? (
					<LoadingContainer>
						<Loading/>
					</LoadingContainer>
				) : (
					<>
						<ModPanelPageControls>
							<HorizontalLayout>
								<Select
									mode="multiple"
									allowClear
									style={ { width: '240px', cursor: 'pointer' } }
									placeholder="Модератор"
									value={ selectedModerators }
									onChange={ handleModeratorSelectChange }
									options={ Object.values(allUsers).map((user) => ({
										label: user.username,
										value: user.discord_id
									})) }
								/>
							</HorizontalLayout>
							<HorizontalLayout>
								{
									hasAccess(EUserRoles.gm) ? (
										<ModalAddVacation allUsers={ allUsers } onSubmit={ fetchVacations }/>
									) : null
								}
							</HorizontalLayout>
						</ModPanelPageControls>
						<ModPanelPageContent>
							<Table bordered style={ {
								width: '100%'
							} } dataSource={ vacations.map(vacation => {
								//@ts-ignore
								vacation.key = vacation.timestamp.toString();
								return vacation;
							}) } columns={ columns }/>
						</ModPanelPageContent>
					</>
				)
			}
		</ModPanelPage>
	);
};

export default ModPanelVacationsPage;
