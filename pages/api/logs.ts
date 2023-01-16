// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';

const ERROR_RESPONSE: string = '';

const cachedData: Record<string, string> = {};
const runningLoops: Record<string, boolean> = {};
const timeoutIDs: Record<string, NodeJS.Timeout> = {};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const updateLoop = (url: string) => {
	const timeoutKey = `cancel-update-${url}`;
	if (timeoutIDs[timeoutKey]) {
		clearTimeout(timeoutIDs[timeoutKey]);
		delete timeoutIDs[timeoutKey];
	}
	timeoutIDs[timeoutKey] = setTimeout(() => {
		runningLoops[url] = false;
		delete runningLoops[url];
		delete cachedData[url];
		delete timeoutIDs[timeoutKey];
	}, 5 * 1000);
};

const initFetchDataLoop = (url: string) => {
	runningLoops[url] = true;

	const update = async (): Promise<string> => {
		if (runningLoops[url]) {
			const response = await fetch(url);
			cachedData[url] = await response.text();

			await delay(1000);
			update();
		}
		return cachedData[url];
	};

	updateLoop(url);

	return update;
};

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<string>
) => {
	if (!req.query || !req.query.url) {
		res.status(404).write(ERROR_RESPONSE);
	}

	const queryUrl = req.query.url as string;

	if (!cachedData[queryUrl]) {
		const getData = initFetchDataLoop(queryUrl);
		const text = await getData();
		res.status(200).send(text);
	} else {
		updateLoop(queryUrl);
		res.status(200).send(cachedData[queryUrl]);
	}
};

export default handler;

export const config = {
	runtime: 'nodejs'
};
