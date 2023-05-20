import { createModel } from '@/middleware/mongodb';

export const getWeekNumber = (): number => {
	const today: Date = new Date();
	const firstDayOfYear: Date = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
	const pastDaysOfYear: number = (today.valueOf() - firstDayOfYear.valueOf()) / 86_400_000;

	return Math.ceil((pastDaysOfYear - 1) / 7);
};

export interface IPunishment {
	server: string;
	type: string;
	author: string;
	player: string;
	reason: string;
	comment?: string;
	timestamp?: Date;
	week?: number;
}

export const Punishment = createModel<IPunishment>('Punishment', {
	server: {
		type: String,
		required: true
	},
	type: {
		type: String,
		required: true
	},
	author: {
		type: String,
		required: true
	},
	player: {
		type: String,
		required: true
	},
	reason: {
		type: String,
		required: true
	},
	comment: {
		type: String,
		default: ''
	},
	timestamp: { type: Date, default: Date.now },
	week: { type: Number, default: getWeekNumber }
});
