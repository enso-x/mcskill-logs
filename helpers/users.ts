import { IUser } from '@/interfaces/User';

export const filterAndSortUsers = (currentUser: IUser, userList: IUser[]): IUser[] => {
	if (!currentUser || !userList) {
		return [];
	}

	return userList.filter(user => user.discord_id !== currentUser.discord_id)
		.sort((a, b) => {
			return a.username.localeCompare(b.username) * -1;
		}).sort((a, b) => {
			return a.role >= b.role ? -1 : 1;
		});
};
