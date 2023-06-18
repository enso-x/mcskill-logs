import { useEffect, useState, FC } from 'react';
import styled from 'styled-components';

import { Loading } from '@/components/mod-panel/Loading';
import { getImage2DContext, getImageFromBase64, loadImageAsBase64 } from '@/helpers/image';

interface IMinecraftSkinViewerContainerProps {
	imageData: string;
}

const MinecraftSkinViewerContainer = styled.div<IMinecraftSkinViewerContainerProps>`
	display: flex;
	justify-content: center;
	align-items: center;

	.mc-skin-viewer * {
		background-image: url(${ props => props.imageData });
	}
`;

interface IBlockPartsProps {
	className: string;
	is2D?: boolean;
}

const BlockParts: FC<IBlockPartsProps> = ({
	className,
	is2D
}) => {
	return is2D ? (
		<div className={ className }>
			<div className="front"></div>
			<div className="accessory">
				<div className="front"></div>
			</div>
		</div>
	) : (
		<div className={ className }>
			<div className="top"></div>
			<div className="left"></div>
			<div className="front"></div>
			<div className="right"></div>
			<div className="back"></div>
			<div className="bottom"></div>
			<div className="accessory">
				<div className="top"></div>
				<div className="left"></div>
				<div className="front"></div>
				<div className="right"></div>
				<div className="back"></div>
				<div className="bottom"></div>
			</div>
		</div>
	);
};

interface IMinecraftSkinViewer3DProps {
	username: string;
	is2D?: boolean;
}

export function MinecraftSkinViewer3D({
	username,
	is2D,
}: IMinecraftSkinViewer3DProps) {
	const [ skinType, setSkinType ] = useState<string>('');
	const [ skinData, setSkinData ] = useState<string>('');

	useEffect(() => {
		(async () => {
			const imageBase64 = await loadImageAsBase64(`/api/users/getSkin?username=${ username }&mode=full`);
			if (!imageBase64) return;

			setSkinData(imageBase64);

			const imageElement = await getImageFromBase64(imageBase64);
			if (!imageElement) return;

			const imageContext = await getImage2DContext(imageElement);
			if (!imageContext) return;

			const imageScaleFactor = imageElement.width / 64;
			const isSkinTypeSlim = imageContext.getImageData(
				50 * imageScaleFactor,
				16 * imageScaleFactor,
				2 * imageScaleFactor,
				4 * imageScaleFactor
			).data.every(byte => byte === 0);

			setSkinType(isSkinTypeSlim ? 'slim' : '');
		})();
	}, [ username ]);

	return (
		<MinecraftSkinViewerContainer imageData={ skinData }>
			{
				skinData.length ? (
					<div className={ `mc-skin-viewer mc-skin-viewer-11x legacy legacy-cape ${ skinType } ${is2D ? '' : 'spin'}` }>
						<div className="player">
							<BlockParts className="head" is2D={is2D}/>
							<BlockParts className="body" is2D={is2D}/>
							<BlockParts className="left-arm" is2D={is2D}/>
							<BlockParts className="right-arm" is2D={is2D}/>
							<BlockParts className="left-leg" is2D={is2D}/>
							<BlockParts className="right-leg" is2D={is2D}/>
							{/*<div className="cape">*/ }
							{/*	<div className="top"></div>*/ }
							{/*	<div className="left"></div>*/ }
							{/*	<div className="front"></div>*/ }
							{/*	<div className="right"></div>*/ }
							{/*	<div className="back"></div>*/ }
							{/*	<div className="bottom"></div>*/ }
							{/*</div>*/ }
						</div>
					</div>
				) : (
					<Loading/>
				)
			}
		</MinecraftSkinViewerContainer>
	);
}
