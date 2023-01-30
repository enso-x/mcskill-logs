import chat from './chat.js';
import death from './death.js';
import items from './items.js';
import legendarySpawn from './legendarySpawn.js';
import pokemonTrade from './pokemonTrade.js';
import connection from './connection.js';

export const LOG_TYPES = [
	death,
	items,
	legendarySpawn,
	pokemonTrade,
	connection,
	chat
];

export const detectLogType = (text) => {
	for (let logType of LOG_TYPES) {
		for (let variant of logType.variants) {
			if (variant.tester.test(text)) {
				return [logType.name, variant];
			}
		}
	}
};
