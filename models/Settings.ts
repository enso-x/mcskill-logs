import { createModel } from '@/middleware/mongodb';

export interface ISettings {
	onlinePerWeek: string;
	pointsPerWeekForTrainee: number;
	pointsPerWeekForHelper: number;
	pointsPerWeekForModerator: number;
	overtimeMultiplier: number;
	lastWeek: number;
}

export const Settings = createModel<ISettings>('Settings', {
	onlinePerWeek: {
		type: String,
		default: '21:00:00'
	},
	pointsPerWeekForTrainee: {
		type: Number,
		default: 50
	},
	pointsPerWeekForHelper: {
		type: Number,
		default: 70
	},
	pointsPerWeekForModerator: {
		type: Number,
		default: 100
	},
	overtimeMultiplier: {
		type: Number,
		default: 1.1
	},
	lastWeek: {
		type: Number,
		default: 0
	}
});
