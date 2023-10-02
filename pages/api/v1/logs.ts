// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';

const ERROR_RESPONSE: string = '';

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<{ date: string, text: string }>
) => {
	if (!req.body || !req.body) {
		res.status(404).write(ERROR_RESPONSE);
	}

	const { urlBase, date } = req.body;

	try {
		const response = await fetch(`${ urlBase }${ date }.txt`, {
			headers: {
				accept: req.headers['accept'] ?? '',
				referer: req.headers['referer'] ?? '',
				'user-agent': req.headers['user-agent'] ?? '',
				cookie: req.headers['cookie'] ?? ''
			}
		});

		let result;

		if (response.status === 200) {
			const text = await response.text();
			result = {
				date: date as string,
				text: text as string
			};
		} else {
			result = {
				date: date as string,
				text: ''
			};
		}

		res.status(200).json(result);
	} catch(e) {
		console.log(e);
	}
};

export default handler;

export const config = {
	runtime: 'nodejs'
};
