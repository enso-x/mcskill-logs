import { NextApiRequest, NextApiResponse } from 'next';

import connectDB, { getIDsFromString } from '@/middleware/mongodb';
import { IUser } from '@/interfaces/User';
import { User } from '@/models/User';

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<IUser[] | []>
) => {
	if (req.method === 'GET') {
		try {
			const ids = req.query.ids as string;
			if (!ids) {
				return res.status(200).send([]);
			}
			const results = await User.find({ servers: { $all: ids.split(',') } }).exec();
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