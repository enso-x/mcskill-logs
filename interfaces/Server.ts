export interface IServer {
	id: string;
	label: string;
	description: string;
	value: string;
	logs_url: string;
	number: number;
	active: boolean;
}

export const SERVERS: Record<string, IServer> = {
	'server1': {
		id: 'pixelmon',
		label: 'Pixelmon #1 1.12.2',
		description: 'Первый сервер',
		value: 'server1',
		logs_url: 'https://logs24.mcskill.net/Pixelmon1122_Server_logger_public_logs',
		number: 1,
		active: true
	},
	'server2': {
		id: 'pixelmon2',
		label: 'Pixelmon #2 1.12.2',
		description: 'Второй сервер',
		value: 'server2',
		logs_url: 'https://logs24.mcskill.net/Pixelmon1122_Server2_logger_public_logs',
		number: 2,
		active: true
	},
	'server3': {
		id: 'pixelmon3',
		label: 'Pixelmon #3 1.12.2',
		description: 'Третий сервер',
		value: 'server3',
		logs_url: 'https://logs24.mcskill.net/Pixelmon1122_Server3_logger_public_logs',
		number: 3,
		active: true
	},
	'server4': {
		id: 'pixelmon4',
		label: 'Pixelmon #4 1.12.2',
		description: 'Четвертый сервер',
		value: 'server4',
		logs_url: 'https://logs5.mcskill.net/Pixelmon1122_Server4_logger_public_logs',
		number: 4,
		active: false
	},
	'server5': {
		id: 'pixelmon5',
		label: 'Pixelmon #5 1.12.2',
		description: 'Пятый сервер',
		value: 'server5',
		logs_url: 'https://logs5.mcskill.net/Pixelmon1122_Server5_logger_public_logs',
		number: 5,
		active: false
	}
};
