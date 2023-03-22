import validateEnv from '@/helpers/validateEnv';

export const config = {
	cookieName: 'token',
	clientId: validateEnv('CLIENT_ID'),
	clientSecret: validateEnv('CLIENT_SECRET'),
	appUri: validateEnv('APP_URI', 'http://localhost:3000', true),
	jwtSecret: validateEnv(
		'JWT_SECRET',
		'this is a development value that should be changed in production!!!!!',
		true
	),
} as const;
