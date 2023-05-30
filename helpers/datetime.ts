import moment from 'moment';

export const padZero = (num: number): string => {
	return num > 9 ? num.toString() : '0' + num;
};

export const toUTC = (date: string) => date.split('-').reverse().join('-');

export const timeToSeconds = (time: string): number => {
	const [ hours, minutes, seconds ] = time.split(':').map(Number);
	return (hours * 60 + minutes) * 60 + seconds;
};

export const getDaysBetweenDates = (date1: Date, date2: Date): Date[] => {
	const result = [];
	for (let day = new Date(date1); day <= date2; day.setDate(day.getDate() + 1)) {
		result.push(new Date(day));
	}
	return result;
};

export const momentDurationToString = (duration: any): string => {
	const days = duration._data.days;
	const hours = duration._data.hours;
	const minutes = duration._data.minutes;
	const seconds = duration._data.seconds;

	return `${ padZero(days * 24 + hours) }:${ padZero(minutes) }:${ padZero(seconds) }`;
};

export const getCurrentWeek = (): number => {
	return moment().subtract(1, 'day').get('week');
};
