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
const namePattern = (group = null) => `(?${group ? `<${group}>` : ':'}[A-Za-z_0-9]+)`;

const logType = {
	chat: new RegExp(`${timePattern()} ${namePattern()}: (?:.*)\\n?`, 'i'),
	connection: new RegExp(`${timePattern()} ${namePattern()} (?:(?:logged in)|(?:left the game))\\n?`, 'i'),
	death: new RegExp(`${timePattern()} - ${namePattern()} (?:.*)(?:\\n\\s{4}- .*x?\\d*)+`, 'i'),
	items: new RegExp(`${timePattern()} ${namePattern()} (?:(?:drop)|(?:pickup)): .*\\n`, 'i'),
	legendarySpawn: new RegExp(`${timePattern()} ${namePattern()} - ${namePattern()}\\n?`, 'i'),
	pokemonTrade: new RegExp(`${timePattern()} Игрок ${namePattern()} обменял покемона ${namePattern()} на покемона ${namePattern()} игрока ${namePattern()}`, 'i')
};

const parsers = {
	chat: new RegExp(`${timePattern()} ${namePattern()}: (?:.*)\\n?`, 'i'),
	connection: new RegExp(`${timePattern()} ${namePattern()} (?:(?:logged in)|(?:left the game))\\n?`, 'i'),
	death: (text) => {
		return text.split('\n').filter(Boolean).reduce((acc, next) => {
			if (next.startsWith('[')) {
				const { time, playerName, reason } = new RegExp(`${timePattern('time')} - ${namePattern('playerName')} (?<reason>.+)`, 'i').exec(next).groups;
				acc.push({
					death: {
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
	items: new RegExp(`${timePattern()} ${namePattern()} (?:(?:drop)|(?:pickup)): .*\\n`, 'i'),
	legendarySpawn: new RegExp(`${timePattern()} ${namePattern()} - ${namePattern()}\\n?`, 'i'),
	pokemonTrade: new RegExp(`${timePattern()} Игрок ${namePattern()} обменял покемона ${namePattern()} на покемона ${namePattern()} игрока ${namePattern()}`, 'i')
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
                right: 8px;
                display: flex;
                align-items: center;
                padding: 8px;
                gap: 8px;
                background: rgba(0,0,0,0.8);
                border-radius: 4px;
            }
            
            .pagination__button {
                cursor: pointer;
            }
            
            .pagination__text {
                display: flex;
                width: 100px;
                height: 100%;
                align-items: center;
                justify-content: center;
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
                background: #0f0f0f;
                border-right: 1px solid rgba(255, 255, 255, 0.2);
                padding: 8px;
                overflow-y: auto;
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
            
            #text-search-input {
                width: 100%;
            }
            
            #actual-logs {
                margin: 0;
            }
            
            #message-count, #update-time {
                width: 40px;
                text-align: center;
            }
            #message-count::-webkit-outer-spin-button,
            #message-count::-webkit-inner-spin-button,
            #update-time::-webkit-outer-spin-button,
            #update-time::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
    
            .watch-list {
                display: flex;
                flex-direction: column;
                gap: 4px;
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
                border: 1px solid rgba(255, 255, 255, 0.2);
                padding: 4px;
                border-radius: 4px;
                background: #222;
            }
    
            .watch-list__button-remove {
                border: 1px solid #FF0147;
                border-radius: 4px;
                background: transparent;
                color: #FF0147;
                cursor: pointer;
            }
    
            .list {
                display: flex;
                flex-direction: column-reverse;
                padding: 0 8px 8px;
            }
    
            .line {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                padding: 2px 0;
                gap: 8px;
            }
    
            .line:not(:last-child) {
                border-top: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .line\\:vertical {
                flex-direction: column;
                align-items: flex-start;
                justify-content: center;
                padding: 4px 0;
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
                <label class="checkbox" title="Загружать логи с учетом нового дня (по времени компьютера)">
                    <input type="checkbox" id="actual-logs"/>
                    <span>Показывать актуальные логи</span>
                </label>
                <div class="controls__inputs">
                    <div>
                        Показывать <input type="number" id="message-count" min="0" max="500" step="1" value="${ getMessageCount() ?? 500 }"/> <span id="message-count-decline">${ decline(getMessageCount(), [ 'сообщение', 'сообщения', 'сообщений' ]) }</span>.
                    </div>
                    <div>
                        Обновлять каждые: <input type="number" id="update-time" value="${ getUpdateTime() ?? 2 }" min="1" step="1"/> <span id="update-time-decline">${ decline(getUpdateTime(), [ 'секунду', 'секунды', 'секунд' ]) }</span>.
                    </div>
                    <div>
                        <br/>
                        Фильтр по тексту:<br/>
                        <input type="text" id="text-search-input"/>
					</div>
                </div>
            </div>
            <div class="list"></div>
            <div class="pagination">
                <button class="pagination__button" id="page-prev">◀</button>
                <span class="pagination__text" id="page-text">Страница ${ getCurrentPage() + 1 }</span>
                <button class="pagination__button" id="page-next">▶</button>
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
		paginationText.innerHTML = `Страница ${ newPage + 1 }`;
		setCurrentPage(newPage);
		updateLogContent();
	};
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
	document.querySelector('#app-root').append(root);

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
                    <button type="button" class="watch-list__button-remove">
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

	const wrappedLine = (content, original = '', vertical = false) => {
		return `<span class="line ${vertical ? 'line:vertical' : ''}" ${original ? `title="${ original }"` : ''}>${ content }</span>`;
	};

	const processLogText = (text) => {
		if (!text) {
			list.innerHTML = '';
			return;
		}
		if (oldLog === text) {
			return;
		}
		oldLog = text;
		list.innerHTML = text.split('\n').map(line => {
			let newLine;
			if (line.includes('issued')) {
				const executedContent = (/(?:\[(?<time>(\d{2}:\d{2}(?::\d{2})?))]\s)?(?<playerName>[A-Za-z0-9_]{3,}) issued server command: (?<command>\/.*)/gi).exec(line);
				if (!executedContent) {
					return wrappedLine(line, line);
				}
				const {
					time,
					playerName,
					command
				} = executedContent.groups;
				const processedPlayerName = processPlayerName(playerName);
				const processedText = processTextPart('issued server command:');
				const processedCommand = processTextPart(command);
				newLine = wrappedLine(`
                    <span class="time">[<span>${ time }</span>]</span>
                    <span class="player-name">${ processedPlayerName }</span>
                    <span>${ processedText }</span>
                    <span class="draggable" draggable="true" data-name="${ command }">${ processedCommand }</span>
                `, line);
			} else {
				const executedContent = (/(?:\[(?<time>(\d{2}:\d{2}(?::\d{2})?))]\s)?(?:\[(?<chatType>[GL])]\s)?(?:(?<playerName>[A-Za-z0-9_]{3,})(?<playerChat>:)?\s)?(?<worldChat>!)?(?<messageContent>.*)/gi).exec(line);
				if (!executedContent) {
					return wrappedLine(line);
				}
				const {
					time,
					chatType,
					playerName,
					playerChat,
					worldChat,
					messageContent
				} = executedContent.groups;
				const processedPlayerName = processPlayerName(playerName);
				const processedContent = processTextStyles(processTextPart(messageContent));
				newLine = wrappedLine(`
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
                `, line);
			}

			return newLine;
		}).join('');
		setTimeout(function () {
			list.querySelectorAll('.draggable').forEach(element => {
				element.addEventListener('dragstart', (e) => {
					e.dataTransfer.setData('text/plain', e.target.dataset.name);
					return true;
				});
			});
		});
	};

	const processParsedData = (data) => {
		list.innerHTML = data.reduce((template, item) => {
			const { death, items } = item;
			const processedPlayerName = processPlayerName(death.playerName);

			template += wrappedLine(`
				<div>
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
	};

	const updateLogContent = () => {
		if (logType.death.test(text)) {
			const parsedData = parsers.death(text);
			processParsedData(parsedData);
		} else {
			const messageCount = getMessageCount();
			const currentPage = getCurrentPage();
			const filteredLines = lines.filter(value => filterValue.length > 0 ? value.toLowerCase().includes(filterValue.toLowerCase()) : true);
			const rangeFrom = (filteredLines.length - messageCount * (currentPage + 1));
			const rangeTo = (filteredLines.length - messageCount * currentPage);
			const logText = filteredLines.slice(rangeFrom <= 0 ? 0 : rangeFrom, rangeTo).join('\n');
			pageCount = Math.ceil(filteredLines.length / messageCount);
			processLogText(logText);
		}
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