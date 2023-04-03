import { timePattern, namePattern, worldPattern } from './patterns.js';
import { basicPaginator, wrappedLine, basicTextFilter } from './utilities.js';

const deathLogs = {
	name: 'death',
	variants: [
		{
			tester: new RegExp(`${timePattern()}${worldPattern()} - ${namePattern()} (?:.*)(?:\\n\\s{4}- .*x?\\d*)+`, 'i'),
			parser: new RegExp(`${timePattern('time')}${worldPattern()} - ${namePattern('playerName')} (?<reason>.+)`, 'i'),
			filter: (text, filter, date) => {
				return basicTextFilter(text, filter, date).reduce((acc, arr) => {
					const [ next ] = arr;
					if (next.startsWith('[')) {
						acc.push([ arr ]);
					}
					if (next.startsWith(' ')) {
						const death = acc.at(-1);
						death.push(arr);
					}
					return acc;
				}, []);
			},
			paginate: basicPaginator,
			parse(data) {
				return data.map((deathArray) => {
					const parsedData = {
						death: null,
						items: []
					};

					for (let subArr of deathArray) {
						const [ line, date ] = subArr;
						if (line.startsWith('[')) {
							const parsedLine = this.parser.exec(line).groups;
							parsedData.death = {
								...parsedLine,
								original: line,
								date: parsedLine.date ?? date
							};
						}
						if (line.startsWith(' ')) {
							const expReg = /Experience: (?<exp>\d+)/i;
							const itemReg = /(?<itemName>[A-Z_\:0-9]+) \((?<itemID>[\:0-9]+)\) x(?<amount>\d+)/i;
							const itemLine = line.trim().slice(2);

							if (expReg.test(itemLine)) {
								const { exp } = expReg.exec(itemLine).groups;
								parsedData.items.push({
									type: 'exp',
									amount: exp,
									original: line
								});
							}
							if (itemReg.test(itemLine)) {
								const { itemName, itemID, amount } = itemReg.exec(itemLine).groups;
								parsedData.items.push({
									type: 'item',
									itemID,
									itemName,
									amount,
									original: line
								});
							}
						}
					}

					return parsedData;
				});
			},
			async lineTemplate(item, processPlayerName, processTextPart, processTextStyles) {
				const { death, items } = item;
				const { world, x, y, z } = death;
				const processedPlayerName = processPlayerName(death.playerName);

				const giveCommands = [];

				return wrappedLine(`
					${ world ? `<span>Мир: <span class="world" onclick="navigator.clipboard.writeText(\`[name:'${ world }', x:${ x }, y:${ y }, z:${ z }]\`)">${ world }</span> <span class="coordinates">{ x: <span class="x">${ x }</span>,y:  <span class="y">${ y }</span>, z: <span class="z">${ z }</span> }</span></span>` : '' }
					<div>
						${ death.date ? `<span class="time">[<span>${ death.date.replaceAll('-', '.') }</span>]</span>` : '' }
		                <span class="time">[<span>${ death.time }</span>]</span>
		                <span class="player-name">${ processedPlayerName }</span>
		                <span>${ death.reason }</span>
	                </div>
	                <div class="inventory">
						${ items.reduce((itemsTemplate, itemData) => {
							const command = itemData.type === 'exp' ? `/xp ${ itemData.amount } ${ death.playerName }` : `/give ${ death.playerName } ${ itemData.itemName } ${ itemData.amount }`;
							giveCommands.push(command);
							itemsTemplate += `<span class="inventory__item" title="${ itemData.itemName || 'Experience' }" onclick="navigator.clipboard.writeText('${ command }');"><img src="${ itemData.type === 'exp' ? '/exp-icon.png' : '/unknown-icon.png' }" alt="${ itemData.type === 'exp' ? 'Experience' : 'Unknown' } item"><span class="amount">${ itemData.amount }</span></span>`;
							return itemsTemplate;
						}, '') }
						<div class="inventory__copy-all" title="Export ${death.playerName} inventory give commands" onclick="navigator.clipboard.writeText('${ giveCommands.join('\\n') }');"></div>
						<div class="inventory__copy-all-to-player" title="Export ${death.playerName} inventory give commands" onclick="this.nextElementSibling.style.display = 'block';"></div>
						<div class="inventory__copy-all-to-player-input">
							<input type="text" placeholder="Player name"/>
							<button onclick="navigator.clipboard.writeText('${ giveCommands.join('\\n') }'.replaceAll('${ death.playerName }', this.previousElementSibling.value || '${ death.playerName }'));this.previousElementSibling.value = '';this.parentNode.style.display = 'none';">Copy</button>
						</div>
					</div>
	            `, death.original, true);
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

export default deathLogs;
