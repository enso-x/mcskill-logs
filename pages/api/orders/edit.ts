import { NextApiRequest, NextApiResponse } from 'next';
import { Types } from 'mongoose';

import connectDB from '@/middleware/mongodb';
import { IOrder } from '@/interfaces/Order';
import { Order } from '@/models/Order';

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<IOrder[] | []>
) => {
	if (req.method === 'POST') {
		try {
			const { id, ...orderBody } = req.body;
			const [ order ] = await Order.find({ _id: new Types.ObjectId(id) }).exec();
			if (order) {
				order.set(orderBody);
				const result = await order.save();
				return res.status(200).send([ result ]);
			}
			return res.status(500).send([]);
		} catch (error) {
			return res.status(500).send([]);
		}
	} else {
		res.status(422).send([]);
	}
};

export default connectDB(handler);

export const config = {
	runtime: 'nodejs'
};