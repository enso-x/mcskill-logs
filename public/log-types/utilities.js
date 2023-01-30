const getRegexp = (filter) => {
	if (!filter) {
		return false;
	}

	let reg;
	try {
		reg = new RegExp(filter);
	} catch (e) {
		reg = false;
	}
	return reg;
};

export const doTestValue = (value, filter) => {
	const reg = getRegexp(filter);
	return filter.length > 0 ? (value.toLowerCase().includes(filter.toLowerCase()) || (reg && reg.test(value))) : true;
};

export const basicTextFilter = (text, filter, date) => {
	return prepareTextForParsing(text).filter(value => doTestValue(value, filter)).map(value => [ value, date ]);
};

export const basicPaginator = (data, currentPage, limit) => {
	const rangeFrom = (data.length - limit * (currentPage + 1));
	const rangeTo = (data.length - limit * currentPage);

	const pageCount = Math.ceil(data.length / limit);
	const dataSlice = data.slice(rangeFrom <= 0 ? 0 : rangeFrom, rangeTo);

	return [ dataSlice, pageCount ];
};

export const prepareTextForParsing = (text) => {
	return text.split('\n').filter(Boolean);
};

export const basicLineParse = (context) => (line, date, valueMapper) => {
	const parsedData = context.parser.exec(line).groups;
	const result = {
		...parsedData,
		original: line,
		date: parsedData.date ?? date
	};
	if (valueMapper) {
		return valueMapper(result);
	}
	return result;
};

export const basicParse = (context) => (data, valueMapper) => {
	return data.map(line => {
		const [ text, date ] = line;
		return basicLineParse(context)(text, date, valueMapper);
	});
};

export const wrappedLine = (content, original = '', vertical = false) => {
	return `<span class="line ${ vertical ? 'line:vertical' : '' }" ${ original ? `title="${ original }"` : '' }>${ content }</span>`;
};
