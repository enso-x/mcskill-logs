import { NextApiRequest, NextApiResponse } from 'next';

import connectDB from '@/middleware/mongodb';
import { ISettings, Settings } from '@/models/Settings';

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<ISettings[] | []>
) => {
	if (req.method === 'POST') {
		try {
			if (req.body) {
				const [ settings ] = await Settings.find().exec();
				settings.set(req.body);
				await settings.save();
				return res.status(200).send([ settings ]);
			}
			return res.status(304).send([]);
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