import { useEffect, useState } from 'react';

export const asyncDebounce = <T extends Function>(callback: T, delay = 20): T => {
	let h: NodeJS.Timeout;
	const callable = (...args: any) => new Promise(resolve => {
		clearTimeout(h);
		h = setTimeout(() => resolve(callback(...args)), delay);
	});
	return <T>(<any>callable);
};

export const useDebounce = <T>(value: T, delay?: number): T => {
	const [ debouncedValue, setDebouncedValue ] = useState<T>(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

		return () => {
			clearTimeout(timer);
		};
	}, [ value, delay ]);

	return debouncedValue;
};
