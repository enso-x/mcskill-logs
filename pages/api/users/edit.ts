import { NextApiRequest, NextApiResponse } from 'next';

import connectDB from '@/middleware/mongodb';
import { IUser } from '@/interfaces/User';
import { User } from '@/models/User';

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<IUser[] | []>
) => {
	if (req.method === 'POST') {
		try {
			const [ alreadyHaveUser ] = await User.find({ discord_id: req.body.discord_id }).exec();
			if (alreadyHaveUser) {
				alreadyHaveUser.set(req.body);
				const result = await alreadyHaveUser.save();
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