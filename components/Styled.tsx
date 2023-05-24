import styled, { css } from 'styled-components';

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

interface IOnlineIndicatorProps {
	$online: boolean;
}

export const OnlineIndicator = styled.span<IOnlineIndicatorProps>`
	display: block;
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: #242424;

	${ (props) => props.$online ? css`
		background: #6aff36;
		border: 1px solid #1c6800;
		box-shadow: 0 0 4px #6aff36;
	` : css`
		background: #ff3636;
		border: 1px solid #680000;
		box-shadow: 0 0 4px #ff3636;
	` }
`;
