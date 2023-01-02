// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';

const ERROR_RESPONSE: string = '';

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<string>
) => {
	if (!req.query || !req.query.url) {
		res.status(404).write(ERROR_RESPONSE);
	}

	const response = await fetch(req.query.url as string);
	const text = await response.text();

	res.status(200).send(text);
};

export default handler;
