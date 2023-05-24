import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import { JWT } from 'next-auth/jwt';
import { Button, Select } from 'antd';
import moment from 'moment';

import { onlineAPI } from '@/api/mod-panel';
import { protectedRoute } from '@/middleware/protectedRoute';
import { useDebounce } from '@/helpers';
import { filterAndSortUsers } from '@/helpers/users';
import { momentDurationToString } from '@/helpers/datetime';
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

const ModPanelIndexPage: NextPage<ModPanelIndexPageProps> = ({
	discord,
	user,
	allUsers
}) => {
	const { update: updateSession } = useSession();
	const [ users, setUsers ] = useState<IUser[]>(filterAndSortUsers(user, allUsers));
	const [ onlineStatus, setOnlineStatus ] = useState<any>({});
	const [ selectedServers, setSelectedServers ] = useState<string[]>([]);
	const [ settings, setSettings ] = useState<ISettings>();
	const [ pointsInProgress, setPointsInProgress ] = useState<boolean>(false);
	const debouncedServers = useDebounce(selectedServers, 200);

	const handleServerSelectChange = (value: string[]) => {
		setSelectedServers(value);
	};

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
		setPointsInProgress(true);

		const result: any = {};
		let clipboardText = `\`\`\`asciidoc\n`;

		for (let server of Object.values(SERVERS)) {
			const onlineForRecentWeek = await onlineAPI.fetchOnlineForRecentWeekForServer(server, onlineAPI.getJuniorUsernamesForServer(server, allUsers));
			clipboardText += `[ ${ server.label } ]\n`;

			for (let [ username, value ] of Object.entries(onlineForRecentWeek)) {
				const duration = (value as any).duration;
				const moderator = users.find(user => user.username === username);
				const pointsPerWeekByRole = moderator ?
					moderator.role === EUserRoles.trainee ? settings?.pointsPerWeekForTrainee :
						moderator.role === EUserRoles.helper ? settings?.pointsPerWeekForHelper :
							moderator.role === EUserRoles.moder ? settings?.pointsPerWeekForModerator :
								settings?.pointsPerWeekForTrainee : settings?.pointsPerWeekForTrainee;
				const earnedPoints = onlineAPI.calculatePointsForOnlineTime(duration.as('seconds'), pointsPerWeekByRole, settings?.onlinePerWeek, settings?.overtimeMultiplier);

				if (!result[username]) {
					result[username] = earnedPoints;
				} else {
					result[username] = result[username] + earnedPoints;
				}

				clipboardText += `${ username }: ${ momentDurationToString(duration) } (+${ earnedPoints })\n`;
			}
			clipboardText += `\n`;
		}
		clipboardText += `\`\`\``;

		await navigator.clipboard.writeText(clipboardText);
		await onlineAPI.updateUsersPoints(users, result);
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
	};

	// const resetPoints = async () => {
	// 	setPointsInProgress(true);
	// 	const filteredModerators = users.filter(user => user.role <= EUserRoles.moder);
	// 	for (let moderator of filteredModerators) {
	// 		await fetch('/api/users/edit', {
	// 			method: 'POST',
	// 			headers: {
	// 				'Content-Type': 'application/json'
	// 			},
	// 			body: JSON.stringify({
	// 				discord_id: moderator.discord_id,
	// 				points: 0
	// 			})
	// 		});
	// 	}
	// 	await updateUserList();
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
				<HorizontalLayout>
					{
						settings && settings.lastWeek < moment().get('week') && user.role >= EUserRoles.curator ? (
							<Button type="primary" loading={ pointsInProgress }
							        onClick={ calcOnlineForRecentWeek }>
								Начислить очки за неделю
							</Button>
						) : null
					}
					{/*{*/ }
					{/*	currentUser.role >= EUserRoles.curator ? (*/ }
					{/*		<Button type="primary" danger loading={ pointsInProgress } onClick={ resetPoints }>Ресетнуть все очки</Button>*/ }
					{/*	) : null*/ }
					{/*}*/ }
					{
						user.role >= EUserRoles.st ? (
							<ModalAddMember user={ user } onSubmit={ updateUserList }/>
						) : null
					}
				</HorizontalLayout>
			</ModPanelPageControls>
			<ModPanelPageContentStyled>
				{
					users.filter(modUser => modUser.discord_id !== user.discord_id)
						.sort((a, b) => {
							return a.username.localeCompare(b.username) * -1;
						}).sort((a, b) => {
						return a.role >= b.role ? -1 : 1;
					}).map(modUser => (
						<ModeratorCard key={ modUser.discord_id } user={ user }
						               moderator={ modUser }
						               onlineStatus={ onlineAPI.getUserOnlineStatus(modUser, onlineStatus) }
						               onUpdate={ updateUserList }/>
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
