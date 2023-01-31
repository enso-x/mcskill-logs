// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs';

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<{name: string; fileName: string;}[]>
) => {
	if (!req.body || !req.body.password || req.body.password !== '3dq6uW89a_') {
		res.status(401).json([]);
	}

	const files = fs.readdirSync('./data/grades');

	res.status(200).json(files.map(file => ({name: file.split('.')[0], fileName: file})));
};

export default handler;

export const config = {
	runtime: 'nodejs'
};
