import { ParsedUrlQuery } from 'querystring';
import { GetServerSidePropsContext, GetServerSidePropsResult, PreviewData } from 'next/types';

export type GetServerSidePropsContextWithExtensions<
	C extends { [key: string]: any } = { [key: string]: any },
	Q extends ParsedUrlQuery = ParsedUrlQuery,
	D extends PreviewData = PreviewData,
> = GetServerSidePropsContext<Q, D> & C;

export type GetServerSidePropsWithExtendedContext<
	P extends { [key: string]: any } = { [key: string]: any },
	C extends { [key: string]: any } = { [key: string]: any },
	Q extends ParsedUrlQuery = ParsedUrlQuery,
	D extends PreviewData = PreviewData
	> = (
	context: GetServerSidePropsContextWithExtensions<C, Q, D>
) => Promise<GetServerSidePropsResult<P>>

export type PageMiddleware<
	C extends { [key: string]: any } = { [key: string]: any },
> = <
	P extends { [key: string]: any } = { [key: string]: any },
	Q extends ParsedUrlQuery = ParsedUrlQuery,
	D extends PreviewData = PreviewData
>(
	getServerSideProps: GetServerSidePropsWithExtendedContext<P, C, Q, D>,
	redirectUrl?: string
) => GetServerSidePropsWithExtendedContext<P, C, Q, D>;
