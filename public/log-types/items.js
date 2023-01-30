import { timePattern, namePattern, worldPattern } from './patterns.js';
import { basicPaginator, wrappedLine, basicTextFilter, basicParse } from './utilities.js';

const itemsLogs = {
	name: 'items',
	variants: [
		{
			tester: new RegExp(`${timePattern()}${worldPattern()} ${namePattern()} (?:(?:drop)|(?:pickup)): (?:.*)\\n?`, 'i'),
			parser: new RegExp(`${timePattern('time')}${worldPattern()} ${namePattern('playerName')} (?<actionType>(?:drop)|(?:pickup)): (?<item>.*)\\n?`, 'i'),
			filter: basicTextFilter,
			paginate: basicPaginator,
			parse(data) {
				return basicParse(this)(data);
			},
			async lineTemplate(itemData, processPlayerName, processTextPart, processTextStyles) {
				const { date, time, world, x, y, z, playerName, actionType, item, original } = itemData;
				const processedPlayerName = processPlayerName(playerName);

				return wrappedLine(`
					${ world ? `<span>Мир: <span class="world" onclick="navigator.clipboard.writeText(\`[name:'${ world }', x:${ x }, y:${ y }, z:${ z }]\`)">${ world }</span> <span class="coordinates">{ x: <span class="x">${ x }</span>,y:  <span class="y">${ y }</span>, z: <span class="z">${ z }</span> }</span></span>` : '' }
					<div>
						${ date ? `<span class="time">[<span>${ date.replaceAll('-', '.') }</span>]</span>` : '' }
		                <span class="time">[<span>${ time }</span>]</span>
		                <span class="player-name">${ processedPlayerName }</span>
		                <span>${ actionType }</span>
		                <span>${ item }</span>
	                </div>
	            `, original, true);
			},
			async template(data, processPlayerName, processTextPart, processTextStyles) {
				let template = '';
				for (let item of data) {
					template += await this.lineTemplate(item, processPlayerName, processTextPart, processTextStyles);
				}
				return template;
			}
		},
		{
			tester: /(?:\[(?:\d{4}\.\d{2}\.\d{2})\s(?:\d{2}-\d{2}-\d{2})]\s?)?(?:\((?:[А-Яа-яЁё]+)\)\s?)?(?:(?:.+)\s)(?:x(?:\d+)\s?)(?:\((?:[0-9:]+)\),\s?)(?:(?:\w+),\s?)(?:x=(?:[0-9-]+),)(?:y=(?:[0-9-]+),)(?:z=(?:[0-9-]+))/i,
			parser: /(?:\[(?<date>\d{4}\.\d{2}\.\d{2})\s(?<time>\d{2}-\d{2}-\d{2})]\s?)?(?:\((?<actionType>[А-Яа-яЁё]+)\)\s?)?(?:(?<item>.+)\s)(?:x(?<itemCount>\d+)\s?)(?:\((?<itemId>[0-9:]+)\),\s?)(?:(?<world>\w+),\s?)(?:x=(?<x>[0-9-]+),)(?:y=(?<y>[0-9-]+),)(?:z=(?<z>[0-9-]+))/i,
			filter: basicTextFilter,
			paginate: basicPaginator,
			parse(data) {
				return basicParse(this)(data);
			},
			async lineTemplate(itemData, processPlayerName, processTextPart, processTextStyles) {
				const { date, time, world, x, y, z, actionType, item, itemCount, itemId, original } = itemData;

				return wrappedLine(`
					${ world ? `<span>Мир: <span class="world" onclick="navigator.clipboard.writeText(\`[name:'${ world }', x:${ x }, y:${ y }, z:${ z }]\`)">${ world }</span> <span class="coordinates">{ x: <span class="x">${ x }</span>,y:  <span class="y">${ y }</span>, z: <span class="z">${ z }</span> }</span></span>` : '' }
					<div>
						${ date ? `<span class="time">[<span>${ date.replaceAll('-', '.') }</span>]</span>` : '' }
		                <span class="time">[<span>${ time }</span>]</span>
		                <span>${ actionType }</span>
		                <span>${ item }</span>
		                <span>x${ itemCount }</span>
		                <span>(${ itemId })</span>
	                </div>
	            `, original, true);
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

export default itemsLogs;
