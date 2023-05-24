export interface IServer {
	id: string;
	label: string;
	description: string;
	value: string;
	logs_url: string;
}

export const SERVERS: Record<string, IServer> = {
	'server1': {
		id: 'pixelmon',
		label: 'Pixelmon 1.12.2 #1',
		description: 'Первый сервер',
		value: 'server1',
		logs_url: 'https://logs7.mcskill.net/Pixelmon1122_Server_logger_public_logs'
	},
	'server2': {
		id: 'pixelmon2',
		label: 'Pixelmon 1.12.2 #2',
		description: 'Второй сервер',
		value: 'server2',
		logs_url: 'https://logs7.mcskill.net/Pixelmon1122_Server2_logger_public_logs'
	},
	'server3': {
		id: 'pixelmon3',
		label: 'Pixelmon 1.12.2 #3',
		description: 'Третий сервер',
		value: 'server3',
		logs_url: 'https://logs7.mcskill.net/Pixelmon1122_Server3_logger_public_logs'
	},
	'server4': {
		id: 'pixelmon4',
		label: 'Pixelmon 1.12.2 #4',
		description: 'Четвертый сервер',
		value: 'server4',
		logs_url: 'https://logs5.mcskill.net/Pixelmon1122_Server4_logger_public_logs'
	},
	'server5': {
		id: 'pixelmon5',
		label: 'Pixelmon 1.12.2 #5',
		description: 'Пятый сервер',
		value: 'server5',
		logs_url: 'https://logs5.mcskill.net/Pixelmon1122_Server5_logger_public_logs'
	}
};
