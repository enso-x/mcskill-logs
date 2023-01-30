import { timePattern, namePattern, pokemonNamePattern } from './patterns.js';
import { basicPaginator, wrappedLine, basicTextFilter, basicParse } from './utilities.js';

const legendarySpawnLogs = {
	name: 'legendarySpawn',
	variants: [
		{
			tester: new RegExp(`${timePattern()} ${pokemonNamePattern()} - ${namePattern()}\\n?`, 'i'),
			parser: new RegExp(`${timePattern('time')} ${pokemonNamePattern('pokemonName')} - ${namePattern('playerName')}\\n?`, 'i'),
			filter: basicTextFilter,
			paginate: basicPaginator,
			parse(data) {
				return basicParse(this)(data, (item) => ({
					...item,
					pokemonName: item.pokemonName.replaceAll(/([a-z])([A-Z])/g, (...matches) => `${matches[1]} ${matches[2]}`)
				}));
			},
			async lineTemplate(item, processPlayerName, processTextPart, processTextStyles) {
				const { date, time, pokemonName, playerName, original } = item;
				const processedPlayerName = processPlayerName(playerName);

				return wrappedLine(`
					${date ? `<span class="time">[<span>${ date.replaceAll('-', '.') }</span>]</span>` : ''}
	                <span class="time">[<span>${ time }</span>]</span>
	                <span style="display: inline-flex;">
	                    <a target="_blank" href="https://pixelmonmod.com/wiki/${ pokemonName.toLowerCase().replaceAll(/\s(\w)/gi, (...matches) => `_${matches[1].toUpperCase()}`) }">
	                        <img style="width: 112px; image-rendering: pixelated;" title="${ pokemonName }" src="https://img.pokemondb.net/sprites/sword-shield/icon/${ pokemonName.toLowerCase().replaceAll('\'', '').replaceAll(' ', '-') }.png" alt="${ pokemonName }">
	                    </a>
	                </span>
	                 - 
	                <span class="player-name">${ processedPlayerName }</span>
	            `, original);
			},
			async template(data, processPlayerName, processTextPart, processTextStyles) {
				let template = '';
				for (let item of data) {
					template += await this.lineTemplate(item, processPlayerName, processTextPart, processTextStyles);
				}
				return template;
			}
		}
	]
};

export default legendarySpawnLogs;
