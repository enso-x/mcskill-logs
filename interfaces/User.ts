import { Types } from 'mongoose';

export enum EUserRoles {
	player,
	trainee,
	helper,
	moder,
	st,
	gm,
	curator = 9,
	admin = 99,
	creator = 999
}

export const ROLES: Record<EUserRoles, string> = {
	[EUserRoles.player]: 'Игрок',
	[EUserRoles.trainee]: 'Стажер',
	[EUserRoles.helper]: 'Помощник',
	[EUserRoles.moder]: 'Модератор',
	[EUserRoles.st]: 'Ст. Модератор',
	[EUserRoles.gm]: 'Гл. Модератор',
	[EUserRoles.curator]: 'Куратор',
	[EUserRoles.admin]: 'Администратор',
	[EUserRoles.creator]: 'Создатель'
};

export interface IUser {
	username: string;
	discord_id: string;
	role: EUserRoles;
	points: number;
	servers: Types.Array<string>;
}
