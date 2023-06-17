import { NextApiRequest, NextApiResponse } from 'next';

import connectDB, { getObjectIDsFromString } from '@/middleware/mongodb';
import { IUser } from '@/interfaces/User';
import { User } from '@/models/User';

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<IUser[] | []>
) => {
	if (req.method === 'POST') {
		try {
			const { id, ...userRest } = req.body;
			const [ alreadyHaveUser ] = await User.find({ _id: getObjectIDsFromString(id) }).exec(); // Если редактируем discord_id мы не сможем найти по нему пользователя, надо редактировать по ID
			if (alreadyHaveUser) {
				alreadyHaveUser.set(userRest);
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