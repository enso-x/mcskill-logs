import mongoose from 'mongoose';
import { NextApiRequest, NextApiResponse } from 'next';

import validateEnv from '@/helpers/validateEnv';

const URL = validateEnv('MONGODB_URL');
const USER = validateEnv('MONGODB_USER');
const PASSWORD = validateEnv('MONGODB_PASSWORD');

const connectDB = (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) => async (req: NextApiRequest, res: NextApiResponse) => {
	if (mongoose.connections[0].readyState) {
		// Use current db connection
		return handler(req, res);
	}
	// Use new db connection
	await mongoose.connect(URL, {
		authSource: 'admin',
		user: USER,
		pass: PASSWORD
	});
	return handler(req, res);
};

export default connectDB;

export const config = {
	runtime: 'nodejs'
};
