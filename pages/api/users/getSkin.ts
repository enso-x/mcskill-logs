import { NextApiRequest, NextApiResponse } from 'next';

const userSkinsCache = new Map<string, {
	lastUpdate: Date;
	contentType: string;
	buffer: Buffer;
	timeout: NodeJS.Timeout;
}>();

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<Buffer | string>
) => {
	if (req.method === 'GET') {
		try {
			const username = req.query.username as string;
			const mode = req.query.mode as string;

			if (!username && !mode) {
				return res.status(200).send('');
			}

			const fetchSkin = async (): Promise<[string, Buffer]> => {
				const userSkinResponse = await fetch(`https://mcskill.net/MineCraft/?name=${ username }&mode=${ mode }`);
				const contentType = userSkinResponse.headers.get("Content-Type") as string;

				return [contentType, Buffer.from(await userSkinResponse.arrayBuffer())];
			};

			const sendSkinData = async () => {
				const [ contentType, buffer ] = await fetchSkin();
				userSkinsCache.set(username, {
					lastUpdate: new Date(),
					contentType,
					buffer,
					timeout: setTimeout(() => {
						userSkinsCache.delete(username);
					}, 1000 * 60 * 60)
				});

				res.setHeader('Content-Type', contentType);
				return res.status(200).send(buffer);
			};

			if (!userSkinsCache.has(username)) {
				return await sendSkinData();
			}

			const cache = userSkinsCache.get(username)!;

			if ((cache.lastUpdate.getTime() + 1000 * 60 * 60) < new Date().getTime()) {
				clearTimeout(cache.timeout);
				return await sendSkinData();
			}

			res.setHeader('Content-Type', cache.contentType);
			return res.status(200).send(cache.buffer);
		} catch (error) {
			return res.status(500).send('');
		}
	} else {
		res.status(422).send('');
	}
};

export default handler;

export const config = {
	runtime: 'nodejs'
};