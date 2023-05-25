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

			if (!req.body.username || !req.body.discord_id || !req.body.roles || alreadyHaveUser) {
				return res.status(500).send([]);
			}
			const newUser = new User(req.body);
			const result = await newUser.save();
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