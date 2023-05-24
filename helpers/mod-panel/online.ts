import moment from 'moment/moment';

import { getDaysBetweenDates, toUTC } from '@/helpers/datetime';
import { EUserRoles, IUser } from '@/interfaces/User';
import { IServer } from '@/interfaces/Server';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit' });
const timePattern = (group: string | null = null) => `\\[(?${ group ? `<${ group }>` : ':' }\\d{2}:\\d{2}(?::\\d{2})?)]`;
const namePattern = (group: string | null = null) => `(?${ group ? `<${ group }>` : ':' }[A-Za-z_0-9-]+)`;
const connectionRegExp = new RegExp(`${timePattern('time')} ${namePattern('playerName')} (?<actionType>(?:logged in)|(?:left the game))\\n?`, 'i');

export const getUsernames = (users: IUser[]): string[] => {
	return users.map(user => user.username);
};

export const getJuniorUsernamesForServer = (server: IServer, users: IUser[]): string[] => {
	return getUsernames(users.filter(user => user.servers.includes(server.value) && user.role <= EUserRoles.moder));
};

export const timeToSeconds = (time: string): number => {
	const [ hours, minutes, seconds ] = time.split(':').map(Number);
	return (hours * 60 + minutes) * 60 + seconds;
};

export const calculatePointsForOnlineTime = (duration: number, pointsPerWeek = 15, onlinePerWeek = '21:00:00', overtimeMultiplier = 1.1) => {
	const secondsPerWeek = timeToSeconds(onlinePerWeek);
	const pointsForOneSecond = pointsPerWeek / secondsPerWeek;

	const overtimeSeconds = Math.max(duration - secondsPerWeek, 0);
	const pointsForOvertime = overtimeSeconds * pointsForOneSecond * overtimeMultiplier;
	const pointsForFullOnline = pointsPerWeek + pointsForOvertime;
	const pointsForPartialOnline = pointsForFullOnline * (duration / secondsPerWeek);

	return Math.round(duration >= secondsPerWeek ? pointsForFullOnline : pointsForPartialOnline);
};

interface IServerLogResponse {
	date: string;
	text: string;
}

export const fetchServerConnectionLogsForPeriod = async (server: IServer, days: Date[]): Promise<IServerLogResponse[]> => {
	const requests = days.map((date) => fetch(`/api/logs`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			urlBase: `${ server.logs_url }/connection/`,
			date: dateFormatter.format(date).replaceAll('.', '-')
		})
	}).then(res => res.json()));

	return await Promise.all<IServerLogResponse>(requests).then(responses => {
		return responses;
	});
};

interface IUserDuration {
	duration: moment.Duration;
	lastLogin: string;
}

type TUsersOnlineDuration = Record<string, IUserDuration>;

export const fetchOnlineForRecentWeekForServer = async (server: IServer, usernames: string[]): Promise<TUsersOnlineDuration> => {
	const startOfWeek = moment().startOf('week').subtract(1, 'week').add(1, 'day').toDate();
	const endOfWeek = moment().endOf('week').subtract(1, 'week').add(1, 'day').toDate();

	const logs = await fetchServerConnectionLogsForPeriod(server, getDaysBetweenDates(startOfWeek, endOfWeek));

	const durations: TUsersOnlineDuration = {};
	const usernamesReg = new RegExp(usernames.map(username => ` ${ username } `).join('|'), 'i');
	const notEndedModerators: Set<string> = new Set();

	const addDurationForUser = (username: string, date: string, time: string) => {
		if (!durations[username]) return;

		const leftTime = `${ toUTC(date) } ${ time }`;
		const lastLoginMoment = moment(durations[username].lastLogin);
		const leftGameMoment = moment(leftTime);

		durations[username].duration = durations[username].duration.add(moment.duration(leftGameMoment.diff(lastLoginMoment)));

		if (notEndedModerators.has(username)) {
			notEndedModerators.delete(username);
		}
	};

	logs.forEach((log, li) => {
		const lines = log.text.split('\n').filter((line: string) => line.length && usernamesReg.test(line));

		lines.forEach((line: string, i: number) => {
			const data = connectionRegExp.exec(line)?.groups;

			if (data) {
				if (!durations[data.playerName]) durations[data.playerName] = {
					duration: moment.duration(0),
					lastLogin: `${ toUTC(log.date) } 00:00:00`
				};
				if (data.actionType === 'left the game') {
					addDurationForUser(data.playerName, log.date, data.time);
				} else {
					durations[data.playerName].lastLogin = `${ toUTC(log.date) } ${ data.time }`;
					notEndedModerators.add(data.playerName);
				}
			}

			if (i === lines.length - 1 && li === logs.length - 1 && notEndedModerators.size > 0) {
				notEndedModerators.forEach(moderatorName => {
					addDurationForUser(moderatorName, log.date, '00:00:00');
				});
			}
		});
	});

	return durations;
};

export interface IUserOnlineStatus {
	title: string;
	isOnline: boolean;
}

type TUsersOnlineStatus = Record<string, IUserOnlineStatus>;

export const fetchUsersOnlineStatusForServer = async (server: IServer, usernames: string[]): Promise<TUsersOnlineStatus> => {
	const [ response ] = await fetchServerConnectionLogsForPeriod(server, [ new Date() ]);

	const onlineStatuses: TUsersOnlineStatus = {};
	const usernamesReg = new RegExp(usernames.map(username => ` ${ username } `).join('|'), 'i');

	response.text.split('\n').filter((line: string) => line.length && usernamesReg.test(line)).forEach((line: string) => {
		const data = connectionRegExp.exec(line)?.groups;

		if (data) {
			if (!onlineStatuses[data.playerName]) onlineStatuses[data.playerName] = {
				title: server.label,
				isOnline: true
			};
			onlineStatuses[data.playerName].isOnline = data.actionType !== 'left the game';
		}
	});

	return onlineStatuses;
};

export const getUserOnlineStatus = (user: IUser, statuses: Record<string, TUsersOnlineStatus>): IUserOnlineStatus => {
	const offlineStatus: IUserOnlineStatus = {
		title: 'Offline',
		isOnline: false
	};

	if (statuses) {
		for (let serverUserStatuses of Object.values(statuses)) {
			const serverUserStatus = serverUserStatuses[user.username];

			if (serverUserStatus && serverUserStatus.isOnline) {
				return serverUserStatus;
			}
		}

		return offlineStatus;
	}

	return offlineStatus;
};

export const updateUsersPoints = async (users: IUser[], usersPoints: Record<string, number>) => {
	for (let user of users) {
		if (!usersPoints[user.username]) continue;

		await fetch('/api/users/edit', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				discord_id: user.discord_id,
				points: user.points + usersPoints[user.username]
			})
		});
	}
};
