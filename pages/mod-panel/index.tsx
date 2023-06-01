import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import { Select, Input, Checkbox } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';

import { Loading, LoadingContainer } from '@/components/mod-panel/Loading';
import { ModPanelPage, ModPanelPageControls, ModPanelPageContent } from '@/components/mod-panel/ModPanelPage';
import { HorizontalLayout } from '@/components/Styled';
import { ModeratorCard } from '@/components/mod-panel/ModeratorCard';
import { ModalAddMember } from '@/components/mod-panel/modals/ModalAddMember';
import { useCalculateOnlinePoints } from '@/components/mod-panel/CalculateOnlinePoints';
import { EUserRoles, IUser } from '@/interfaces/User';
import { SERVERS } from '@/interfaces/Server';
import { useDebounce } from '@/helpers';
import {
	filterAndSortUsers,
	getUserHasAccess,
	getUsernames,
	hasJuniorRole
} from '@/helpers/users';
import { onlineAPI } from '@/helpers/mod-panel';
import { TUserServerOnlineStatus } from '@/helpers/mod-panel/online';


const ModPanelPageContentStyled = styled(ModPanelPageContent)`
	display: flex;
	flex-direction: row;
	gap: 16px;
	padding: 16px;
	flex-wrap: wrap;
	align-items: flex-start;
	overflow-y: auto;
`;

const ModeratorCardCheckboxContainer = styled.div`
	position: absolute;
	bottom: 0;
	display: none;
	justify-content: center;
	align-items: flex-end;
	width: 100%;
	padding: 16px;
	background: #010101;
	border-radius: 0 0 8px 8px;
	border: 1px solid var(--border-color);
`;

const ModeratorCardContainer = styled.div`
	position: relative;
	display: flex;
	flex-direction: column;
	
	&:hover {
		${ ModeratorCardCheckboxContainer } {
			display: flex;
		}
	}
`;

const ModPanelIndexPage: NextPage = () => {
	const { data: session, update: updateSession } = useSession();
	const [ allUsers, setAllUsers ] = useState<IUser[]>([]);
	const [ userFilter, setUserFilter ] = useState<string>('');
	const [ onlineStatus, setOnlineStatus ] = useState<TUserServerOnlineStatus>({});
	const [ selectedServers, setSelectedServers ] = useState<string[]>([]);
	const [ selectedUsers, setSelectedUsers ] = useState<string[]>([]);
	const debouncedServers = useDebounce(selectedServers, 200);

	const user = useMemo(() => {
		return session?.user;
	}, [ session ]);
	const filteredUsers = useMemo(() => {
		return user ? filterAndSortUsers(user, allUsers) : [];
	}, [ user, allUsers ]);

	const { canCalculatePoints, calculatePointsControls } = useCalculateOnlinePoints({
		user,
		users: allUsers,
		selectedUsers,
		afterSubmit: async () => {
			await updateUserList();
			setSelectedUsers([]);
		}
	});

	const fetchOnlineStatuses = async () => {
		for (let server of Object.values(SERVERS)) {
			const statuses = await onlineAPI.fetchUsersOnlineStatusForServer(server, getUsernames(filteredUsers));

			setOnlineStatus((state: any) => ({
				...state,
				[server.value]: statuses
			}));
		}
	};

	const updateUserList = async () => {
		if (user) {
			let newUsers;
			if (debouncedServers.length) {
				newUsers = await fetch(`/api/users/getByServers?ids=${ debouncedServers.join(',') }`).then(res => res.json());
			} else {
				newUsers = await fetch(`/api/users/getAll`).then(res => res.json());
			}
			newUsers.forEach((newUser: IUser) => {
				if (newUser.discord_id === user.discord_id) {
					updateSession();
				}
			});
			setAllUsers(newUsers);
		}
	};

	const handleServerSelectChange = (value: string[]) => {
		setSelectedServers(value);
	};

	const handleUserFilter = (e: ChangeEvent<HTMLInputElement>) => {
		setUserFilter(e.target.value);
	};

	const handleUserSelectedChange = (user: IUser) => (e: CheckboxChangeEvent) => {
		if (e.target.checked) {
			setSelectedUsers(selected => [ ...selected, user.discord_id ]);
		} else {
			setSelectedUsers(selected => selected.filter((userId: string) => userId !== user.discord_id));
		}
	};

	const hasAccess = getUserHasAccess(user, null);

	useEffect(() => {
		(async () => {
			const allUsers = await fetch(`/api/users/getAll`).then(res => res.json());
			setAllUsers(allUsers);
		})();
	}, []);

	useEffect(() => {
		(async () => {
			await fetchOnlineStatuses();
		})();
	}, [ filteredUsers ]);

	useEffect(() => {
		(async () => {
			await updateUserList();
		})();
	}, [ debouncedServers ]);

	return (
		<ModPanelPage>
			{
				!session ? (
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
									style={ { width: '240px', cursor: 'pointer', flexShrink: 0 } }
									placeholder="Сервер"
									defaultValue={ [] }
									value={ selectedServers }
									onChange={ handleServerSelectChange }
									options={ Object.values(SERVERS).map((server) => ({
										label: server.label,
										value: server.value
									})) }
								/>
								<Input placeholder="Фильтр по нику" value={ userFilter } onChange={ handleUserFilter }/>
							</HorizontalLayout>
							<HorizontalLayout>
								{ calculatePointsControls }
								{
									user && hasAccess(EUserRoles.gm) ? (
										<ModalAddMember user={ user } onSubmit={ updateUserList }/>
									) : null
								}
							</HorizontalLayout>
						</ModPanelPageControls>
						<ModPanelPageContentStyled>
							{
								user && filteredUsers.filter(moderator => moderator.username.toLowerCase().includes(userFilter.toLowerCase())).map(modUser => (
									<ModeratorCardContainer key={ modUser.discord_id }>
										<ModeratorCard user={ user }
										               moderator={ modUser }
										               onlineStatus={ onlineAPI.getUserOnlineStatus(modUser, onlineStatus) }
										               onUpdate={ updateUserList }/>
										{
											hasJuniorRole(modUser) && canCalculatePoints ? (
												<ModeratorCardCheckboxContainer>
													<Checkbox checked={ selectedUsers.includes(modUser.discord_id) }
													          onChange={ handleUserSelectedChange(modUser) }>
														Предупредил об онлайне
													</Checkbox>
												</ModeratorCardCheckboxContainer>
											) : null
										}
									</ModeratorCardContainer>
								))
							}
						</ModPanelPageContentStyled>
					</>
				)
			}
		</ModPanelPage>
	);
};

export default ModPanelIndexPage;
