// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'


export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<any>
) {
	const data = await fetch('https://mcskill.net/mpsl/');
	res.status(200).send(await data.text())
}
