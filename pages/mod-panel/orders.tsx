import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import { Button, Select, Table } from 'antd';
import { CheckOutlined, CloseCircleOutlined, } from '@ant-design/icons';

import { HorizontalLayout } from '@/components/Styled';
import { Loading, LoadingContainer } from '@/components/mod-panel/Loading';
import { ModPanelPage, ModPanelPageContent, ModPanelPageControls } from '@/components/mod-panel/ModPanelPage';
import { Price } from '@/components/mod-panel/Price';
import { useDebounce } from '@/helpers';
import { getUserHasAccessForServer } from '@/helpers/users';
import { SERVERS } from '@/interfaces/Server';
import { EUserRoles, IUser } from '@/interfaces/User';
import { EOrderStatus, IOrder, ORDER_STATUSES, ORDER_TYPES } from '@/interfaces/Order';

const ModPageControlsStyled = styled(ModPanelPageControls)`
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;
`;

const OrderImageContaner = styled.div`
	display: flex;
	justify-content: center;
`;

const OrderImage = styled.img`
	width: 64px;
	height: 64px;
`;

const ModPanelOrdersPage: NextPage = () => {
	const { data: session } = useSession();
	const [ allUsers, setAllUsers ] = useState<IUser[]>([]);
	const [ orders, setOrders ] = useState<IOrder[]>([]);
	const [ selectedServers, setSelectedServers ] = useState<string[]>([]);
	const [ selectedModerators, setSelectedModerators ] = useState<string[]>([]);
	const [ selectedTypes, setSelectedTypes ] = useState<string[]>([]);
	const [ selectedStatuses, setSelectedStatuses ] = useState<string[]>([]);

	const debouncedServers = useDebounce(selectedServers, 200);
	const debouncedModerators = useDebounce(selectedModerators, 200);
	const debouncedTypes = useDebounce(selectedTypes, 200);
	const debouncedStatuses = useDebounce(selectedStatuses, 200);

	const user = useMemo(() => {
		return session && session.user;
	}, [ session ]);

	const columns = [
		{
			title: '*',
			dataIndex: 'image',
			key: 'image',
			render: (_: any, record: IOrder) => {
				return (
					<OrderImageContaner>
						<OrderImage src={ record.image }/>
					</OrderImageContaner>
				);
			},
		},
		{
			title: 'Сервер',
			dataIndex: 'server',
			key: 'server',
			render: (_: any, record: IOrder) => {
				return (
					<span>
						{ SERVERS[record.server].label }
					</span>
				);
			},
		},
		{
			title: 'Модератор',
			dataIndex: 'username',
			key: 'username',
			render: (_: any, record: IOrder) => {
				return (
					<span>
						{ record.username }
					</span>
				);
			},
		},
		{
			title: 'Тип',
			dataIndex: 'type',
			key: 'type',
			render: (_: any, record: IOrder) => {
				return (
					<span>
						{ ORDER_TYPES[record.type] }
					</span>
				);
			},
		},
		{
			title: 'Название',
			dataIndex: 'item',
			key: 'item',
			render: (_: any, record: IOrder) => {
				return (
					<span dangerouslySetInnerHTML={ { __html: record.item } }/>
				);
			},
		},
		{
			title: 'Кол-во',
			dataIndex: 'count',
			key: 'count',
		},
		{
			title: 'Цена',
			dataIndex: 'price',
			key: 'price',
			render: (_: any, record: IOrder) => {
				return (
					<Price value={ record.price }/>
				);
			}
		},
		{
			title: 'Статус',
			dataIndex: 'status',
			key: 'status',
			render: (_: any, record: IOrder) => {
				return (
					<span>
						{ ORDER_STATUSES[record.status] }
					</span>
				);
			},
		},
		{
			title: 'Действия',
			key: 'actions',
			render: (_: any, record: IOrder) => {
				const hasAccessForServer = getUserHasAccessForServer(user, null, record.server);

				const handleConfirmOrder = async () => {
					const [ editedOrder ] = await fetch('/api/orders/edit', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							id: record._id,
							status: EOrderStatus.resolved
						})
					}).then(res => res.json());

					if (editedOrder) {
						await fetchOrders();
					}
				};

				const handleCancelOrder = async () => {
					const [ cancelledOrder ] = await fetch('/api/orders/edit', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							id: record._id,
							status: EOrderStatus.cancelled
						})
					}).then(res => res.json());

					const orderUser = allUsers.find(user => user.username === record.username);

					if (cancelledOrder && orderUser) {
						const [ freshUser ] = await fetch(`/api/users/getByDiscordID?id=${ orderUser.discord_id }`).then<IUser[]>(res => res.json());

						if (freshUser) {
							const [ newUser ] = await fetch('/api/users/edit', {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json'
								},
								body: JSON.stringify({
									id: freshUser._id,
									roles: freshUser.roles.map(role => {
										if (role.server === record.server) {
											role.points += record.price;
										}
										return role;
									})
								})
							}).then(res => res.json());

							if (newUser && newUser.roles.length) {
								await fetchOrders();
							}
						}
					}
				};

				return record.status === EOrderStatus.created ? (
					<HorizontalLayout>
						{
							hasAccessForServer(EUserRoles.st) ? (
								< Button onClick={ handleConfirmOrder }>
									<CheckOutlined/>
								</Button>
							) : null
						}
						{
							user && (user.username === record.username) || hasAccessForServer(EUserRoles.st) ? (
								<Button danger onClick={ handleCancelOrder }>
									<CloseCircleOutlined/>
								</Button>
							) : null
						}
					</HorizontalLayout>
				) : 'Недоступно';
			},
		},
	];

	const handleServerSelectChange = (value: string[]) => {
		setSelectedServers(value);
	};

	const handleModeratorSelectChange = (value: string[]) => {
		setSelectedModerators(value);
	};

	const handleTypesSelectChange = (value: string[]) => {
		setSelectedTypes(value);
	};

	const handleStatusesSelectChange = (value: string[]) => {
		setSelectedStatuses(value);
	};

	const fetchOrders = async () => {
		const newOrders = await fetch(`/api/orders/get`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				server: debouncedServers.join(','),
				username: debouncedModerators.join(','),
				type: debouncedTypes.join(','),
				status: debouncedStatuses.join(',')
			})
		}).then(res => res.json());
		setOrders(newOrders);
	};

	useEffect(() => {
		(async () => {
			const newUsers = await fetch('/api/users/getAll').then<IUser[]>(res => res.json());
			setAllUsers(newUsers);
			await fetchOrders();
		})();
	}, []);

	useEffect(() => {
		fetchOrders();
	}, [ debouncedServers, debouncedModerators, debouncedTypes, debouncedStatuses ]);

	return (
		<ModPanelPage needRole={ EUserRoles.trainee }>
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
									placeholder="Тип заказа"
									defaultValue={ [] }
									value={ selectedTypes }
									onChange={ handleTypesSelectChange }
									options={ Object.entries(ORDER_TYPES).map(([ orderType, orderTypeLabel ]) => ({
										label: orderTypeLabel,
										value: orderType
									})) }
								/>
							</HorizontalLayout>
							<HorizontalLayout>
								<Select
									mode="multiple"
									allowClear
									style={ { width: '240px', cursor: 'pointer' } }
									placeholder="Статус заказа"
									defaultValue={ [] }
									value={ selectedStatuses }
									onChange={ handleStatusesSelectChange }
									options={ Object.entries(ORDER_STATUSES).map(([ statusKey, statusLabel ]) => ({
										label: statusLabel,
										value: statusKey
									})) }
								/>
							</HorizontalLayout>
						</ModPageControlsStyled>
						<ModPanelPageContent>
							<Table bordered style={ {
								width: '100%'
							} } dataSource={ orders.map(order => {
								//@ts-ignore
								order.key = order.timestamp.toString();
								return order;
							}) } columns={ columns }/>
						</ModPanelPageContent>
					</>
				)
			}
		</ModPanelPage>
	);
};

export default ModPanelOrdersPage;
