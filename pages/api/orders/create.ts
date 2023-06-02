import { NextApiRequest, NextApiResponse } from 'next';

import connectDB from '@/middleware/mongodb';
import { IOrder } from '@/interfaces/Order';
import { Order } from '@/models/Order';

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<IOrder[] | []>
) => {
	if (req.method === 'POST') {
		try {
			if (!req.body.username || !req.body.server || !req.body.item || !req.body.count || !req.body.price || !req.body.type || !req.body.image) {
				return res.status(500).send([]);
			}

			const newOrder = new Order(req.body);
			const result = await newOrder.save();

			return res.status(200).send([ result ]);
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