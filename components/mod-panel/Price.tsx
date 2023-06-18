import React from 'react';
import styled from 'styled-components';

import { HorizontalLayout } from '@/components/Styled';
import { InfinityIcon } from '@/components/mod-panel/icons/Infinity';

const PriceContainer = styled(HorizontalLayout)`
	gap: 8px;
	
	span {
		display: inline-flex;
		line-height: 24px;
	}
`;

export const Currency = styled.i`
	display: inline-flex;
	background: url('/pixelmon/price-icon.png') center no-repeat;
	background-size: cover;
	image-rendering: pixelated;
	width: 16px;
	height: 16px;
`;

interface IPriceProps {
	value: number;
	addonBefore?: React.ReactNode;
	addonAfter?: React.ReactNode;
}

export function Price({
	value,
	addonBefore,
	addonAfter
}: IPriceProps) {
	return (
		<PriceContainer>
			{ addonBefore }
			<span>
				{
					value >= 0 ? value : (
						<InfinityIcon/>
					)
				}
			</span>
			<Currency/>
			{ addonAfter }
		</PriceContainer>
	);
}
