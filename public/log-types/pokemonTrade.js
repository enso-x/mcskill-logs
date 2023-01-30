import { timePattern, namePattern, pokemonNamePattern } from './patterns.js';
import { basicPaginator, wrappedLine, basicTextFilter, basicParse } from './utilities.js';

const pokemonSpriteCache = [];

const pokemonTradeLogs = {
	name: 'pokemonTrade',
	variants: [
		{
			tester: new RegExp(`${timePattern()} Игрок ${namePattern()} обменял покемона ${pokemonNamePattern()} на покемона ${pokemonNamePattern()} игрока ${namePattern()}`, 'i'),
			parser: new RegExp(`${timePattern('time')} Игрок ${namePattern('playerName1')} обменял покемона ${pokemonNamePattern('pokemonName1')} на покемона ${pokemonNamePattern('pokemonName2')} игрока ${namePattern('playerName2')}`, 'i'),
			filter: basicTextFilter,
			paginate: basicPaginator,
			parse(data) {
				return basicParse(this)(data);
			},
			async lineTemplate(item, processPlayerName, processTextPart, processTextStyles) {
				const { date, time, playerName1, pokemonName1, playerName2, pokemonName2, original } = item;
				const processedPlayerName1 = processPlayerName(playerName1);
				const processedPlayerName2 = processPlayerName(playerName2);

				const tryLoadPokemonSprite = (name) => new Promise(async (res) => {
					const formatted = name.toLowerCase()
						.replaceAll('\'', '')
						.replaceAll('♂', '-m')
						.replaceAll('♀', '-f')
						.replaceAll('.', '')
						.replaceAll(' ', '-')
						.replaceAll('é', 'e');
					if (pokemonSpriteCache[formatted]) {
						res(pokemonSpriteCache[formatted]);
						return;
					}
					try {
						const img = new Image();
						const url1 = `https://img.pokemondb.net/sprites/sword-shield/icon/${ formatted }.png`;
						const url2 = `https://img.pokemondb.net/sprites/scarlet-violet/icon/${ formatted }.png`;
						img.onerror = () => {
							img.src = url2;
						};
						img.onload = () => {
							pokemonSpriteCache[formatted] = img.src;
							res(img.src);
						};
						img.src = url1;
					} catch (e) {
					}
				});

				const pokemon1Image = await tryLoadPokemonSprite(pokemonName1);
				const pokemon2Image = await tryLoadPokemonSprite(pokemonName2);

				return wrappedLine(`
					${ date ? `<span class="time">[<span>${ date.replaceAll('-', '.') }</span>]</span>` : '' }
	                <span class="time">[<span>${ time }</span>]</span>
	                Игрок
	                <span class="player-name">${ processedPlayerName1 }</span>
	                обменял покемона
	                <span style="display: inline-flex;">
	                    <a target="_blank" href="https://pixelmonmod.com/wiki/${ pokemonName1.toLowerCase().replaceAll(/\s(\w)/gi, (...matches) => `_${ matches[1].toUpperCase() }`) }">
	                        <img style="width: 112px; margin: 0 -10px; image-rendering: pixelated;" title="${ pokemonName1 }" src="${ pokemon1Image }" alt="${ pokemonName1 }">
	                    </a>
	                </span>
	                на покемона
	                <span style="display: inline-flex;">
	                    <a target="_blank" href="https://pixelmonmod.com/wiki/${ pokemonName2.toLowerCase().replaceAll(/\s(\w)/gi, (...matches) => `_${ matches[1].toUpperCase() }`) }">
	                        <img style="width: 112px; margin: 0 -10px; image-rendering: pixelated;" title="${ pokemonName2 }" src="${ pokemon2Image }" alt="${ pokemonName2 }">
	                    </a>
	                </span>
	                игрока
	                <span class="player-name">${ processedPlayerName2 }</span>.
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

export default pokemonTradeLogs;
