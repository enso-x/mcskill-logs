// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';

export type TMessage = {
	id: string;
	original: string;
	parsedData?: {
		time?: string;
		playerName?: string;
		command?: string;
		chatType?: string;
		messageContent?: string;
		isWorldChat?: boolean;
		isPlayerChat?: boolean;
		isCommand?: boolean;
	};
}

interface IRequestBody {
	url: string;
	count: number;
	page: number;
}

export interface IPaginationData {
	currentPage: number;
	pageCount: number;
	perPage: number;
}

interface IResponse {
	messages: TMessage[];
	pagination: IPaginationData;
}

const ERROR_RESPONSE: IResponse = {
	messages: [],
	pagination: {
		currentPage: 0,
		pageCount: 0,
		perPage: 0
	}
};

export const parseMessages = async (data: IRequestBody): Promise<IResponse> => {
	try {
		const response = await fetch(data.url);
		const text = await response.text();
		const lines = text.split('\n').filter(Boolean);
		const pageCount = Math.ceil(lines.length / data.count);
		const rangeFrom = (lines.length - data.count * (data.page + 1));
		const rangeTo = (lines.length - data.count * data.page);
		const rawMessages = lines.slice(rangeFrom <= 0 ? 0 : rangeFrom, rangeTo);
		const messages: TMessage[] = [];

		rawMessages.forEach(rawMessage => {
			if (rawMessage.includes('issued')) {
				const executedContent = (/(?:\[(?<time>(\d{2}:\d{2}(?::\d{2})?))]\s)?(?<playerName>[A-Za-z0-9_]{3,}) issued server command: (?<command>\/.*)/gi).exec(rawMessage);
				if (!executedContent || !executedContent.groups) {
					messages.push({
						id: uuidv4(),
						original: rawMessage
					});
					return;
				}
				const {
					time,
					playerName,
					command
				} = executedContent.groups;
				messages.push({
					id: uuidv4(),
					original: rawMessage,
					parsedData: {
						time,
						playerName,
						command,
						isCommand: true
					}
				})
				return;
			} else {
				const executedContent = (/(?:\[(?<time>(\d{2}:\d{2}(?::\d{2})?))]\s)?(?:\[(?<chatType>[GL])]\s)?(?:(?<playerName>[A-Za-z0-9_]{3,})(?<playerChat>:)?\s)?(?<worldChat>!)?(?<messageContent>.*)/gi).exec(rawMessage);
				if (!executedContent || !executedContent.groups) {
					messages.push({
						id: uuidv4(),
						original: rawMessage
					});
					return;
				}
				const {
					time,
					chatType,
					playerName,
					playerChat,
					worldChat,
					messageContent
				} = executedContent.groups;
				messages.push({
					id: uuidv4(),
					original: rawMessage,
					parsedData: {
						time,
						playerName,
						chatType,
						isPlayerChat: playerChat ? playerChat.length > 0 : false,
						isWorldChat: worldChat ? worldChat.length > 0 : false,
						messageContent
					}
				});
				return;
			}
		});

		messages.reverse();

		return {
			messages,
			pagination: {
				currentPage: data.page,
				pageCount: pageCount,
				perPage: data.count
			}
		};
	} catch(e) {
		console.error(e);
		return ERROR_RESPONSE;
	}
};

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<IResponse>
) => {
	if (!req.body) {
		res.status(404).json(ERROR_RESPONSE);
	}

	const data: IRequestBody = JSON.parse(req.body);

	res.status(200).json(await parseMessages(data));
};

export default handler;
