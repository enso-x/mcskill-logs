import React, { ChangeEvent, useEffect, useState } from 'react';
import styled from 'styled-components';
import moment from 'moment';
import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import { JWT } from 'next-auth/jwt';
import { Button, Select, Input, Checkbox } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';

import { protectedRoute } from '@/middleware/protectedRoute';
import { useDebounce } from '@/helpers';
import { filterAndSortUsers, getAverageUserRoleInfo, getUserRoleInfoForServer, hasJuniorRole } from '@/helpers/users';
import { momentDurationToString } from '@/helpers/datetime';
import { timeToSeconds } from '@/helpers/mod-panel/online';
import { onlineAPI } from '@/helpers/mod-panel';
import { ModPanelPage, ModPanelPageControls, ModPanelPageContent } from '@/components/mod-panel/ModPanelPage';
import { HorizontalLayout } from '@/components/Styled';
import { ModeratorCard } from '@/components/mod-panel/ModeratorCard';
import { ModalAddMember } from '@/components/mod-panel/modals/ModalAddMember';
import { EUserRoles, IUser } from '@/interfaces/User';
import { SERVERS } from '@/interfaces/Server';
import { ISettings } from '@/models/Settings';

const ModPanelPageContentStyled = styled(ModPanelPageContent)`
	display: flex;
	flex-direction: row;
	gap: 16px;
	padding: 16px;
	flex-wrap: wrap;
	align-items: flex-start;
	overflow-y: auto;
`;

interface ModPanelIndexPageProps {
	discord: JWT;
	user: IUser;
	allUsers: IUser[];
}

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

const ModPanelIndexPage: NextPage<ModPanelIndexPageProps> = ({
	discord,
	user,
	allUsers
}) => {
	const { update: updateSession } = useSession();
	const [ users, setUsers ] = useState<IUser[]>(filterAndSortUsers(user, allUsers));
	const [ userFilter, setUserFilter ] = useState<string>('');
	const [ onlineStatus, setOnlineStatus ] = useState<any>({});
	const [ selectedServers, setSelectedServers ] = useState<string[]>([]);
	const [ selectedUsers, setSelectedUsers ] = useState<string[]>([]);
	const [ settings, setSettings ] = useState<ISettings>();
	const [ pointsInProgress, setPointsInProgress ] = useState<boolean>(false);
	const debouncedServers = useDebounce(selectedServers, 200);

	const fetchOnlineStatuses = async () => {
		for (let server of Object.values(SERVERS)) {
			const statuses = await onlineAPI.fetchUsersOnlineStatusForServer(server, onlineAPI.getUsernames(allUsers));

			setOnlineStatus((state: any) => ({
				...state,
				[server.value]: statuses
			}));
		}
	};

	const calcOnlineForRecentWeek = async () => {
		if (!settings) return;

		setPointsInProgress(true);

		let clipboardText = `\`\`\`asciidoc\n`;

		for (let server of Object.values(SERVERS)) {
			const onlineForRecentWeek = await onlineAPI.fetchOnlineForRecentWeekForServer(server, onlineAPI.getJuniorUsernamesForServer(server, allUsers));
			clipboardText += `[ ${ server.label } ]\n`;

			for (let [ username, value ] of Object.entries(onlineForRecentWeek)) {
				const duration = (value as any).duration;
				const moderator = users.find(user => user.username === username);

				if (!moderator) continue;

				const moderatorRoleInfo = getUserRoleInfoForServer(moderator, server.value);
				const pointsPerWeekByRole = moderatorRoleInfo ?
					moderatorRoleInfo.role === EUserRoles.trainee ? settings.pointsPerWeekForTrainee :
						moderatorRoleInfo.role === EUserRoles.helper ? settings.pointsPerWeekForHelper :
							moderatorRoleInfo.role === EUserRoles.moder ? settings.pointsPerWeekForModerator :
								settings.pointsPerWeekForTrainee : settings.pointsPerWeekForTrainee;
				const userOnlineSeconds = duration.as('seconds');
				const earnedPoints = userOnlineSeconds > timeToSeconds(settings.onlinePerWeek ?? '21:00:00')
					? onlineAPI.calculatePointsForOnlineTime(userOnlineSeconds, pointsPerWeekByRole, settings.onlinePerWeek, settings.overtimeMultiplier)
					: selectedUsers.includes(moderator.discord_id) ? pointsPerWeekByRole : 0;

				await onlineAPI.updateUserPointsForServer(moderator, server.value, earnedPoints);

				clipboardText += `${ username }: ${ momentDurationToString(duration) } (+${ earnedPoints })\n`;
			}
			clipboardText += `\n`;
		}
		clipboardText += `\`\`\``;

		await navigator.clipboard.writeText(clipboardText);
		await updateUserList();

		const [ newSettings ] = await fetch('/api/settings/update', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				lastWeek: moment().get('week')
			})
		}).then(res => res.json());

		setSettings(newSettings);
		setPointsInProgress(false);
		setSelectedUsers([]);
	};

	// const resetPoints = async () => {
	// 	setPointsInProgress(true);
	// 	// const filteredModerators = users.filter(user => user.role <= EUserRoles.moder);
	// 	// for (let moderator of filteredModerators) {
	// 	// 	await fetch('/api/users/edit', {
	// 	// 		method: 'POST',
	// 	// 		headers: {
	// 	// 			'Content-Type': 'application/json'
	// 	// 		},
	// 	// 		body: JSON.stringify({
	// 	// 			discord_id: moderator.discord_id,
	// 	// 			points: 0
	// 	// 		})
	// 	// 	});
	// 	// }
	// 	// await updateUserList();
	// 	setPointsInProgress(false);
	// };

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
			setUsers(filterAndSortUsers(user, newUsers));
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

	useEffect(() => {
		(async () => {
			if (user) {
				const [ appSettings ] = await fetch('/api/settings/get').then(res => res.json());
				setSettings(appSettings);
				await fetchOnlineStatuses();
			}
		})();
	}, []);

	useEffect(() => {
		updateUserList();
	}, [ debouncedServers ]);

	return (
		<ModPanelPage>
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
					{
						settings && settings.lastWeek < moment().get('week') && user && getAverageUserRoleInfo(user).role >= EUserRoles.curator ? (
							<Button type="primary" loading={ pointsInProgress }
							        onClick={ calcOnlineForRecentWeek }>
								Начислить очки за неделю
							</Button>
						) : null
					}
					{/*{*/}
					{/*	settings && settings.lastWeek < moment().get('week') && user && getAverageUserRoleInfo(user).role >= EUserRoles.curator ?(*/}
					{/*		<Button type="primary" danger loading={ pointsInProgress } onClick={ resetPoints }>Ресетнуть все очки</Button>*/}
					{/*	) : null*/}
					{/*}*/}
					{
						user && getAverageUserRoleInfo(user).role >= EUserRoles.curator ? (
							<ModalAddMember user={ user } onSubmit={ updateUserList }/>
						) : null
					}
				</HorizontalLayout>
			</ModPanelPageControls>
			<ModPanelPageContentStyled>
				{
					filterAndSortUsers(
						user,
						users.filter(moderator => moderator.username.toLowerCase().includes(userFilter.toLowerCase()))
					).map(modUser => (
						<ModeratorCardContainer key={ modUser.discord_id }>
							<ModeratorCard user={ user }
							               moderator={ modUser }
							               onlineStatus={ onlineAPI.getUserOnlineStatus(modUser, onlineStatus) }
							               onUpdate={ updateUserList }/>
							{
								hasJuniorRole(modUser) && settings && settings.lastWeek < moment().get('week') && user && getAverageUserRoleInfo(user).role >= EUserRoles.curator ? (
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
		</ModPanelPage>
	);
};

export const getServerSideProps = protectedRoute<ModPanelIndexPageProps>(async (context) => {
	const { siteFetch } = context;
	const allUsers = await siteFetch<IUser[]>('/api/users/getAll');

	return ({
		props: {
			discord: context.session?.discord ?? null,
			user: context.session?.user ?? null,
			allUsers: allUsers ?? []
		}
	});
});

export default ModPanelIndexPage;

export const config = {
	runtime: 'nodejs'
};
