import { getServerSession, Session } from 'next-auth';

import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { PageMiddleware } from '@/middleware/interfaces';
import { SitePageContextExtension, siteRoute } from '@/middleware/siteRoute';
import { IUser } from '@/interfaces/User';
import { DocumentType } from '@/middleware/mongodb';

interface ProtectedPageContextExtension extends SitePageContextExtension {
	session: Session | null;
}

export const serializeUser = (user: DocumentType<IUser>): IUser => {
	return JSON.parse(JSON.stringify(user));
};

export const protectedRoute: PageMiddleware<ProtectedPageContextExtension> = (getServerSideProps) => {
	return async (context) => {
		const session = await getServerSession<any, Session>(context.req as any, context.res as any, authOptions as any);

		// if (!session) {
		// 	return {
		// 		redirect: {
		// 			destination: '/login',
		// 			permanent: false,
		// 		}
		// 	};
		// }

		context.session = session;

		return siteRoute(getServerSideProps)(context);
	};
};





