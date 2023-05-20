import { ParsedUrlQuery } from 'querystring';
import { GetServerSidePropsContext, GetServerSidePropsResult, PreviewData } from 'next/types';
import { DiscordUser } from '@/types/DiscordUser';
import { IUser } from '@/interfaces/User';

export type GetServerSidePropsWithExtendedContext<
	P extends { [key: string]: any } = { [key: string]: any },
	C extends { [key: string]: any } = { [key: string]: any },
	Q extends ParsedUrlQuery = ParsedUrlQuery,
	D extends PreviewData = PreviewData
> = (
	context: GetServerSidePropsContext<Q, D> & C
) => Promise<GetServerSidePropsResult<P>>

export type PageMiddleware<
	IC extends { [key: string]: any } = { [key: string]: any },
> = <
	C extends { [key: string]: any } = { [key: string]: any },
	P extends { [key: string]: any } = { [key: string]: any },
	Q extends ParsedUrlQuery = ParsedUrlQuery,
	D extends PreviewData = PreviewData
>(
	getServerSideProps: GetServerSidePropsWithExtendedContext<P, IC & C, Q, D>,
	redirectUrl?: string
) => GetServerSidePropsWithExtendedContext<P, IC & C, Q, D>;

export interface Session {
	discord: DiscordUser;
	user: IUser;
}
