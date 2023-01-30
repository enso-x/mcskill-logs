import { timePattern, namePattern, worldPattern } from './patterns.js';
import { basicTextFilter, basicPaginator, basicLineParse, wrappedLine } from './utilities.js';

const chatParser = (chatLogs) => (data) => {
	return data.reduce((acc, next) => {
		const [ text, date ] = next;
		for (let chatVariant of chatLogs.variants) {
			if (chatVariant.tester.test(text)) {
				acc.push(
					basicLineParse(chatVariant)(text, date)
				);
				break;
			}
		}
		return acc;
	}, []);
};

const chatTemplate = (chatLogs) => async (data, processPlayerName, processTextPart, processTextStyles) => {
	let template = '';
	for (let item of data) {
		for (let chatVariant of chatLogs.variants) {
			if (chatVariant.tester.test(item.original)) {
				template += await chatVariant.lineTemplate(item, processPlayerName, processTextPart, processTextStyles);
				break;
			}
		}
	}
	return template;
};

const chatLogs = {
	name: 'chat',
	variants: [
		{
			tester: new RegExp(`${timePattern()} ${namePattern()} issued server command: (?:\\/.*)`, 'i'),
			parser: new RegExp(`${timePattern('time')} ${namePattern('playerName')} issued server command: (?<command>\\/.*)`, 'i'),
			filter: basicTextFilter,
			paginate: basicPaginator,
			parse: (data) => chatParser(chatLogs)(data),
			async lineTemplate(item, processPlayerName, processTextPart, processTextStyles) {
				const {
					original,
					date,
					time,
					playerName,
					command
				} = item;
				const processedPlayerName = processPlayerName(playerName);
				const processedText = processTextPart('issued server command:');
				const processedCommand = processTextPart(command);

				return wrappedLine(`
                    ${ date ? `<span class="time">[<span>${ date.replaceAll('-', '.') }</span>]</span>` : '' }
                    <span class="time">[<span>${ time }</span>]</span>
                    <span class="player-name">${ processedPlayerName }</span>
                    <span>${ processedText }</span>
                    <span class="draggable" draggable="true" data-name="${ command }">${ processedCommand }</span>
                `, original);
			},
			template: async (data, processPlayerName, processTextPart, processTextStyles) => chatTemplate(chatLogs)(data, processPlayerName, processTextPart, processTextStyles)
		},
		{
			tester: new RegExp(`${timePattern()}${worldPattern()} ${namePattern()}: (?:.*)\\n?`, 'i'),
			parser: new RegExp(`${timePattern('time')}${worldPattern()} (?:\\[(?<chatLogs>[GL])]\\s)?${namePattern('playerName')}(?<playerChat>:)?\\s?(?<worldChat>!)?(?<messageContent>.*)`, 'i'),
			filter: basicTextFilter,
			paginate: basicPaginator,
			parse: (data) => chatParser(chatLogs)(data),
			async lineTemplate(item, processPlayerName, processTextPart, processTextStyles) {
				const {
					original,
					date,
					time,
					world,
					x, y, z,
					chatLogs,
					playerName,
					playerChat,
					worldChat,
					messageContent
				} = item;
				const processedPlayerName = processPlayerName(playerName);
				const processedContent = processTextStyles(processTextPart(messageContent));

				return wrappedLine(`
					${ world ? `<span>Мир: <span class="world" onclick="navigator.clipboard.writeText(\`[name:'${ world }', x:${ x }, y:${ y }, z:${ z }]\`)">${ world }</span> <span class="coordinates">{ x: <span class="x">${ x }</span>,y:  <span class="y">${ y }</span>, z: <span class="z">${ z }</span> }</span></span>` : '' }
					<div>
						${ date ? `<span class="time">[<span>${ date.replaceAll('-', '.') }</span>]</span>` : '' }
	                    <span class="time">[<span>${ time }</span>]</span>
	                    ${ chatLogs || worldChat ? (
							chatLogs === 'G' || worldChat ? (
								`<span class="global-chat">[<span>G</span>]</span>`
							) : (
								`<span class="local-chat">[<span>L</span>]</span>`
							)
						) : '' }
	                    <span class="player-name">${ processedPlayerName }${ playerChat ? ':' : '' }</span>
	                    <span>${ processedContent }</span>
                    </div>
                `, original, true);
			},
			template: async (data, processPlayerName, processTextPart, processTextStyles) => chatTemplate(chatLogs)(data, processPlayerName, processTextPart, processTextStyles)
		}
	]
};

export default chatLogs;
