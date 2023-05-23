import styled from 'styled-components';

export const VerticalLayout = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
`;

export const HorizontalLayout = styled.div`
	display: flex;
	align-items: center;
	gap: 16px;
`;

export const ErrorContainer = styled(VerticalLayout)`
	width: 100%;
	height: 100%;
	justify-content: center;
	align-items: center;

	> div {
		height: 100px !important;
	}
`;
