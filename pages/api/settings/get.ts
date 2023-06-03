import { NextApiRequest, NextApiResponse } from 'next';

import connectDB from '@/middleware/mongodb';
import { ISettings } from '@/interfaces/Settings';
import { Settings } from '@/models/Settings';

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<ISettings[] | []>
) => {
	if (req.method === 'GET') {
		try {
			const results = await Settings.find().exec();
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