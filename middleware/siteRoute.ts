import { GetServerSidePropsContext } from 'next';
import { PageMiddleware } from '@/middleware/interfaces';

export const getSiteFetch = (context: GetServerSidePropsContext) => {
	const proto = context.req.headers['x-forwarded-proto'] ? context.req.headers['x-forwarded-proto'] : 'http';
	const siteBase = `${ proto }://${ context.req.headers.host }`;

	return async <T>(url: RequestInfo | URL, init?: RequestInit): Promise<T> => {
		return fetch(`${ siteBase }${ url }`, init ?? {}).then(res => res.json() as T);
	};
};

export interface SitePageContextExtension {
	siteFetch: <T>(url: RequestInfo | URL, init?: RequestInit) => Promise<T>;
}

export const siteRoute: PageMiddleware<SitePageContextExtension> = (getServerSideProps) => {
	return async (context) => {
		context.siteFetch = getSiteFetch(context);

		return getServerSideProps(context);
	};
};
