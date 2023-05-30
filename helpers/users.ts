import { EUserRoles, IUser, IUserServerRoleInfo } from '@/interfaces/User';
import { IServer } from '@/interfaces/Server';

export const getUsernames = (users: IUser[]): string[] => {
	return users.map(user => user.username);
};

export const filterAndSortUsers = (currentUser: IUser, userList: IUser[]): IUser[] => {
	if (!currentUser || !userList) {
		return [];
	}

	return userList.filter(user => user.discord_id !== currentUser.discord_id)
		.sort((a, b) => {
			return a.username.localeCompare(b.username) * -1;
		}).sort((a, b) => {
			return getAverageUserRoleInfo(a).role >= getAverageUserRoleInfo(b).role ? -1 : 1;
		});
};

export const getAverageUserRoleInfo = (user: IUser): IUserServerRoleInfo => {
	let result: IUserServerRoleInfo = user.roles[0];
	user.roles.forEach(roleInfo => {
		if (roleInfo.role > result.role) {
			result = roleInfo;
		}
	});

	return result;
};

export const getJuniorUsernamesForServer = (server: IServer, users: IUser[]): string[] => {
	return getUsernames(users.filter(user => {
		const userRoleInfoForServer = getUserRoleInfoForServer(user, server.value);
		return getUserServersKeys(user).includes(server.value) && userRoleInfoForServer && userRoleInfoForServer.role <= EUserRoles.moder;
	}));
};

export const getUserRoleInfoForServer = (user: IUser, server: string): IUserServerRoleInfo | null => {
	return user.roles.find(role => role.server === server) ?? null;
};

export const getUserServersKeys = (user: IUser): string[] => {
	return user.roles.map(roleInfo => roleInfo.server);
};

export const hasJuniorRole = (user: IUser): boolean => {
	return user.roles.some(roleInfo => roleInfo.role <= EUserRoles.moder);
};
