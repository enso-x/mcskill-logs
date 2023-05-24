import NextAuth, { AuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';

import { createDBConnection } from '@/middleware/mongodb';
import { serializeUser } from '@/middleware/protectedRoute';
import validateEnv from '@/helpers/validateEnv';
import { User } from '@/models/User';

export const authOptions: AuthOptions = {
	providers: [
		DiscordProvider({
			clientId: validateEnv('CLIENT_ID'),
			clientSecret: validateEnv('CLIENT_SECRET'),
		}),
	],
	session: {
		strategy: 'jwt',
	},
	callbacks: {
		async session({ session, token }) {
			if (session.user && token.sub) {
				await createDBConnection();
				let [ user ] = await User.find({
					discord_id: token.sub
				}).exec();

				session.discord = token;
				session.user = serializeUser(user);
			}

			return session;
		}
	},
	secret: validateEnv('NEXT_PUBLIC_SECRET'),
};

export default NextAuth(authOptions);