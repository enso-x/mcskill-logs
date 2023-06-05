// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { executablePath } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<any>
) {
	const response = await fetch('https://mcskill.net/mpsl', {
		headers: {
			accept: req.headers['accept'] ?? '',
			referer: req.headers['referer'] ?? '',
			'user-agent': req.headers['user-agent'] ?? '',
			cookie: req.headers['cookie'] ?? ''
		}
	});
	const userAgent = req.headers['user-agent'];

	if (response.status !== 200) {
		const browser = await puppeteer.launch({ headless: "new", executablePath: executablePath() });
		const page = await browser.newPage();
		await page.setUserAgent(userAgent ?? 'Mozilla/5.0 (Windows NT 5.1; rv:5.0) Gecko/20100101 Firefox/5.0');

		await page.goto('https://mcskill.net/mpsl', {
			waitUntil: "load"
		});
		await page.waitForTimeout(5000);

		return res.status(200).send('');
	}

	res.status(200).send('');
}
