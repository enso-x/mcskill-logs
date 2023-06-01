import styled from 'styled-components';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const antIcon = <LoadingOutlined style={ { fontSize: 24 } } spin/>;

export const LoadingContainer = styled.div`
	display: flex;
	flex: 1;
	justify-content: center;
	align-items: center;
`;

export function Loading() {
	return (
		<Spin indicator={ antIcon }/>
	);
}
