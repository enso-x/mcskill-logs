import { NextApiRequest, NextApiResponse } from 'next';
import { Types } from 'mongoose';

import connectDB from '@/middleware/mongodb';
import { IPunishment, Punishment } from '@/models/Punishment';

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<IPunishment[] | []>
) => {
	if (req.method === 'POST') {
		const params: any = {};
		if (req.body) {
			if (req.body.server && req.body.server.length) {
				params.server = req.body.server.split(',');
			}
			if (req.body.author && req.body.author.length) {
				params.author = req.body.author.split(',');
			}
			if (req.body.player && req.body.player.length) {
				params.player = new RegExp(req.body.player, 'i');
			}
			if (req.body.type && req.body.type.length) {
				params.type = req.body.type.split(',');
			}
			if (req.body.reason && req.body.reason.length) {
				params.reason = req.body.reason.split(',').map((part: any) => new RegExp(part, 'i'));
			}
			if (req.body.range && req.body.range.length && req.body.range[0] && req.body.range[1]) {
				params.timestamp = {
					$gte: new Date(req.body.range[0]),
					$lte: new Date(req.body.range[1])
				}
			}
		}
		try {
			const results = await Punishment.find(params).sort({ timestamp: -1 }).exec();
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