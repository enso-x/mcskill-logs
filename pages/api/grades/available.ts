// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs';
import allowedUsers from '@/data/protection/allowed';

type ResponseFile = {
	name: string;
	fileName: string;
};

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<ResponseFile[]>
) => {
	if (!req.body || !req.body.userId || !allowedUsers.includes(req.body.userId)) {
		return res.status(401).json([]);
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
