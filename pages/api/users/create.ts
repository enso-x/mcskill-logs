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
			const { id, ...userRest } = req.body;
			const [ alreadyHaveUser ] = await User.find({ discord_id: userRest.discord_id }).exec();

			if (!userRest.username || !userRest.discord_id || !userRest.roles || alreadyHaveUser) {
				return res.status(500).send([]);
			}
			const newUser = new User(userRest);
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