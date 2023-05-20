import { createModel } from '@/middleware/mongodb';
import { IUser } from '@/interfaces/User';

export const User = createModel<IUser>('User', {
	username: {
		type: String,
		required: true
	},
	discord_id: {
		type: String,
		required: true
	},
	role: {
		type: Number,
		required: true
	},
	points: {
		type: Number,
		default: 0
	},
	servers: [String]
});
