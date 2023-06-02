import { createModel } from '@/middleware/mongodb';
import { IOrder, EOrderStatus } from '@/interfaces/Order';

export const Order = createModel<IOrder>('Order', {
	username: {
		type: String,
		required: true
	},
	server: {
		type: String,
		required: true
	},
	item: {
		type: String,
		required: true
	},
	image: {
		type: String,
		required: true
	},
	count: {
		type: Number,
		required: true
	},
	price: {
		type: Number,
		required: true
	},
	type: {
		type: String,
		required: true
	},
	status: {
		type: String,
		default: EOrderStatus.created
	},
	timestamp: {
		type: Date,
		default: Date.now
	}
});
