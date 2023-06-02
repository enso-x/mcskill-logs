// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<any[]>
) => {
	const { result } = await fetch('https://mcskill.net/api/v2/?section=shop&action=get_items&serverid=88&tabid=1').then(res => res.json());

	if (result) {
		return res.status(200).json(result);
	}

	return res.status(500).json([]);
};

export default handler;

export const config = {
	runtime: 'nodejs'
};
