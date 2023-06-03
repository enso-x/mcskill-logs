import { NextApiRequest, NextApiResponse } from 'next';
import { Types } from 'mongoose';

import connectDB from '@/middleware/mongodb';
import { IVacation } from '@/interfaces/Vacation';
import { Vacation } from '@/models/Vacation';

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<IVacation[] | []>
) => {
	if (req.method === 'POST') {
		try {
			const { id, ...vacationBody } = req.body;
			const [ vacation ] = await Vacation.find({ _id: new Types.ObjectId(id) }).exec();
			if (vacation) {
				vacation.set(vacationBody);
				const result = await vacation.save();
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