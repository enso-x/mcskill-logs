import { timePattern, namePattern } from './patterns.js';
import { basicPaginator, wrappedLine, basicTextFilter, basicParse } from './utilities.js';

const connectionLogs = {
	name: 'connection',
	variants: [
		{
			tester: new RegExp(`${timePattern()} ${namePattern()} (?:(?:logged in)|(?:left the game))\\n?`, 'i'),
			parser: new RegExp(`${timePattern('time')} ${namePattern('playerName')} (?<actionType>(?:logged in)|(?:left the game))\\n?`, 'i'),
			filter: basicTextFilter,
			paginate: basicPaginator,
			parse(data) {
				return basicParse(this)(data);
			},
			async lineTemplate(item, processPlayerName, processTextPart, processTextStyles) {
				const {
					original,
					date,
					time,
					playerName,
					actionType
				} = item;

				const processedPlayerName = processPlayerName(playerName);
				const processedContent = processTextPart(actionType);

				return wrappedLine(`
					<div>
						${date ? `<span class="time">[<span>${ date.replaceAll('-', '.') }</span>]</span>` : ''}
	                    <span class="time">[<span>${ time }</span>]</span>
	                    <span class="player-name">${ processedPlayerName }</span>
	                    <span>${ processedContent }</span>
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

export default connectionLogs;
