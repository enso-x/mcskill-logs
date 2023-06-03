import { NextApiRequest, NextApiResponse } from 'next';
import moment from 'moment';

import connectDB from '@/middleware/mongodb';
import { IVacation } from '@/interfaces/Vacation';
import { Vacation } from '@/models/Vacation';

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<IVacation[] | []>
) => {
	if (req.method === 'POST') {
		try {
			const params: any = {};
			if (req.body) {
				if (req.body.username && req.body.username.length) {
					params.username = new RegExp(req.body.username, 'i');
				}
				if (req.body.from && req.body.from.length) {
					const startDate = moment(req.body.from).startOf('day').toDate();
					const endDate = moment(req.body.from).endOf('day').toDate();

					params.from = {
						$gte: startDate,
						$lte: endDate
					};
				}
				if (req.body.to && req.body.to.length) {
					const startDate = moment(req.body.to).startOf('day').toDate();
					const endDate = moment(req.body.to).endOf('day').toDate();

					params.to = {
						$gte: startDate,
						$lte: endDate
					};
				}
			}
			const results = await Vacation.find(params).sort({ timestamp: -1 }).exec();
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