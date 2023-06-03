import { NextApiRequest, NextApiResponse } from 'next';

import connectDB from '@/middleware/mongodb';
import { IVacation } from '@/interfaces/Vacation';
import { Vacation } from '@/models/Vacation';

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<IVacation[] | []>
) => {
	if (req.method === 'POST') {
		try {
			if (!req.body.username || !req.body.from || !req.body.to) {
				return res.status(500).send([]);
			}

			const newVacation = new Vacation(req.body);
			const result = await newVacation.save();

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