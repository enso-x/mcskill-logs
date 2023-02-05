import { GetServerSidePropsContext } from 'next';
import { parse } from 'cookie';
import { verify } from 'jsonwebtoken';

import { PageMiddleware } from '@/middleware/interfaces';
import { DiscordUser } from '@/types/DiscordUser';
import { config as discordConfig } from '@/config/discord';
import allowedUsers from '@/data/protection/allowed';

const parseUser = (ctx: GetServerSidePropsContext): DiscordUser | null => {
	if (!ctx.req.headers.cookie) {
		return null;
	}

	const token = parse(ctx.req.headers.cookie)[discordConfig.cookieName];

	if (!token) {
		return null;
	}

	try {
		const { iat, exp, ...user } = verify(token, discordConfig.jwtSecret) as DiscordUser & { iat: number; exp: number };
		return user;
	} catch (e) {
		return null;
	}
};

interface ProtectedPageContextExtension {
	user?: DiscordUser;
	token?: string;
}

type ProtectMiddleware = PageMiddleware<ProtectedPageContextExtension>;

const middleware: ProtectMiddleware = (getServerSideProps, redirectUrl = '') => {
	return async (context) => {
		const user = parseUser(context);

		if (!user) {
			return {
				redirect: {
					destination: `/api/oauth${redirectUrl ? `?redirect=${redirectUrl}` : ''}`,
					permanent: false,
				},
			};
		}

		context.user = user;
		context.user.access_is_allowed = allowedUsers.includes(context.user.id);

		return getServerSideProps(context);
	};
};

export default middleware;

export const config = {
	runtime: 'nodejs'
};
