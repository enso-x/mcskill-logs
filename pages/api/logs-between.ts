// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { Server as HTTPServer } from 'http';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Socket as NetSocket } from 'net';
import { Server as IOServer } from 'socket.io';
import { NextResponse } from 'next/server';

interface SocketServer extends HTTPServer {
	io?: IOServer | undefined
}

interface SocketWithIO extends NetSocket {
	server: SocketServer
}

interface NextApiResponseWithSocket extends NextApiResponse {
	socket: SocketWithIO
}

const handler = async (
	req: NextApiRequest,
	res: NextApiResponseWithSocket
) => {
	if (res.socket?.server?.io) {
		console.log('Socket is already running')
	} else {
		console.log('Socket is initializing');
		const io = new IOServer(res.socket.server);

		io.on('connection', socket => {
			socket.on('get-logs-between-days', async (msg) => {
				const { urlBase, dates } = JSON.parse(msg);

				const requests = dates.map(async (date: string) => ({
					date: date,
					response: await fetch(`${ urlBase }${ date }.txt`)
				}));

				for await (let request of requests) {
					if (request.response.status === 200) {
						const text = await request.response.text();
						socket.emit('logs-between-part', JSON.stringify({
							date: request.date as string,
							text: text as string
						}));
					} else {
						socket.emit('logs-between-part', JSON.stringify({
							date: request.date as string,
							text: ''
						}));
					}
				}

				socket.emit('logs-between-end');
			});
		});

		res.socket.server.io = io;
	}
	res.end();
};

export default handler;

export const config = {
	runtime: 'nodejs',
	api: {
		responseLimit: false,
	},
};
