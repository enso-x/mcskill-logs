// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs';

type ResponseFile = {
	name: string;
	index: number;
	fileName: string;
};

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<ResponseFile[]>
) => {
	const files = fs.readdirSync(process.cwd() + '/data/grades');
	const result: ResponseFile[] = [];

	for (let file of files) {
		const response = JSON.parse(fs.readFileSync(`data/grades/${file}`).toString());
		result.push({
			name: response.name,
			index: response.index,
			fileName: file
		});
	}

	result.sort((f1, f2) => f1.index >= f2.index ? 1 : -1);

	res.status(200).json(result);
};

export default handler;

export const config = {
	runtime: 'nodejs'
};
