import { createModel } from '@/middleware/mongodb';
import { ISettings } from '@/interfaces/Settings';

export const Settings = createModel<ISettings>('Settings', {
	servers: [{
		server: {
			type: String,
			required: true
		},
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
			default: 1.25
		},
	}],
	lastWeek: {
		type: Number,
		default: 0
	}
});
