import React from 'react';
import styled from 'styled-components';

type TSelectItem = {
	value: string;
	label?: string;
};

type TSelectGroupItem = {
	label: string;
	options: TSelectItem[];
};

interface ISelect {
	options: Array<TSelectItem | TSelectGroupItem>;
	onChange?: (value: string) => void;
	placeholder?: string;
	dropdownRender?: (menu: React.ReactNode) => React.ReactNode;
}

const StyledSelect = styled.div`
	
`;

export const Select: React.FC<ISelect> = (props) => {
	return null;
};
