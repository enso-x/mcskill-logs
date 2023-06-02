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
			const params: any = {};
			if (req.body) {
				if (req.body.username && req.body.username.length) {
					params.username = new RegExp(req.body.username, 'i');
				}
				if (req.body.server && req.body.server.length) {
					params.server = req.body.server.split(',');
				}
				if (req.body.type && req.body.type.length) {
					params.type = req.body.type.split(',');
				}
				if (req.body.status && req.body.status.length) {
					params.status = req.body.status.split(',');
				}
			}
			const results = await Order.find(params).sort({ timestamp: -1 }).exec();
			return res.status(200).send(results);
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