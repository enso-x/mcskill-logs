import { NextApiRequest, NextApiResponse } from 'next';

const userSkinsCache = new Map<string, {
	lastUpdate: Date;
	contentType: string;
	buffer: Buffer;
	timeout: NodeJS.Timeout;
}>();

class FetchError extends Error {
	code: number;
	data: any;
	constructor(response: Response) {
		super(response.statusText);
		this.code = response.status;
		this.data = response;
	}
}

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<Buffer | string>
) => {
	if (req.method === 'GET') {
		try {
			const username = req.query.username as string;
			const mode = req.query.mode as string;
			const skinKey = `${username}-${mode}`;

			if (!username && !mode) {
				return res.status(200).send('');
			}

			const fetchSkin = async (url: string): Promise<[string, Buffer]> => {
				const userSkinResponse = await fetch(url);
				const contentType = userSkinResponse.headers.get("Content-Type") as string;

				if (userSkinResponse.status >= 400) {
					throw new FetchError(userSkinResponse);
				}

				return [contentType, Buffer.from(await userSkinResponse.arrayBuffer())];
			};

			const fallbackSkin = async (): Promise<[string, Buffer]> => {
				try {
					const skinURL = mode === 'full' ? `https://skins.mcskill.net/MinecraftSkins/${ username }.png` : `https://mcskill.net/MineCraft/?name=${ username }&mode=${ mode }`;
					return await fetchSkin(skinURL);
				} catch(e) {
					const skinURL = mode === 'full' ? `https://skins.mcskill.net/MinecraftSkins/default.png` : `https://mcskill.net/MineCraft/?name=default&mode=${ mode }`;
					return await fetchSkin(skinURL);
				}
			};

			const sendSkinData = async () => {
				const [ contentType, buffer ] = await fallbackSkin();
				userSkinsCache.set(skinKey, {
					lastUpdate: new Date(),
					contentType,
					buffer,
					timeout: setTimeout(() => {
						userSkinsCache.delete(skinKey);
					}, 1000 * 60 * 60)
				});

				res.setHeader('Content-Type', contentType);
				return res.status(200).send(buffer);
			};

			if (!userSkinsCache.has(skinKey)) {
				return await sendSkinData();
			}

			const cache = userSkinsCache.get(skinKey)!;

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
