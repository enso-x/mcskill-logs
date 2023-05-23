import { createModel } from '@/middleware/mongodb';

export interface ISettings {
	onlinePerWeek: string;
	pointsPerWeek: number;
	overtimeMultiplier: number;
	lastWeek: number;
}

export const Settings = createModel<ISettings>('Settings', {
	onlinePerWeek: {
		type: String,
		default: '21:00:00'
	},
	pointsPerWeek: {
		type: Number,
		default: 15
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
