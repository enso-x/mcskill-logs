import { NextApiRequest, NextApiResponse } from 'next';

import connectDB, { getIDsFromString } from '@/middleware/mongodb';
import { IPunishment, Punishment } from '@/models/Punishment';

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<IPunishment[] | []>
) => {
	if (req.method === 'GET') {
		try {
			const reason = req.query.reason as string;
			if (!reason) {
				return res.status(200).send([]);
			}
			const results = await Punishment.find({ reason: new RegExp(reason, 'i') }).sort({ timestamp: -1 }).exec();
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