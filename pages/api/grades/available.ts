// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs';

type ResponseFile = {
	name: string;
	fileName: string;
};

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<ResponseFile[]>
) => {
	if (!req.body || !req.body.password || req.body.password !== '3dq6uW89a_') {
		res.status(401).json([]);
	}

	const files = fs.readdirSync(process.cwd() + '/data/grades');
	const result: ResponseFile[] = [];

	for (let file of files) {
		const response = JSON.parse(fs.readFileSync(`data/grades/${file}`).toString());
		result.push({
			name: response.name,
			fileName: file
		});
	}

	res.status(200).json(result);
};

export default handler;

export const config = {
	runtime: 'nodejs'
};