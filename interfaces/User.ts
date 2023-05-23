import { Types } from 'mongoose';

export enum EUserRoles {
	player,
	trainee,
	helper,
	moder,
	builder,
	st = 50,
	gm = 55,
	gd = 70,
	curator = 99,
	admin = 500,
	creator = 999
}

export const ROLES: Record<EUserRoles, string> = {
	[EUserRoles.player]: 'Игрок',
	[EUserRoles.trainee]: 'Стажер',
	[EUserRoles.helper]: 'Помощник',
	[EUserRoles.moder]: 'Модератор',
	[EUserRoles.builder]: 'Строитель',
	[EUserRoles.st]: 'Ст. Модератор',
	[EUserRoles.gm]: 'Гл. Модератор',
	[EUserRoles.gd]: 'Гейм Дизайнер',
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
