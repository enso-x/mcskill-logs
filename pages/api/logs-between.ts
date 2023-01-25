// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';

const ERROR_RESPONSE: string = '';

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<{ date: string, text: string }[]>
) => {
	if (!req.body || !req.body) {
		res.status(404).write(ERROR_RESPONSE);
	}

	const { urlBase, dates } = req.body;

	const requests = dates.map(async (date: string) => ({date: date, response: await fetch(`${urlBase}${date}.txt`)}));

	const result = [];

	for await (let request of requests) {
		if (request.response.status === 200) {
			const text = await request.response.text();
			result.push({
				date: request.date as string,
				text: text as string
			});
		} else {
			result.push({
				date: request.date as string,
				text: ''
			});
		}
	}

	res.status(200).json(result);
};

export default handler;

export const config = {
	runtime: 'nodejs'
};
