import { NextApiRequest, NextApiResponse } from 'next';
import { parse, serialize } from 'cookie';
import { sign } from 'jsonwebtoken';
import { config } from '@/config/discord';
import { DiscordUser } from '@/types/DiscordUser';

const scope = [ 'identify' ].join(' ');
const REDIRECT_URI = `${ config.appUri }/api/oauth`;

const OAUTH_QS = new URLSearchParams({
	client_id: config.clientId,
	redirect_uri: REDIRECT_URI,
	response_type: 'code',
	scope,
}).toString();

const OAUTH_URI = `https://discord.com/api/oauth2/authorize?${ OAUTH_QS }`;

export default async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== 'GET') return res.redirect('/');

	const { code = null, error = null, redirect = '/' } = req.query;

	if (redirect) {
		res.setHeader(
			'Set-Cookie',
			serialize('redirect-uri', `${redirect}`, {
				httpOnly: true,
				secure: process.env.NODE_ENV !== 'development',
				sameSite: 'lax',
				path: '/',
			})
		);
	}

	if (error) {
		return res.redirect(`${redirect}?error=${ req.query.error }`);
	}

	if (!code || typeof code !== 'string') return res.redirect(OAUTH_URI);

	const body = new URLSearchParams({
		client_id: config.clientId,
		client_secret: config.clientSecret,
		grant_type: 'authorization_code',
		redirect_uri: `${REDIRECT_URI}`,
		code,
		scope,
	}).toString();

	const { access_token = null, token_type = 'Bearer' } = await fetch('https://discord.com/api/oauth2/token', {
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		method: 'POST',
		body,
	}).then((res) => res.json());

	if (!access_token || typeof access_token !== 'string') {
		return res.redirect(OAUTH_URI);
	}

	const me: DiscordUser | { unauthorized: true } = await fetch('https://discord.com/api/users/@me', {
		headers: { "Authorization": `${ token_type } ${ access_token }` }
	}).then((res) => res.json());

	if (!('id' in me)) {
		return res.redirect(OAUTH_URI);
	}

	const token = sign(me, config.jwtSecret, { expiresIn: '24h' });

	const serializedCookies = [
		serialize(config.cookieName, token, {
			httpOnly: true,
			secure: process.env.NODE_ENV !== 'development',
			sameSite: 'lax',
			path: '/',
		})
	];

	let redirectUri;

	if (req.headers.cookie && token) {
		redirectUri = parse(req.headers.cookie as string)['redirect-uri'];

		if (redirectUri) {
			serializedCookies.push(serialize('redirect-uri', '', {
				httpOnly: true,
				secure: process.env.NODE_ENV !== 'development',
				sameSite: 'lax',
				maxAge: -1,
				path: '/',
			}));
		}
	}

	res.setHeader(
		'Set-Cookie',
		serializedCookies
	);

	res.redirect(redirectUri || '/');
};
