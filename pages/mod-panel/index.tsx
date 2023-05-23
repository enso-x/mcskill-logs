import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import { JWT } from 'next-auth/jwt';
import { Button, Select } from 'antd';

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
import moment from 'moment';
import { HorizontalLayout } from '@/components/Styled';
import { ISettings } from '@/models/Settings';

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

const getDaysBetweenDates = (date1: Date, date2: Date): Date[] => {
	const result = [];
	for (let day = date1; day <= date2; day.setDate(day.getDate()+1)) {
		result.push(new Date(day));
	}
	return result;
};

const dateFormatter = new Intl.DateTimeFormat('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit' });
export const timePattern = (group: string | null = null) => `\\[(?${group ? `<${group}>` : ':'}\\d{2}:\\d{2}(?::\\d{2})?)]`;
export const namePattern = (group: string | null = null) => `(?${group ? `<${group}>` : ':'}[A-Za-z_0-9-]+)`;
const connectionRegExp = new RegExp(`${timePattern('time')} ${namePattern('playerName')} (?<actionType>(?:logged in)|(?:left the game))\\n?`, 'i');
const toUTC = (date: string) => date.split('-').reverse().join('-');

const timeToSeconds = (time: string): number => {
	const [hours, minutes, seconds] = time.split(':').map(Number);
	return (hours * 60 + minutes) * 60 + seconds;
};

const calcOnlinePointsForUser = (duration: number, pointsPerWeek = 15, onlinePerWeek = '21:00:00', overtimeMultiplier = 1.1) => {
	const secondsPerWeek = timeToSeconds(onlinePerWeek);
	const pointsForOneSecond = pointsPerWeek / secondsPerWeek;

	const overtimeSeconds = Math.max(duration - secondsPerWeek, 0);
	const pointsForOvertime = overtimeSeconds * pointsForOneSecond * overtimeMultiplier;
	const pointsForFullOnline = pointsPerWeek + pointsForOvertime;
	const pointsForPartialOnline = pointsForFullOnline * (duration / secondsPerWeek);

	return Math.round(duration >= secondsPerWeek ? pointsForFullOnline : pointsForPartialOnline);
};

const padZero = (num: number): string => {
	return num > 9 ? num.toString() : '0' + num;
};

const durationToString = (duration: any): string => {
	const days = duration._data.days;
	const hours = duration._data.hours;
	const minutes = duration._data.minutes;
	const seconds = duration._data.seconds;

	return `${padZero(days * 24 + hours)}:${padZero(minutes)}:${padZero(seconds)}`;
};

const ModPanelPage: NextPage<ModPanelPageProps> = ({
	discord,
	user,
	allUsers
}) => {
	const filterAndSortUsers = (users: IUser[]): IUser[] => {
		if (!currentUser) {
			return users;
		}

		return users.filter(modUser => modUser.discord_id !== currentUser.discord_id)
			.sort((a, b) => {
				return a.username.localeCompare(b.username) * -1;
			}).sort((a, b) => {
				return a.role >= b.role ? -1 : 1;
			});
	};

	const { update: updateSession } = useSession();
	const [ currentUser, setCurrentUser ] = useState<IUser>(user);
	const [ users, setUsers ] = useState<IUser[]>(filterAndSortUsers(allUsers));
	const [ onlineStatus, setOnlineStatus ] = useState<any>({});
	const [ selectedServers, setSelectedServers ] = useState<string[]>([]);
	const [ settings, setSettings ] = useState<ISettings>();
	const [ pointsInProgress, setPointsInProgress ] = useState<boolean>(false);
	const debouncedServers = useDebounce(selectedServers, 200);

	const handleServerSelectChange = (value: string[]) => {
		setSelectedServers(value);
	};

	const getOnlineForRecentWeekForServer = async (days: Date[], server: any) => {
		const logs = [];
		const requests = days.map(async (date) => ({
			date: date,
			response: await fetch(`/api/logs`, {
				method: 'POST',
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify({ urlBase: server.connection_logs_url, date: dateFormatter.format(date).replaceAll('.', '-') })
			})
		}));
		for await (let request of requests) {
			const data = await request.response.json();
			logs.push(data);
		}
		const serverUserNames = allUsers.filter(user => user.servers.includes(server.value) && user.role <= EUserRoles.moder).map(user => user.username);
		const durations: any = {};
		const usernamesReg = new RegExp(serverUserNames.map(username => ` ${username} `).join('|'), 'i');
		logs.forEach(log => {
			log.text.split('\n').filter((line: string) => line.length && usernamesReg.test(line)).forEach((line: string) => {
				const data = connectionRegExp.exec(line)?.groups;

				if (data) {
					if (!durations[data.playerName]) durations[data.playerName] = {
						duration: moment.duration(0),
						lastLogin: `${toUTC(log.date)} 00:00:00`
					};
					if (data.actionType === 'left the game') {
						const leftTime = `${toUTC(log.date)} ${data.time}`;
						const lastLoginMoment = moment(durations[data.playerName].lastLogin);
						const leftGameMoment = moment(leftTime);
						durations[data.playerName].duration = durations[data.playerName].duration.add(moment.duration(leftGameMoment.diff(lastLoginMoment)));
					} else {
						durations[data.playerName].lastLogin = `${toUTC(log.date)} ${data.time}`;
					}
				}
			});
		});
		return durations;
	};

	const getOnlineForServer = async (server: any) => {
		const response = await fetch(`/api/logs`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({ urlBase: server.connection_logs_url, date: dateFormatter.format(new Date()).replaceAll('.', '-') })
		}).then(res => res.json())
		const serverUserNames = allUsers.filter(user => user.servers.includes(server.value)).map(user => user.username);
		const online: any = {};
		const usernamesReg = new RegExp(serverUserNames.map(username => ` ${username} `).join('|'), 'i');

		response.text.split('\n').filter((line: string) => line.length && usernamesReg.test(line)).forEach((line: string) => {
			const data = connectionRegExp.exec(line)?.groups;

			if (data) {
				if (!online[data.playerName]) online[data.playerName] = {
					server: server.label,
					isOnline: true
				};
				if (data.actionType === 'left the game') {
					online[data.playerName].isOnline = false;
				} else {
					online[data.playerName].isOnline = true;
				}
			}
		});

		setOnlineStatus((state: any) => ({
			...state,
			[server.value]: online
		}));
	};

	const calcOnlineForRecentWeek = async () => {
		setPointsInProgress(true);
		const startOfWeek = moment().startOf('week').subtract(1, 'week').add(1, 'day').toDate();
		const endOfWeek = moment().endOf('week').subtract(1, 'week').add(1, 'day').toDate();
		const days = getDaysBetweenDates(startOfWeek, endOfWeek);

		const result: any = {};

		let clipboardText = `\`\`\`asciidoc\n`;

		for (let server of Object.values(SERVERS)) {
			const onlineForRecentWeek = await getOnlineForRecentWeekForServer(days, server);
			clipboardText += `[ ${server.label} ]\n`;

			for (let [username, value] of Object.entries(onlineForRecentWeek)) {
				const duration = (value as any).duration;
				const earnedPoints = calcOnlinePointsForUser(duration.as('seconds'), settings?.pointsPerWeek, settings?.onlinePerWeek, settings?.overtimeMultiplier);

				if (!result[username]) {
					result[username] = earnedPoints;
				} else {
					result[username] = result[username] + earnedPoints;
				}

				clipboardText += `${username}: ${durationToString(duration)} (+${earnedPoints})\n`;
			}
			clipboardText += `\n`;
		}
		clipboardText += `\`\`\``;

		await navigator.clipboard.writeText(clipboardText);

		for (let [username, points] of Object.entries(result)) {
			const moderator = users.find(user => user.username === username);
			if (moderator) {
				await fetch('/api/users/edit', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						discord_id: moderator.discord_id,
						points: moderator.points + (points as number)
					})
				});
			}
		}

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

	const getOnlineStatus = async () => {
		for (let server of Object.values(SERVERS)) {
			await getOnlineForServer(server);
		}
	};

	useEffect(() => {
		(async () => {
			if (currentUser) {
				const [ appSettings ] = await fetch('/api/settings/get').then(res => res.json());
				setSettings(appSettings);
				await getOnlineStatus();
			}
		})();
	}, []);

	useEffect(() => {
		updateUserList();
	}, [ debouncedServers ]);

	const getUserOnlineStatus = (user: IUser) => {
		if (onlineStatus) {
			for (let server of Object.values(onlineStatus)) {
				const serverUser = (server as any)[user.username];
				if (serverUser && serverUser.isOnline) {
					return {
						title: serverUser.server,
						status: true
					};
				}
			}
			return {
				title: 'Offline',
				status: false
			};
		}
		return {
			title: 'Offline',
			status: false
		};
	};

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
			setUsers(filterAndSortUsers(newUsers));
		}
	};

	return (
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
									<HorizontalLayout>
										{
											settings && settings.lastWeek < moment().get('week') && currentUser.role >= EUserRoles.curator ? (
												<Button type="primary" loading={ pointsInProgress } onClick={ calcOnlineForRecentWeek }>Начислить очки за неделю</Button>
											) : null
										}
										{/*{*/}
										{/*	currentUser.role >= EUserRoles.curator ? (*/}
										{/*		<Button type="primary" danger loading={ pointsInProgress } onClick={ resetPoints }>Ресетнуть все очки</Button>*/}
										{/*	) : null*/}
										{/*}*/}
										{
											currentUser.role >= EUserRoles.st ? (
												<ModalAddMember user={ currentUser } onSubmit={ updateUserList }/>
											) : null
										}
									</HorizontalLayout>
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
											               moderator={ modUser } isOnline={ getUserOnlineStatus(modUser) } onUpdate={ updateUserList }/>
										))
									}
								</ContentContainer>
							</Content>
						</MainContainer>
					</AppContainer>
				)
			}
		</Page>
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
