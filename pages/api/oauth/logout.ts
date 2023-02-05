import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import { config } from '@/config/discord';

export default async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== 'GET') return res.redirect('/');

	const { error = null, redirect = '/' } = req.query;

	if (error) {
		return res.redirect(`${redirect}?error=${ req.query.error }`);
	}

	res.setHeader(
		'Set-Cookie',
		serialize(config.cookieName, '', {
			httpOnly: true,
			secure: process.env.NODE_ENV !== 'development',
			sameSite: 'lax',
			maxAge: -1,
			path: '/',
		})
	);

	res.redirect(`${redirect}`);
};
