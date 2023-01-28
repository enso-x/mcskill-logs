import './datepicker.js';

const USER_NAME = 'GlocTower';

const initLocalStorageCell = (key, initialValue, valueTransformer) => {
	let value;
	const setValue = (newValue) => {
		value = newValue ? newValue : initialValue;
		localStorage.setItem(key, value ?? '');
	};
	const getValue = () => {
		return valueTransformer ? valueTransformer(value) : value;
	};
	const savedValue = localStorage.getItem(key);

	setValue(savedValue);

	return [ getValue, setValue ];
};

const decline = (n, titles) => {
	return titles[(n % 10 === 1 && n % 100 !== 11) ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2]
};

const timePattern = (group = null) => `\\[(?${group ? `<${group}>` : ':'}\\d{2}:\\d{2}(?::\\d{2})?)]`;
const namePattern = (group = null) => `(?${group ? `<${group}>` : ':'}[A-Za-z_0-9-]+)`;
const pokemonNamePattern = (group = null) => `(?${group ? `<${group}>` : ':'}[A-Za-z_0-9- '.é♂♀]+)`;
const worldPattern = `(?:\\[(?<world>.*):\\s(?<x>[0-9-]+)\\s(?<y>[0-9-]+)\\s(?<z>[0-9-]+)]\\s?)?`;

const imageCache = {};

const logType = {
	chat: new RegExp(`${timePattern()}${worldPattern} ${namePattern()}: (?:.*)\\n?`, 'i'),
	connection: new RegExp(`${timePattern()} ${namePattern()} (?:(?:logged in)|(?:left the game))\\n?`, 'i'),
	death: new RegExp(`${timePattern()}${worldPattern} - ${namePattern()} (?:.*)(?:\\n\\s{4}- .*x?\\d*)+`, 'i'),
	items: new RegExp(`${timePattern()}${worldPattern} ${namePattern()} (?:(?:drop)|(?:pickup)): .*\\n?`, 'i'),
	legendarySpawn: new RegExp(`${timePattern()} ${pokemonNamePattern()} - ${namePattern()}\\n?`, 'i'),
	pokemonTrade: new RegExp(`${timePattern()} Игрок ${namePattern()} обменял покемона ${pokemonNamePattern()} на покемона ${pokemonNamePattern()} игрока ${namePattern()}`, 'i')
};

const parsers = {
	chat: (text, date) => {
		return text.split('\n').filter(Boolean).reduce((acc, next) => {
			if (next.includes('issued')) {
				const executedContent = (/(?:\[(?<time>(\d{2}:\d{2}(?::\d{2})?))]\s)?(?<playerName>[A-Za-z0-9_]{3,}) issued server command: (?<command>\/.*)/gi).exec(next);
				acc.push({
					...(executedContent.groups),
					original: next,
					date: date
				});
			} else {
				const executedContent = (/(?:\[(?<time>(\d{2}:\d{2}(?::\d{2})?))]\s?)?(?:\[(?<world>.*):\s(?<x>[0-9-]+)\s(?<y>[0-9-]+)\s(?<z>[0-9-]+)]\s)?(?:\[(?<chatType>[GL])]\s)?(?:(?<playerName>[A-Za-z0-9_]{3,})(?<playerChat>:)?\s)?(?<worldChat>!)?(?<messageContent>.*)/gi).exec(next);
				acc.push({
					...(executedContent.groups),
					original: next,
					date: date
				});
			}
			return acc;
		}, []);
	},
	connection: new RegExp(`${timePattern()} ${namePattern()} (?:(?:logged in)|(?:left the game))\\n?`, 'i'),
	death: (text, date) => {
		return text.split('\n').filter(Boolean).reduce((acc, next) => {
			if (next.startsWith('[')) {
				const { time, world, x, y, z, playerName, reason } = new RegExp(`${timePattern('time')}${worldPattern} - ${namePattern('playerName')} (?<reason>.+)`, 'i').exec(next).groups;
				acc.push({
					death: {
						date,
						world, x, y, z,
						time,
						playerName,
						reason,
						original: next
					},
					items: []
				});
			}
			if (next.startsWith(' ')) {
				const expReg = /Experience: (?<exp>\d+)/i;
				const itemReg = /(?<itemName>[A-Z_\:0-9]+) \((?<itemID>[\:0-9]+)\) x(?<amount>\d+)/i;
				const itemLine = next.trim().slice(2);
				const death = acc.at(-1);
				if (!death) return acc;
				if (expReg.test(itemLine)) {
					const { exp } = expReg.exec(itemLine).groups;
					death.items.push({
						type: 'exp',
						amount: exp,
						original: next
					});
				}
				if (itemReg.test(itemLine)) {
					const { itemName, itemID, amount } = itemReg.exec(itemLine).groups;
					death.items.push({
						type: 'item',
						itemID,
						itemName,
						amount,
						original: next
					});
				}
			}
			return acc;
		}, []);
	},
	items: (text, date) => {
		return text.split('\n').filter(Boolean).reduce((acc, next) => {
			const { time, world, x, y, z, playerName, actionType, item } = new RegExp(`${timePattern('time')}${worldPattern} ${namePattern('playerName')} (?<actionType>(?:drop)|(?:pickup)): (?<item>.*)\\n?`, 'i').exec(next).groups;
			acc.push({
				date,
				world, x, y, z,
				time,
				playerName,
				actionType,
				item,
				original: next
			});
			return acc;
		}, []);
	},
	legendarySpawn: (text, date) => {
		return text.split('\n').filter(Boolean).reduce((acc, next) => {
			const { time, pokemonName, playerName } = new RegExp(`${timePattern('time')} ${pokemonNamePattern('pokemonName')} - ${namePattern('playerName')}\\n?`, 'i').exec(next).groups;
			acc.push({
				date,
				time,
				pokemonName: pokemonName.replaceAll(/([a-z])([A-Z])/g, (...matches) => `${matches[1]} ${matches[2]}`),
				playerName,
				original: next
			});
			return acc;
		}, []);
	},
	pokemonTrade: (text, date) => {
		return text.split('\n').filter(Boolean).reduce((acc, next) => {
			const { time, playerName1, pokemonName1, pokemonName2, playerName2 } = new RegExp(`${timePattern('time')} Игрок ${namePattern('playerName1')} обменял покемона ${pokemonNamePattern('pokemonName1')} на покемона ${pokemonNamePattern('pokemonName2')} игрока ${namePattern('playerName2')}`, 'i').exec(next).groups;
			acc.push({
				date,
				time,
				playerName1,
				pokemonName1,
				playerName2,
				pokemonName2,
				original: next
			});
			return acc;
		}, []);
	}
};

const getRegexp = (filter) => {
	if (!filter) {
		return false;
	}

	let reg;
	try {
		reg = new RegExp(filter);
	} catch(e) {
		reg = false;
	}
	return reg;
};

const doTestValue = (value, filter) => {
	const reg = getRegexp(filter);
	return filter.length > 0 ? (value.toLowerCase().includes(filter.toLowerCase()) || (reg && reg.test(value))) : true;
};

const filters = {
	chat: (data, filter) => {
		return data.filter(value => doTestValue(value.original, filter));
	},
	death: (data, filter) => {
		return data.filter(value => doTestValue(value.death.original, filter));
	},
	items: (data, filter) => {
		return data.filter(value => doTestValue(value.original, filter));
	},
	legendarySpawn: (data, filter) => {
		return data.filter(value => doTestValue(value.original, filter));
	},
	pokemonTrade: (data, filter) => {
		return data.filter(value => doTestValue(value.original, filter));
	},
};

const wrappedLine = (content, original = '', vertical = false) => {
	return `<span class="line ${vertical ? 'line:vertical' : ''}" ${original ? `title="${ original }"` : ''}>${ content }</span>`;
};

const renderTemplates = {
	chat: async (data, processPlayerName, processTextPart, processTextStyles) => {
		return data.reduce((template, item) => {
			if (item.original.includes('issued')) {
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
				template += wrappedLine(`
                    ${date ? `<span class="time">[<span>${ date.replaceAll('-', '.') }</span>]</span>` : ''}
                    <span class="time">[<span>${ time }</span>]</span>
                    <span class="player-name">${ processedPlayerName }</span>
                    <span>${ processedText }</span>
                    <span class="draggable" draggable="true" data-name="${ command }">${ processedCommand }</span>
                `, original);
			} else {
				const {
					original,
					date,
					time,
					world,
					x, y, z,
					chatType,
					playerName,
					playerChat,
					worldChat,
					messageContent
				} = item;
				const processedPlayerName = processPlayerName(playerName);
				const processedContent = processTextStyles(processTextPart(messageContent));
				template += wrappedLine(`
					${world ? `<span>Мир: <span class="world" onclick="navigator.clipboard.writeText(\`[name:'${world}', x:${x}, y:${y}, z:${z}]\`)">${ world }</span> <span class="coordinates">{ x: <span class="x">${x}</span>,y:  <span class="y">${y}</span>, z: <span class="z">${z}</span> }</span></span>` : ''}
					<div>
						${date ? `<span class="time">[<span>${ date.replaceAll('-', '.') }</span>]</span>` : ''}
	                    <span class="time">[<span>${ time }</span>]</span>
	                    ${ chatType || worldChat ? (
							chatType === 'G' || worldChat ? (
								`<span class="global-chat">[<span>G</span>]</span>`
							) : (
								`<span class="local-chat">[<span>L</span>]</span>`
							)
						) : '' }
	                    <span class="player-name">${ processedPlayerName }${ playerChat ? ':' : '' }</span>
	                    <span>${ processedContent }</span>
                    </div>
                `, original, true);
			}

			return template;
		}, '');
	},
	death: async (data, processPlayerName) => {
		return data.reduce((template, item) => {
			const { death, items } = item;
			const { world, x, y, z } = death;
			const processedPlayerName = processPlayerName(death.playerName);

			template += wrappedLine(`
				${world ? `<span>Мир: <span class="world" onclick="navigator.clipboard.writeText(\`[name:'${world}', x:${x}, y:${y}, z:${z}]\`)">${ world }</span> <span class="coordinates">{ x: <span class="x">${x}</span>,y:  <span class="y">${y}</span>, z: <span class="z">${z}</span> }</span></span>` : ''}
				<div>
					${death.date ? `<span class="time">[<span>${ death.date.replaceAll('-', '.') }</span>]</span>` : ''}
	                <span class="time">[<span>${ death.time }</span>]</span>
	                <span class="player-name">${ processedPlayerName }</span>
	                <span>${ death.reason }</span>
                </div>
                <div class="inventory">${ items.reduce((itemsTemplate, itemData) => {
				itemsTemplate += `<span class="inventory__item" title="${itemData.itemName || 'Experience'}" onclick="navigator.clipboard.writeText('${itemData.type === 'exp' ? `/xp ${itemData.amount} ${death.playerName}` : `/give ${death.playerName} ${itemData.itemName} ${itemData.amount}`}');"><img src="${itemData.type === 'exp' ? '/exp-icon.png' : '/unknown-icon.png'}" alt="${itemData.type === 'exp' ? 'Experience' : 'Unknown'} item"><span class="amount">${itemData.amount}</span></span>`;
				return itemsTemplate;
			}, '') }</div>
            `, death.original, true);

			return template;
		}, '');
	},
	items: async (data, processPlayerName) => {
		return data.reduce((template, itemData) => {
			const { date, time, world, x, y, z, playerName, actionType, item, original } = itemData;
			const processedPlayerName = processPlayerName(playerName);

			template += wrappedLine(`
				${world ? `<span>Мир: <span class="world" onclick="navigator.clipboard.writeText(\`[name:'${world}', x:${x}, y:${y}, z:${z}]\`)">${ world }</span> <span class="coordinates">{ x: <span class="x">${x}</span>,y:  <span class="y">${y}</span>, z: <span class="z">${z}</span> }</span></span>` : ''}
				<div>
					${date ? `<span class="time">[<span>${ date.replaceAll('-', '.') }</span>]</span>` : ''}
	                <span class="time">[<span>${ time }</span>]</span>
	                <span class="player-name">${ processedPlayerName }</span>
	                <span>${actionType}</span>
	                <span>${item}</span>
                </div>
            `, original, true);

			return template;
		}, '');
	},
	legendarySpawn: async (data, processPlayerName) => {
		return data.reduce((template, item) => {
			const { date, time, pokemonName, playerName, original } = item;
			const processedPlayerName = processPlayerName(playerName);

			template += wrappedLine(`
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

			return template;
		}, '');
	},
	pokemonTrade: async (data, processPlayerName) => {
		let template = '';

		for (let item of data) {
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
				if (imageCache[formatted]) {
					res(imageCache[formatted]);
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
						imageCache[formatted] = img.src;
						res(img.src);
					};
					img.src = url1;
				} catch(e) {}
			});

			const pokemon1Image = await tryLoadPokemonSprite(pokemonName1);
			const pokemon2Image = await tryLoadPokemonSprite(pokemonName2);

			template += wrappedLine(`
				${date ? `<span class="time">[<span>${ date.replaceAll('-', '.') }</span>]</span>` : ''}
                <span class="time">[<span>${ time }</span>]</span>
                Игрок
                <span class="player-name">${ processedPlayerName1 }</span>
                обменял покемона
                <span style="display: inline-flex;">
                    <a target="_blank" href="https://pixelmonmod.com/wiki/${ pokemonName1.toLowerCase().replaceAll(/\s(\w)/gi, (...matches) => `_${matches[1].toUpperCase()}`) }">
                        <img style="width: 112px; margin: 0 -10px; image-rendering: pixelated;" title="${ pokemonName1 }" src="${ pokemon1Image }" alt="${ pokemonName1 }">
                    </a>
                </span>
                на покемона
                <span style="display: inline-flex;">
                    <a target="_blank" href="https://pixelmonmod.com/wiki/${ pokemonName2.toLowerCase().replaceAll(/\s(\w)/gi, (...matches) => `_${matches[1].toUpperCase()}`) }">
                        <img style="width: 112px; margin: 0 -10px; image-rendering: pixelated;" title="${ pokemonName2 }" src="${ pokemon2Image }" alt="${ pokemonName2 }">
                    </a>
                </span>
                игрока
                <span class="player-name">${ processedPlayerName2 }</span>.
            `, original);
		}

		return template;
	},
};

const getDaysBetweenDates = (date1, date2) => {
	const result = [];
	for (let day = date1; day <= date2; day.setDate(day.getDate()+1)) {
		result.push(new Date(day));
	}
	return result;
};

(async () => {
	'use strict';

	let lines = [];
	let filterValue = '';
	let cancelLoopRef = null;

	const parser = new DOMParser();
	const $element = (htmlText) => {
		const content = parser.parseFromString(htmlText, 'text/html');
		return content.body.children[0] ?? content.head.children[0];
	};

	const [ getMessageCount, setMessageCount ] = initLocalStorageCell('logs-script[message-count]', 500, v => parseInt(v, 10));
	const [ getUpdateTime, setUpdateTime ] = initLocalStorageCell('logs-script[update-time]', 2, v => parseInt(v, 10));
	const [ getCurrentPage, setCurrentPage ] = initLocalStorageCell('logs-script[current-page]', 0, v => parseInt(v, 10));
	const [ getLastPathname, setLastPathname ] = initLocalStorageCell('logs-script[last-pathname]', '');
	if (getLastPathname() !== window.updateUrl) {
		setLastPathname(window.updateUrl);
		setCurrentPage(0);
	}
	let pageCount = 1;

	const localStorageWatchesKey = 'logs-script[watches]';
	const savedData = localStorage.getItem(localStorageWatchesKey);
	let watches = savedData ? JSON.parse(savedData) : {
		'UserName': [ USER_NAME ]
	};
	const addToWatches = (listKey, list) => {
		watches[listKey] = list;
	};
	const logsURLBase = `${ window.updateUrl.split("/").slice(0, -1).join("/") }/`;
	let oldLog = '';
	const dateFormatter = new Intl.DateTimeFormat('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit' });
	const templates = {
		'UserName': v => `<span class="user-name">${ v }</span>`
	};
	const weights = {
		'UserName': 3
	};
	const textStyleMap = {
		'0': 'color: #000;',
		'1': 'color: #000090;',
		'2': 'color: #009000;',
		'3': 'color: #007878;',
		'4': 'color: #900000;',
		'5': 'color: #900090;',
		'6': 'color: #ffb000;',
		'7': 'color: #888;',
		'8': 'color: #444;',
		'9': 'color: #4646ff;',
		'a': 'color: #60ff60;',
		'b': 'color: #4ef;',
		'c': 'color: #f44;',
		'd': 'color: #f060f0;',
		'e': 'color: #ff4;',
		'f': 'color: #fff;',
		'l': 'font-weight: bold;',
		'm': 'text-decoration: line-through;',
		'n': 'text-decoration: underline;',
		'o': 'font-style: italic;',
	};

	const styles = $element(`
        <style id="styled">
            * {
                box-sizing: border-box;
            }
    
            body {
                margin: 0;
            }
    
            #root {
                font: 14px monospace;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                padding: 0 0 0 300px;
            }
            
            .pagination {
                position: fixed;
                bottom: 8px;
                right: 24px;
                display: flex;
                align-items: center;
                padding: 8px;
                gap: 8px;
                background: rgba(0,0,0,0.8);
                border-radius: 4px;
            }
            
            .pagination__button {
                font-size: 10px;
            }
            
            .pagination__text {
                display: flex;
                width: 160px;
                height: 100%;
                align-items: center;
                justify-content: center;
                font-family: 'Exo 2', sans-serif;
            }
    
            .controls {
                position: fixed;
			    top: 0;
			    left: 0;
			    width: 300px;
			    height: 100%;
			    display: flex;
			    flex-direction: column;
			    gap: 16px;
			    background: linear-gradient(225deg, #164f38, #0e1c15 40%, #080a0a 80%);
			    box-shadow: inset -2px 0 4px rgb(0 0 0 / 40%);
			    padding: 8px;
			    overflow-y: auto;
			    font-family: 'Exo 2', sans-serif;
            }
            
            .controls::-webkit-scrollbar {
			    width: 12px;
			}
			
			/*.controls::-webkit-scrollbar-track {*/
			/*	background: rgba(0,0,0,0.5);*/
			/*	background-clip: content-box;*/
			/*    border: solid 4px transparent;*/
			/*    border-radius: 6px;*/
			/*}*/
			
			.controls::-webkit-scrollbar-thumb {
			    width: 6px;
			    border: 4px solid transparent;
			    background-color: rgba(255, 255, 255, 0);
			    background-clip: content-box;
			    border-radius: 6px;
			    transition: background-color 0.2s ease-in-out;
			}
			
			.controls:hover::-webkit-scrollbar-thumb {
			    background-color: rgba(255, 255, 255, .1);
			}
            
            .controls__inputs {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
    
            .checkbox {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .checkbox__handle {
                display: inline-flex;
            }
            
            .checkbox__handle input {
                display: none;
            }
            
            .checkbox__box {
                position: relative;
                display: inline-flex;
                justify-content: center;
                align-items: center;
                width: 20px;
                height: 20px;
                background: rgba(0, 0, 0, 0.3);
			    border: none;
			    border-radius: 4px;
			    box-shadow: 0 0 2px 1px rgb(255 255 255 / 10%);
			    transition: box-shadow 0.2s ease-in-out;
			    cursor: pointer;
            }
            
            .checkbox__handle input:checked + .checkbox__box {
                background: rgba(0, 0, 0, 0.3) url("/tick_green_modern.svg") center center no-repeat;
                background-size: 80% 80%;
            }
            
            #text-search-input {
                width: 100%;
				margin-top: 8px;
            }
            
            #actual-logs {
                margin: 0;
            }
            
            #message-count, #update-time {
                width: 60px;
                text-align: center;
            }
            #message-count::-webkit-outer-spin-button,
            #message-count::-webkit-inner-spin-button,
            #update-time::-webkit-outer-spin-button,
            #update-time::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
                display: none;
            }
    
            .watch-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
                background: linear-gradient(325deg, #00000061, #00000038);
			    padding: 8px;
			    border-radius: 8px;
			    box-shadow: 0 0 2px 1px rgb(255 255 255 / 10%);
            }
    
            .watch-list__controls {
                display: flex;
                gap: 4px;
            }
    
            .watch-list__input {
                flex: 1;
            }
    
            .watch-list__items {
                display: flex;
                flex-direction: column;
                gap: 4px;
                min-height: 24px;
			    padding: 8px;
			    border-radius: 6px;
			    background: rgba(0,0,0,0.3);
			    box-shadow: inset 0 2px 8px rgb(0 0 0 / 30%);
            }
            
            .button {
                font-family: 'Exo 2', sans-serif;
                border: 1px solid #747474;
			    border-radius: 4px;
			    background: linear-gradient(148deg, #3e3e3e 20%, #b9b9b9);
			    padding: 4px 8px;
			    color: rgba(255,255,255,0.8);
			    cursor: pointer;
            }
            
            .button:hover {
                filter: brightness(1.2);
            }
            
            .button:active {
                filter: brightness(0.6);
            }
            
            .button\\:green {
                border: 1px solid #117835;
                background: linear-gradient(148deg, #003a27 20%, #23b96d);
            }
    
            .button\\:red {
                border: 1px solid #781111;
                background: linear-gradient(148deg, #3a0000 20%, #b92323);
            }
            
            .list-container {
                background: linear-gradient(160deg, #459866, #1e422c 20%, #090a0a);
			    height: 100vh;
			    overflow-y: auto;
            }
    
            .list {
                display: flex;
			    flex-direction: column-reverse;
			    padding: 8px;
			    gap: 4px;
			    font-family: 'Exo 2', sans-serif;
                font-variant-numeric: tabular-nums;
            }
    
            .line {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 8px;
                background: linear-gradient(135deg, rgba(0,0,0,0.2), rgba(0,0,0,0.4));
			    border-radius: 8px;
			    padding: 8px 16px;
            }
    
            /*.line:not(:last-child) {
                border-top: 1px solid rgba(255, 255, 255, 0.2);
            }*/
            
            .line > span {
                flex-shrink: 0;
            }
            
            .line\\:vertical {
                flex-direction: column;
                align-items: flex-start;
                justify-content: center;
                padding: 8px 16px;
            }
            
            .line\\:vertical > div:not(.inventory) {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 8px;
            }
            
            .line\\:vertical > div > span {
                 flex-shrink: 0;
            }
            
            .inventory {
                display: flex;
                flex-wrap: wrap;
                border: 12px solid transparent;
                border-image: url("/inventory-border.png") 12;
                background: #c6c6c6;
                background-clip: content-box;
                max-width: 456px;
            }
            
            .inventory__item {
                position: relative;
                display: flex;
                justify-content: center;
                align-items: center;
                width: 36px;
                height: 36px;
                background: url("/inventory-slot.png") no-repeat;
                cursor: pointer;
            }
            
            .inventory__item > .amount {
                position: absolute;
                bottom: 0;
                right: 4px;
                text-shadow: 1px 1px #000;
            }
            
            input[type="text"], input[type="number"] {
                background: rgba(0,0,0,0.3);
			    border: none;
			    padding: 8px 16px;
			    border-radius: 8px;
			    box-shadow: 0 0 2px 1px rgb(255 255 255 / 10%);
			    transition: box-shadow 0.2s ease-in-out;
			    font-family: 'Exo 2', sans-serif;
            }
            
            input[type="text"]:focus-visible, input[type="number"]:focus-visible {
                outline: none;
                box-shadow: 0 0 2px 2px #378364a6;
            }
            
            #date-search-input {
                display: none;
            }
            
            .preloader-container {
                display: flex;
			    height: calc(100vh - 16px);
			    align-self: center;
            }
            
            .trade-form {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 8px;
            }
            
            #drop-file-zone {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                margin-top: 8px;
                gap: 8px;
			    background: linear-gradient(325deg, #00000061, #00000038);
			    padding: 8px;
			    border-radius: 8px;
			    box-shadow: 0 0 2px 1px rgb(255 255 255 / 10%);
			    min-height: 140px;
			    cursor: pointer;
            }
            
            #drop-file-zone input {
                display: none;
            }
            
            .drop-icon {
                width: 64px;
                height: 64px;
                margin-bottom: 8px;
                filter: drop-shadow(0 0 1px #fff2) drop-shadow(0 0 1px #fff2);
            }
            
            .drop-icon path {
                fill: #000d;
            }
            
            #drop-file-zone:hover .drop-icon, #drop-file-zone.hover .drop-icon {
                filter: drop-shadow(0 0 1px #0aab51) drop-shadow(0 0 1px #0aab51);
            }
            
            #drop-file-zone:hover .drop-icon path, #drop-file-zone.hover .drop-icon path {
                fill: #123325;
            }
            
            .drop-file-zone__name:hover {
                color: #a81e1e;
            }
            
            .coordinates {
                color: #fff !important;
            }
            
            .x, .y, .z {
                color: #9560E6;
            }
            
            .world {
                color: #04e573;
                cursor: pointer;
            }
    
            .global-chat > span {
                color: #fa0;
            }
    
            .local-chat > span {
                color: #CBFB2D;
            }
    
            .time > span {
                color: #9560E6;
            }
    
            .player-name {
                color: #777;
            }
    
            .player-name > span:not([class]) {
                color: #fff;
            }
    
            .warp-end {
                color: #29E376;
            }
    
            .warp-nether {
                color: #FF0147;
            }
    
            .player {
                color: #39AAFA;
            }
    
            .user-name {
                color: #0ff;
            }
    
            .command {
                color: #CBFB2D;
            }
        </style>
    `);

	document.head.appendChild(styles);

	const getPreloaderTemplate = () => {
		return `<div class="preloader-container"><img src="/preloader.svg"/></div>`;
	};

	const root = $element(`
        <div id="root">
            <div class="controls">
                <div class="checkbox" title="Загружать логи с учетом нового дня (по времени компьютера)">
                    <label class="checkbox__handle">
	                    <input type="checkbox" id="actual-logs"/>
	                    <span class="checkbox__box"></span>
	                </label>
	                <span class="checkbox__label">Показывать актуальные логи</span>
				</div>
                
                <div class="controls__inputs">
                    <div>
                        Показывать&nbsp;&nbsp;<input type="number" id="message-count" min="0" max="500" step="1" value="${ getMessageCount() ?? 500 }"/>&nbsp;&nbsp;<span id="message-count-decline">${ decline(getMessageCount(), [ 'сообщение', 'сообщения', 'сообщений' ]) }</span>.
                    </div>
                    <div>
                        Обновлять каждые:&nbsp;&nbsp;<input type="number" id="update-time" value="${ getUpdateTime() ?? 2 }" min="1" step="1"/>&nbsp;&nbsp;<span id="update-time-decline">${ decline(getUpdateTime(), [ 'секунду', 'секунды', 'секунд' ]) }</span>.
                    </div>
                    <div>
                        <br/>
                        Фильтр по тексту:<br/>
                        <input type="text" id="text-search-input"/>
					</div>
                    <div>
                        <br/>
                        Искать за промежуток:<br/>
                        <input type="text" id="date-search-input" autocomplete="off"/>
					</div>
					<div>
						<label id="drop-file-zone">
							<input type="file"/>
							<svg class="drop-icon" width="260" height="260" viewBox="0 0 260 260" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M138.074 3.31123C133.597 -1.10374 126.403 -1.10374 121.926 3.31123L50.4258 73.8112C45.9032 78.2705 45.8519 85.5517 50.3112 90.0743C54.7705 94.5968 62.0518 94.6481 66.5742 90.1888L118.5 38.9893V188.5C118.5 194.851 123.649 200 130 200C136.351 200 141.5 194.851 141.5 188.5V38.9893L193.426 90.1888C197.948 94.6481 205.229 94.5968 209.689 90.0743C214.148 85.5517 214.097 78.2705 209.574 73.8112L138.074 3.31123Z"/>
								<path d="M24.0154 202.5C24.0051 202.832 24 203.165 24 203.5C24 221.173 38.3269 235.5 56 235.5H204C221.673 235.5 236 221.173 236 203.5C236 203.165 235.995 202.832 235.985 202.5H236V153.5C236 146.873 241.373 141.5 248 141.5C254.627 141.5 260 146.873 260 153.5V204.5H259.966C258.912 235.054 233.811 259.5 203 259.5H56V259.491C25.6478 258.969 1.07654 234.723 0.0344238 204.5H0V153.5C0 146.873 5.37256 141.5 12 141.5C18.6274 141.5 24 146.873 24 153.5V202.5H24.0154Z"/>
							</svg>
							<span class="drop-file-zone__text">Выберите/сбросьте файл</span>
						</label>
					</div>
                </div>
            </div>
            <div class="list-container">
                <div class="list">
                    ${ getPreloaderTemplate() }
				</div>
			</div>
            <div class="pagination">
                <button class="button button:green pagination__button" id="page-first">◀◀</button>
                <button class="button button:green pagination__button" id="page-prev">◀</button>
                <span class="pagination__text" id="page-text">Страница ${ getCurrentPage() + 1 }/1</span>
                <button class="button button:green pagination__button" id="page-next">▶</button>
                <button class="button button:green pagination__button" id="page-last">▶▶</button>
            </div>
        </div>
    `);
	const controls = root.querySelector('.controls');
	const list = root.querySelector('.list');
	const actualLogsCheck = root.querySelector('#actual-logs');
	const textSearchInput = root.querySelector('#text-search-input');
	textSearchInput.addEventListener('input', (e) => {
		filterValue = e.target.value;
		setCurrentPage(0);
		updateLogContent();
	});
	const messageCountInput = root.querySelector('#message-count');
	const messageCountDecline = root.querySelector('#message-count-decline');
	messageCountInput.addEventListener('input', () => {
		setMessageCount(messageCountInput.value);
		messageCountDecline.innerText = decline(getMessageCount(), [ 'сообщение', 'сообщения', 'сообщений' ]);
		setCurrentPage(0);
	});
	const updateTimeInput = root.querySelector('#update-time');
	const updateTimeDecline = root.querySelector('#update-time-decline');
	updateTimeInput.addEventListener('input', () => {
		setUpdateTime(updateTimeInput.value);
		updateTimeDecline.innerText = decline(getUpdateTime(), [ 'секунду', 'секунды', 'секунд' ]);
	});
	const paginationText = root.querySelector('#page-text');
	const updatePage = (newPage) => {
		paginationText.innerHTML = `Страница ${ newPage + 1 }/${ pageCount }`;
		setCurrentPage(newPage);
		updateLogContent();
	};
	const setPageCount = (count) => {
		if (count && count > 0) {
			pageCount = count;
			paginationText.innerHTML = `Страница ${ getCurrentPage() + 1 }/${ pageCount }`;
		}
	};
	const firstPageButton = root.querySelector('#page-first');
	firstPageButton.addEventListener('click', () => {
		updatePage(0);
	});
	const prevPageButton = root.querySelector('#page-prev');
	prevPageButton.addEventListener('click', () => {
		const currentPage = getCurrentPage();
		const newPage = currentPage <= 0 ? 0 : currentPage - 1;
		updatePage(newPage);
	});
	const nextPageButton = root.querySelector('#page-next');
	nextPageButton.addEventListener('click', () => {
		const currentPage = getCurrentPage();
		const newPage = currentPage >= (pageCount - 1) ? pageCount - 1 : currentPage + 1;
		updatePage(newPage);
	});
	const lastPageButton = root.querySelector('#page-last');
	lastPageButton.addEventListener('click', () => {
		updatePage(pageCount - 1);
	});
	const dropZone = root.querySelector('#drop-file-zone');
	const fileInput = dropZone.querySelector('input');
	const dropText = dropZone.querySelector('.drop-file-zone__text');
	dropZone.addEventListener('dragover', (e) => {
		e.preventDefault();
		if (!dropZone.classList.contains('hover')) {
			dropZone.classList.add('hover');
		}
	});
	dropZone.addEventListener('dragleave', () => {
		if (dropZone.classList.contains('hover')) {
			dropZone.classList.remove('hover');
		}
	});
	const readFile = async (file) => {
		const reader = new FileReader();
		reader.addEventListener('load', async () => {
			if (cancelLoopRef !== null) {
				cancelLoopRef();
			}
			const fileNameToRemove = $element(`<span class="drop-file-zone__name">${file.name}</span>`);
			fileNameToRemove.addEventListener('click', (e) => {
				e.preventDefault();
				fileInput.value = '';
				dropText.innerHTML = 'Выберите/сбросьте файл';
				list.innerHTML = getPreloaderTemplate();
				cancelLoopRef = fetchLogs();
			});
			dropText.innerHTML = '';
			dropText.appendChild(fileNameToRemove);
			list.innerHTML = getPreloaderTemplate();
			text = reader.result;
			await updateLogContent();
		});
		reader.readAsText(file);
	};
	dropZone.addEventListener('drop', async (e) => {
		e.preventDefault();

		if (dropZone.classList.contains('hover')) {
			dropZone.classList.remove('hover');
		}

		if (e.dataTransfer.items) {
			for (let item of e.dataTransfer.items) {
				if (item.kind === 'file') {
					const file = item.getAsFile();
					await readFile(file);
				}
			}
		}
		// else {
		// 	// Use DataTransfer interface to access the file(s)
		// 	[...e.dataTransfer.files].forEach((file, i) => {
		// 	});
		// }
	});
	fileInput.addEventListener('change', (e) => {
		const target = e.target;
		const file = target.files?.[0];
		if (!file) {
			return;
		}

		dropText.innerHTML = 'Выберите/сбросьте файл';
		readFile(file);
	});
	document.querySelector('#app-root').append(root);
	const dateRangeInput = root.querySelector('#date-search-input');
	const datepicker = new Datepicker(dateRangeInput, {
		inline: true,
		multiple: true,
		ranged: true,
		separator: ':',
		toValue: async (...data) => {
			const [ value, dates ] = data;
			setCurrentPage(0);
			if (dates.length === 1 && dateFormatter.format(dates[0]) === dateFormatter.format(new Date())) {
				cancelLoopRef = fetchLogs();
			}
			if (dates.length > 1) {
				if (cancelLoopRef !== null) {
					cancelLoopRef();
				}
				list.innerHTML = getPreloaderTemplate();
				const days = getDaysBetweenDates(...dates);
				const socketData = [];
				const requests = days.map(async (date) => ({
					date: date,
					response: await fetch(`/api/logs-between`, {
						method: 'POST',
						headers: {
							'content-type': 'application/json'
						},
						body: JSON.stringify({ urlBase: logsURLBase, date: dateFormatter.format(date).replaceAll('.', '-') })
					})
				}));
				for await (let request of requests) {
					const data = await request.response.json();
					socketData.push(data);
				}
				text = [...socketData];
				await updateLogContent();
			}
			return value;
		}
	});

	const clearLogList = () => {
		oldLog = '';
	}

	const saveWatchList = () => {
		localStorage.setItem(localStorageWatchesKey, JSON.stringify(watches));
	};

	const createWatchList = (name, displayName, template, initialWatches = [], weight = 1) => {
		let watchItems = watches[name] ?? initialWatches;
		const updateWatches = () => {
			addToWatches(name, watchItems);
			clearLogList();
			saveWatchList();
			update();
			if (cancelLoopRef !== null) {
				cancelLoopRef();
			}
			cancelLoopRef = fetchLogs();
		};
		const addWatchItem = (item) => {
			watchItems.push(item);
			updateWatches();
		};
		const removeWatchItem = (item) => {
			watchItems = watchItems.filter(watch => watch !== item);
			updateWatches();
		};

		if (!watches[name]) {
			addToWatches(name, watchItems);
			saveWatchList();
		}

		if (!templates[name]) {
			templates[name] = template;
		}

		if (!weights[name]) {
			weights[name] = weight;
		}

		const watchList = $element(`
            <div class="watch-list">
                <span class="watch-list__label">${ displayName }</span>
                <div class="watch-list__controls">
                    <input type="text" class="watch-list__input" title="Введите за чем следить и нажмите Ender.\nИли перетащите ник/команду в список ниже.">
                </div>
                <div class="watch-list__items"></div>
            </div>
        `);
		const watchListItems = watchList.querySelector('.watch-list__items');
		watchListItems.addEventListener('dragover', (e) => {
			e.preventDefault();
			return true;
		});
		watchListItems.addEventListener('drop', (e) => {
			const item = e.dataTransfer.getData('text/plain');
			addWatchItem(item);
		});
		const watchInput = watchList.querySelector('.watch-list__input');
		watchInput.addEventListener('change', () => {
			if (watchInput.value && watchInput.value.length > 0) {
				addWatchItem(watchInput.value);
				watchInput.value = '';
			}
		});

		const update = () => {
			watchListItems.innerHTML = '';
			watchItems.forEach(watchName => {
				const watchRemoveButton = $element(`
                    <button type="button" class="button button:red">
                        ${ watchName }
                    </button>
                `);

				watchRemoveButton.addEventListener('click', () => {
					removeWatchItem(watchName);
				});

				watchListItems.appendChild(watchRemoveButton);
			});
		};

		update();

		return [ watchList ];
	};

	const [ endList ] = createWatchList('End', 'Край', v => `<span class="warp-end">${ v }</span>`, [ '/warp end', '/cmi warp end' ], 2);
	const [ netherList ] = createWatchList('Nether', 'Ад', v => `<span class="warp-nether">${ v }</span>`, [ '/warp nether', '/cmi warp nether' ], 2);
	const [ commandList ] = createWatchList('Commands', 'Команды', v => `<span class="command">${ v }</span>`, [ '/pm', '/m', '/tell', '/r', '/w', '/msg', '/t', '/helpop' ], 2);
	const [ playersList ] = createWatchList('Players', 'Игроки', v => `<span class="player">${ v }</span>`, [], 2);
	const [ proPlayersList ] = createWatchList('Pro', 'Pro', v => `<span style="color: #fff;">[<span style="color: #00bebe;">Pro</span>]&nbsp;<span style="color: #aaa;">${ v }</span></span>`, []);
	const [ vipPlayersList ] = createWatchList('Vip', 'Vip', v => `<span style="color: #fff;">[<span style="color: #f00;">Vip</span>]&nbsp;<span style="color: #aaa;">${ v }</span></span>`, []);
	const [ goldPlayersList ] = createWatchList('Gold', 'Gold', v => `<span style="color: #fff;">[<span style="color: #f7b800;">Gold</span>]&nbsp;<span style="color: #aaa;">${ v }</span></span>`, []);
	const [ grandPlayersList ] = createWatchList('Grand', 'Grand', v => `<span style="color: #fff;">[<span style="color: #6f6;">Grand</span>]&nbsp;<span style="color: #aaa;">${ v }</span></span>`, []);
	const [ deluxePlayersList ] = createWatchList('Deluxe', 'Deluxe', v => `<span style="color: #fff;">[<span style="color: #4b0082;">Deluxe</span>]&nbsp;<span style="color: #aaa;">${ v }</span></span>`, []);
	const [ modPlayersList ] = createWatchList('Mod', 'Mod', v => `<span style="color: #fff;">[<span style="color: #a00;">Mod</span>]&nbsp;<span style="color: #aaa;">${ v }</span></span>`, []);
	const [ trueModPlayersList ] = createWatchList('TrueMod', 'TrueMod', v => `<span style="color: #fff;">[<span style="color: #f00;">TrueMod</span>]&nbsp;<span style="color: #aaa;">${ v }</span></span>`, []);
	const [ traineePlayersList ] = createWatchList('Trainee', 'Стажёры', v => `<span style="color: #fff;">[<span style="color: #83ff7b;">Стажёр</span>]&nbsp;<span style="color: #aaa;">${ v }</span></span>`, []);
	const [ helperPlayersList ] = createWatchList('Helper', 'Помощники', v => `<span style="color: #fff;">[<span style="color: #34a528;">Помощник</span>]&nbsp;<span style="color: #aaa;">${ v }</span></span>`, []);
	const [ moderPlayersList ] = createWatchList('Moderator', 'Модераторы', v => `<span style="color: #fff;">[<span style="color: #860000;">Модератор</span>]&nbsp;<span style="color: #aaa;">${ v }</span></span>`, []);
	const [ seniorModerPlayersList ] = createWatchList('SeniorModerator', 'Ст. Модераторы', v => `<span style="color: #fff;">[<span style="color: #0062b0;">Ст. Модератор</span>]&nbsp;<span style="color: #aaa;">${ v }</span></span>`, []);
	const [ liderModerPlayersList ] = createWatchList('LiderModerator', 'Гл. Модераторы', v => `<span style="color: #fff;">[<span style="color: #002d80;">Гл. Модератор</span>]&nbsp;<span style="color: #aaa;">${ v }</span></span>`, []);
	const [ curatorPlayersList ] = createWatchList('Curator', 'Кураторы', v => `<span style="color: #fff;">[<span style="color: #83ff7b;">Куратор</span>]&nbsp;<span style="color: #aaa;">${ v }</span></span>`, []);
	const [ builderPlayersList ] = createWatchList('Builder', 'Строители', v => `<span style="color: #fff;">[<span style="color: #e77bff;">Строитель</span>]&nbsp;<span style="color: #aaa;">${ v }</span></span>`, []);
	const [ gameDesignerPlayersList ] = createWatchList('GameDesigner', 'Гейм дизайнеры', v => `<span style="color: #fff;">[<span style="color: #002aef;">Гейм дизайнер</span>]&nbsp;<span style="color: #aaa;">${ v }</span></span>`, []);
	const [ techAdminPlayersList ] = createWatchList('TechAdministrator', 'Тех. Администраторы', v => `<span style="color: #fff;">[<span style="color: #3c3c3c;">Тех. Админ</span>]&nbsp;<span style="color: #aaa;">${ v }</span></span>`, []);
	const [ adminPlayersList ] = createWatchList('Administrator', 'Администраторы', v => `<span style="color: #fff;">[<span style="color: #900;">Админ</span>]&nbsp;<span style="color: #aaa;">${ v }</span></span>`, []);
	controls.appendChild(endList);
	controls.appendChild(netherList);
	controls.appendChild(commandList);
	controls.appendChild(playersList);
	controls.appendChild(proPlayersList);
	controls.appendChild(vipPlayersList);
	controls.appendChild(goldPlayersList);
	controls.appendChild(grandPlayersList);
	controls.appendChild(deluxePlayersList);
	controls.appendChild(modPlayersList);
	controls.appendChild(trueModPlayersList);
	controls.appendChild(traineePlayersList);
	controls.appendChild(helperPlayersList);
	controls.appendChild(moderPlayersList);
	controls.appendChild(seniorModerPlayersList);
	controls.appendChild(liderModerPlayersList);
	controls.appendChild(curatorPlayersList);
	controls.appendChild(builderPlayersList);
	controls.appendChild(gameDesignerPlayersList);
	controls.appendChild(techAdminPlayersList);
	controls.appendChild(adminPlayersList);

	const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

	const processTextPart = (part) => {
		let newPart = part;
		const watchesSortedByWeights = Object.entries(watches).sort(([ k1 ], [ k2 ]) => weights[k1] > weights[k2] ? 1 : -1);
		watchesSortedByWeights.forEach(([ key, entry ]) => {
			entry.forEach(value => {
				newPart = newPart.replaceAll(new RegExp(`(${value})(?=([^"]*"[^"]*")*[^"]*$)(?![^\s\<])`, 'gi'), (...matches) => {
					const [ match ] = matches;
					return `${ templates[key](match) }`;
				});
			});
		});
		return newPart;
	};

	const processPlayerName = (playerName) => {
		return processTextPart(playerName).replace(playerName, `<span class="draggable" draggable="true" data-name="${ playerName }">${ playerName }</span>`);
	};

	const processTextStyles = (part) => {
		return part.replaceAll(/§([0-9a-fklmno])(.*)/gi, (...args) => {
			const [ , key, rest ] = args;
			return `<span style="${ textStyleMap[key] }">${ processTextStyles(rest) }</span>`;
		});
	};

	const setupDragListeners = () => {
		setTimeout(function () {
			list.querySelectorAll('.draggable').forEach(element => {
				element.addEventListener('dragstart', (e) => {
					e.dataTransfer.setData('text/plain', e.target.dataset.name);
					return true;
				});
			});
		});
	};

	const paginate = (data, limit) => {
		const messageCount = limit ?? getMessageCount();
		const currentPage = getCurrentPage();

		const rangeFrom = (data.length - messageCount * (currentPage + 1));
		const rangeTo = (data.length - messageCount * currentPage);
		setPageCount(Math.ceil(data.length / messageCount));

		return data.slice(rangeFrom <= 0 ? 0 : rangeFrom, rangeTo);
	};

	const detectTextType = (text) => {
		if (logType.death.test(text)) {
			return 'death';
		}
		if (logType.items.test(text)) {
			return 'items';
		}
		if (logType.legendarySpawn.test(text)) {
			return 'legendarySpawn';
		}
		if (logType.pokemonTrade.test(text)) {
			return 'pokemonTrade';
		}
		return 'chat';
	};

	let tradeForm;

	const updateLogContent = async () => {
		list.innerHTML = '';
		let textType = 'chat';
		if (text instanceof Array) {
			let result = [];
			for (let part of text) {
				if (part.text.length) {
					textType = detectTextType(part.text);
					const parsedData = parsers[textType](part.text, part.date);
					result = [...result, ...filters[textType](parsedData, filterValue)];
				}
			}
			const paginatedData = paginate(result, (textType === 'death' || textType === 'pokemonTrade') ? 50 : getMessageCount());
			list.innerHTML += await renderTemplates[textType](paginatedData, processPlayerName, processTextPart, processTextStyles);
			setupDragListeners();
			return;
		}
		textType = detectTextType(text);
		const parsedData = parsers[textType](text);
		const filteredData = filters[textType](parsedData, filterValue);
		const paginatedData = paginate(filteredData, (textType === 'death' || textType === 'pokemonTrade') ? 50 : getMessageCount());
		list.innerHTML += await renderTemplates[textType](paginatedData, processPlayerName, processTextPart, processTextStyles);
		if (textType === 'pokemonTrade' && !tradeForm) {
			tradeForm = $element(`
				<div class="trade-form">
					<input type="text" id="trade-from" style="width: 100px;"/>
					<img src="/trade-icon-color.svg" alt="Trade icon" style="width: 60px;"/>
					<input type="text" id="trade-to" style="width: 100px;"/>
				</div>
			`);
			const tradeFrom = tradeForm.querySelector('#trade-from');
			const tradeTo = tradeForm.querySelector('#trade-to');
			const onPlayerNameInput = (e) => {
				if (tradeFrom.value.length > 0 || tradeTo.value.length > 0) {
					filterValue = `(?=.*${ tradeFrom.value })(?=.*${ tradeTo.value })`;
				} else {
					filterValue = textSearchInput.value;
				}
				setCurrentPage(0);
				updateLogContent();
			};
			tradeFrom.addEventListener('input', onPlayerNameInput);
			tradeTo.addEventListener('input', onPlayerNameInput);
			controls.querySelector('.controls__inputs div:nth-child(3)').after(tradeForm);
		}
		setupDragListeners();
	};

	let text = '';

	const fetchLogs = () => {
		let cancelled = false;

		const update = async () => {
			if (!cancelled) {
				const now = new Date();
				const fileName = actualLogsCheck.checked ? `${ dateFormatter.format(now).replaceAll('.', '-') }.txt` : window.updateUrl.split("/").pop();
				const fileURL = '/api/logs?url=' + encodeURIComponent(logsURLBase + fileName);
				const response = await fetch(fileURL);
				text = await response.text();

				lines = text.split('\n').filter(Boolean);
				updateLogContent();

				await delay(getUpdateTime() * 1000);
				await update();
			}
		};

		update();

		return () => {
			cancelled = true;
		};
	};
	cancelLoopRef = fetchLogs();
})();