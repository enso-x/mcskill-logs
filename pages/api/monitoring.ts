// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<any[]>
) => {
	const { result } = await fetch('https://mcskill.net/api/v2/monitoring').then(res => res.json());
	if (result) {
		const version = result.find((item: any) => item.version === '1.12.2');
		if (!version) {
			return res.status(500).json([]);
		}

		const client = version.clients && version.clients.find((client: any) => client.title === 'Pixelmon');
		if (!client) {
			return res.status(500).json([]);
		}

		if (client.servers && client.servers.length) {
			return res.status(200).json(client.servers);
		}
	}

	return res.status(500).json([]);
};

export default handler;

export const config = {
	runtime: 'nodejs'
};
