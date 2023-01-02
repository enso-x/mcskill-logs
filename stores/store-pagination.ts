import { createStore, createEvent, createEffect } from 'effector';
import { useStore } from 'effector-react';

interface IPaginationStoreState {
	currentPage: number;
	pageCount: number;
	itemsPerPage: number;
}

const initialStoreState: IPaginationStoreState = {
	currentPage: 0,
	pageCount: 1,
	itemsPerPage: 500
};

const paginationStore = createStore<IPaginationStoreState>(initialStoreState);

export const setCurrentPage = createEvent<number>('paginationStore:setCurrentPage');
export const setPageCount = createEvent<number>('paginationStore:setPageCount');
export const setItemsPerPage = createEvent<number>('paginationStore:setItemsPerPage');

paginationStore.on(setCurrentPage, (state, currentPage) => ({
	...state,
	currentPage
}));

paginationStore.on(setPageCount, (state, pageCount) => ({
	...state,
	pageCount
}));

paginationStore.on(setItemsPerPage, (state, itemsPerPage) => ({
	...state,
	itemsPerPage
}));

export const usePaginationStore = () => {
	return useStore(paginationStore);
};
