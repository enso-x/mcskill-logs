import { Types } from 'mongoose';

export interface IServerSettings {
	server: string;
	onlinePerWeek: string;
	pointsPerWeekForTrainee: number;
	pointsPerWeekForHelper: number;
	pointsPerWeekForModerator: number;
	overtimeMultiplier: number;
}

export interface ISettings {
	servers: Types.Array<IServerSettings>;
	lastWeek: number;
}
