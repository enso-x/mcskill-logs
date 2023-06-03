import { createModel } from '@/middleware/mongodb';
import { IVacation } from '@/interfaces/Vacation';

export const Vacation = createModel<IVacation>('Vacation', {
	username: {
		type: String,
		required: true
	},
	from: {
		type: Date,
		required: true
	},
	to: {
		type: Date,
		required: true
	},
	timestamp: {
		type: Date,
		default: Date.now
	}
});
