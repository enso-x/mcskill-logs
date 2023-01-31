// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs';

const ERROR_RESPONSE: string = '';

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<{ date: string, text: string }>
) => {
	if (!req.body || !req.body.file || !req.body.password || req.body.password !== '3dq6uW89a_') {
		res.status(404).write(ERROR_RESPONSE);
	}

	const { file } = req.body;

	console.log(req.body);

	const response = JSON.parse(fs.readFileSync(`./data/grades/${file}`).toString());

	console.log(response);

	res.status(200).json(response);
};

export default handler;

export const config = {
	runtime: 'nodejs'
};
