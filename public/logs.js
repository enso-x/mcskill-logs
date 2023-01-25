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
const pokemonNamePattern = (group = null) => `(?${group ? `<${group}>` : ':'}[A-Za-z_0-9- '.é]+)`;

const imageCache = {};

const logType = {
	chat: new RegExp(`${timePattern()} ${namePattern()}: (?:.*)\\n?`, 'i'),
	connection: new RegExp(`${timePattern()} ${namePattern()} (?:(?:logged in)|(?:left the game))\\n?`, 'i'),
	death: new RegExp(`${timePattern()} - ${namePattern()} (?:.*)(?:\\n\\s{4}- .*x?\\d*)+`, 'i'),
	items: new RegExp(`${timePattern()} ${namePattern()} (?:(?:drop)|(?:pickup)): .*\\n?`, 'i'),
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
				const executedContent = (/(?:\[(?<time>(\d{2}:\d{2}(?::\d{2})?))]\s)?(?:\[(?<chatType>[GL])]\s)?(?:(?<playerName>[A-Za-z0-9_]{3,})(?<playerChat>:)?\s)?(?<worldChat>!)?(?<messageContent>.*)/gi).exec(next);
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
				const { time, playerName, reason } = new RegExp(`${timePattern('time')} - ${namePattern('playerName')} (?<reason>.+)`, 'i').exec(next).groups;
				acc.push({
					death: {
						date,
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
			const { time, playerName, actionType, item } = new RegExp(`${timePattern('time')} ${namePattern('playerName')} (?<actionType>(?:drop)|(?:pickup)): (?<item>.*)\\n?`, 'i').exec(next).groups;
			acc.push({
				date,
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
					chatType,
					playerName,
					playerChat,
					worldChat,
					messageContent
				} = item;
				const processedPlayerName = processPlayerName(playerName);
				const processedContent = processTextStyles(processTextPart(messageContent));
				template += wrappedLine(`
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
                `, original);
			}

			return template;
		}, '');
	},
	death: async (data, processPlayerName) => {
		return data.reduce((template, item) => {
			const { death, items } = item;
			const processedPlayerName = processPlayerName(death.playerName);

			template += wrappedLine(`
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
			const { date, time, playerName, actionType, item, original } = itemData;
			const processedPlayerName = processPlayerName(playerName);

			template += wrappedLine(`
				<div>
					${date ? `<span class="time">[<span>${ date.replaceAll('-', '.') }</span>]</span>` : ''}
	                <span class="time">[<span>${ time }</span>]</span>
	                <span class="player-name">${ processedPlayerName }</span>
	                <span>${actionType}</span>
	                <span>${item}</span>
                </div>
            `, original);

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
				const formatted = name.toLowerCase().replaceAll('\'', '').replaceAll('.', '').replaceAll(' ', '-').replaceAll('é', 'e');
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

	await fetch('/api/socket.io');
	const socket = io();

	socket.on('connect', () => {
		console.log('connected');
	})

	let socketData = [];
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
            
            .line\\:vertical {
                flex-direction: column;
                align-items: flex-start;
                justify-content: center;
                padding: 8px 16px;
            }
            
            .line > span {
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
                </div>
            </div>
            <div class="list-container">
                <div class="list"></div>
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
	document.querySelector('#app-root').append(root);
	const dateRangeInput = root.querySelector('#date-search-input');
	const datepicker = new Datepicker(dateRangeInput, {
		inline: true,
		multiple: true,
		ranged: true,
		separator: ':',
		toValue: async (...data) => {
			const [ value, dates ] = data;
			if (dates.length === 1 && dateFormatter.format(dates[0]) === dateFormatter.format(new Date())) {
				cancelLoopRef = fetchLogs();
			}
			if (dates.length > 1) {
				if (cancelLoopRef !== null) {
					cancelLoopRef();
				}
				list.innerHTML = '';
				const days = getDaysBetweenDates(...dates);
				socketData = [];
				socket.emit('get-logs-between-days', JSON.stringify({
					urlBase: logsURLBase,
					dates: days.map(day => dateFormatter.format(day).replaceAll('.', '-'))
				}));
			}
			return value;
		}
	});

	socket.on('logs-between-part', data => {
		socketData.push(JSON.parse(data));
	});

	socket.on('logs-between-end', async () => {
		text = [...socketData];
		await updateLogContent();
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