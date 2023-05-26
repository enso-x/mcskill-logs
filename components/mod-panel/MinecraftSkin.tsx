import styled from 'styled-components';

const SkinImage = styled.img`
	max-width: 128px;
	align-self: center;
`;

interface IMinecraftSkinProps {
	username: string;
	mode: number;
}

export function MinecraftSkin({
	username,
	mode
}: IMinecraftSkinProps) {
	return (
		<SkinImage src={ `/api/users/getSkin?username=${ username }&mode=${ mode }` }
		           alt="User skin"/>
	);
}
