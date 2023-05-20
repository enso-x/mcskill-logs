import NextAuth from "next-auth"

import { IUser } from '@/interfaces/User';
import { JWT } from 'next-auth/jwt';

declare module "next-auth" {
	/**
	 * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
	 */
	interface Session {
		discord: JWT;
		user: IUser;
	}
}
