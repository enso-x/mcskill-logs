import moment from 'moment/moment';

import { getDaysBetweenDates, momentDurationToString, timeToSeconds, toUTC } from '@/helpers/datetime';
import { IUser } from '@/interfaces/User';
import { IServer } from '@/interfaces/Server';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit' });
const timePattern = (group: string | null = null) => `\\[(?${ group ? `<${ group }>` : ':' }\\d{2}:\\d{2}(?::\\d{2})?)]`;
const namePattern = (group: string | null = null) => `(?${ group ? `<${ group }>` : ':' }[A-Za-z_0-9-]+)`;
const connectionRegExp = new RegExp(`${timePattern('time')} ${namePattern('playerName')} (?<actionType>(?:logged in)|(?:left the game))\\n?`, 'i');

export const DURATION_LOGS_STORAGE_KEY = '[pixelmon][panel][duration-logs]';

export const calculatePointsForOnlineTime = (duration: number, pointsPerWeek = 15, onlinePerWeek = '21:00:00', overtimeMultiplier = 1.1) => {
	const secondsPerWeek = timeToSeconds(onlinePerWeek);
	const pointsForOneSecond = pointsPerWeek / secondsPerWeek;

	const overtimeSeconds = Math.max(duration - secondsPerWeek, 0);
	const pointsForOvertime = overtimeSeconds * pointsForOneSecond * overtimeMultiplier;
	const pointsForFullOnline = pointsPerWeek + pointsForOvertime;
	const pointsForPartialOnline = pointsForFullOnline * (duration / secondsPerWeek);

	return Math.round(duration >= secondsPerWeek ? pointsForFullOnline : pointsForPartialOnline);
};

const startOfDateMoment = (date: string): moment.Moment => {
	return moment(`${ toUTC(date) } 00:00:00`);
};

const dateTimeToMoment = (date: string, time: string): moment.Moment => {
	return moment(`${ toUTC(date) } ${ time }`);
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
	lastLogin: moment.Moment;
}

type TUsersOnlineDuration = Record<string, IUserDuration>;

export const fetchOnlineForRecentWeekForServer = async (server: IServer, usernames: string[], isDebugMode: boolean = false): Promise<TUsersOnlineDuration> => {
	const startOfWeek = moment().startOf('week').subtract(1, 'week').add(1, 'day').toDate();
	const endOfWeek = moment().endOf('week').subtract(1, 'week').add(1, 'day').toDate();

	const logs = await fetchServerConnectionLogsForPeriod(server, getDaysBetweenDates(startOfWeek, endOfWeek));

	const durations: TUsersOnlineDuration = {};
	const usernamesReg = new RegExp(usernames.map(username => ` ${ username } `).join('|'), 'i');
	const notEndedModerators: Set<string> = new Set();
	const durationLogs: Record<string, string[]> = {};

	const getDurationBetweenMoments = (startMoment: moment.Moment, endMoment: moment.Moment): moment.Duration => {
		return moment.duration(endMoment.diff(startMoment));
	};

	const addDurationForUser = (username: string, duration: moment.Duration) => {
		if (!durations[username]) return;

		durations[username].duration = durations[username].duration.add(duration);
	};

	const checkAndDeleteUserFromNotEnded = (username: string) => {
		if (notEndedModerators.has(username)) {
			notEndedModerators.delete(username);
		}
	};

	const appendLogoutToLog = (username: string, logoutMoment: moment.Moment, onlineDuration: moment.Duration) => {
		durationLogs[username].push(`Выход: ${ logoutMoment.format('DD.MM.YYYY HH:mm') }`);
		durationLogs[username].push(`Длительность онлайна: ${ momentDurationToString(onlineDuration) }`);
		durationLogs[username].push(`Общий онлайн на данный момент: ${ momentDurationToString(durations[username].duration) }`);
		durationLogs[username].push(`-------------------------------------------`);
	};

	logs.forEach((log, logIndex) => {
		const lines = log.text.split('\n').filter((line: string) => line.length && usernamesReg.test(line));

		lines.forEach((line: string, lineIndex: number) => {

			const data = connectionRegExp.exec(line)?.groups;

			if (data) {
				if (!durationLogs[data.playerName]) durationLogs[data.playerName] = [];
				if (!durations[data.playerName]) durations[data.playerName] = {
					duration: moment.duration(0),
					lastLogin: startOfDateMoment(log.date)
				};
				if (data.actionType === 'left the game') {
					const duration = getDurationBetweenMoments(durations[data.playerName].lastLogin, dateTimeToMoment(log.date, data.time));

					addDurationForUser(data.playerName, duration);
					checkAndDeleteUserFromNotEnded(data.playerName);
					appendLogoutToLog(data.playerName, dateTimeToMoment(log.date, data.time), duration);
				} else {
					durations[data.playerName].lastLogin = dateTimeToMoment(log.date, data.time);
					notEndedModerators.add(data.playerName);

					durationLogs[data.playerName].push(`Вход: ${ dateTimeToMoment(log.date, data.time).format('DD.MM.YYYY HH:mm') }`);
				}
			}

			if (lineIndex === lines.length - 1 && logIndex === logs.length - 1 && notEndedModerators.size > 0) {
				notEndedModerators.forEach(moderatorName => {
					const logoutMoment = startOfDateMoment(log.date).add(1, 'day');
					const duration = getDurationBetweenMoments(durations[moderatorName].lastLogin, logoutMoment);

					addDurationForUser(moderatorName, duration);
					checkAndDeleteUserFromNotEnded(moderatorName);
					appendLogoutToLog(moderatorName, logoutMoment, duration);
				});
			}
		});
	});

	for (let username in durationLogs) {
		durationLogs[username].unshift(`-------------------------------------------`);
		durationLogs[username].unshift(`Общее время игры с [${ moment(startOfWeek).format('DD.MM.YYYY HH:mm:ss') }] по [${ moment(endOfWeek).format('DD.MM.YYYY HH:mm:ss') }]: ${ momentDurationToString(durations[username].duration) }`);

		const logsString = durationLogs[username].join('\n');

		if (isDebugMode) {
			console.groupCollapsed(username);
			console.log(logsString);
			console.groupEnd();
		}

		localStorage.setItem(DURATION_LOGS_STORAGE_KEY + username, logsString);
	}

	return durations;
};

export const clearPreviousDurationLogsFromLocalStorage = () => {
	for (let localStorageKey in localStorage) {
		if (localStorageKey.startsWith(DURATION_LOGS_STORAGE_KEY)) {
			localStorage.removeItem(localStorageKey);
		}
	}
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
				isOnline: false // Проверить завтра
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

export const updateUserPointsForServer = async (user: IUser, server: string, pointsToAdd: number) => {
	await fetch('/api/users/edit', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			discord_id: user.discord_id,
			roles: user.roles.map(role => {
				if (role.server === server) {
					role.points = role.points + pointsToAdd;
				}
				return role;
			})
		})
	});
};
