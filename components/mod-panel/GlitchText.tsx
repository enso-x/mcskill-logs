import React, { useEffect, useRef } from 'react';
import styled, { css, keyframes } from 'styled-components';

const glitchAnim = keyframes`
	0% {
		clip: rect(43px, 9999px, 13px, 0);
		transform: skew(0.62deg);
	}
	5% {
		clip: rect(66px, 9999px, 13px, 0);
		transform: skew(0.34deg);
	}
	10% {
		clip: rect(86px, 9999px, 39px, 0);
		transform: skew(0.61deg);
	}
	15% {
		clip: rect(33px, 9999px, 76px, 0);
		transform: skew(0.7deg);
	}
	20% {
		clip: rect(13px, 9999px, 79px, 0);
		transform: skew(0.78deg);
	}
	25% {
		clip: rect(23px, 9999px, 15px, 0);
		transform: skew(0.79deg);
	}
	30% {
		clip: rect(69px, 9999px, 71px, 0);
		transform: skew(0.88deg);
	}
	35% {
		clip: rect(38px, 9999px, 13px, 0);
		transform: skew(0.45deg);
	}
	40% {
		clip: rect(28px, 9999px, 43px, 0);
		transform: skew(0.67deg);
	}
	45% {
		clip: rect(56px, 9999px, 37px, 0);
		transform: skew(0.49deg);
	}
	50% {
		clip: rect(57px, 9999px, 88px, 0);
		transform: skew(0.42deg);
	}
	55% {
		clip: rect(6px, 9999px, 43px, 0);
		transform: skew(0.3deg);
	}
	60% {
		clip: rect(33px, 9999px, 4px, 0);
		transform: skew(0.06deg);
	}
	65% {
		clip: rect(13px, 9999px, 83px, 0);
		transform: skew(0.94deg);
	}
	70% {
		clip: rect(53px, 9999px, 12px, 0);
		transform: skew(0.39deg);
	}
	75% {
		clip: rect(63px, 9999px, 15px, 0);
		transform: skew(0.23deg);
	}
	80% {
		clip: rect(72px, 9999px, 47px, 0);
		transform: skew(0.87deg);
	}
	85% {
		clip: rect(24px, 9999px, 11px, 0);
		transform: skew(0.77deg);
	}
	90% {
		clip: rect(21px, 9999px, 9px, 0);
		transform: skew(0.35deg);
	}
	95% {
		clip: rect(59px, 9999px, 44px, 0);
		transform: skew(0.08deg);
	}
	100% {
		clip: rect(81px, 9999px, 85px, 0);
		transform: skew(0.33deg);
	}
`;

const glitchAnim2 = keyframes`
	0% {
		clip: rect(75px, 9999px, 34px, 0);
		transform: skew(0.36deg);
	}
	5% {
		clip: rect(45px, 9999px, 95px, 0);
		transform: skew(0.31deg);
	}
	10% {
		clip: rect(80px, 9999px, 10px, 0);
		transform: skew(0.59deg);
	}
	15% {
		clip: rect(28px, 9999px, 94px, 0);
		transform: skew(0.83deg);
	}
	20% {
		clip: rect(73px, 9999px, 64px, 0);
		transform: skew(0.49deg);
	}
	25% {
		clip: rect(19px, 9999px, 46px, 0);
		transform: skew(0.87deg);
	}
	30% {
		clip: rect(96px, 9999px, 80px, 0);
		transform: skew(0.56deg);
	}
	35% {
		clip: rect(6px, 9999px, 31px, 0);
		transform: skew(0.29deg);
	}
	40% {
		clip: rect(53px, 9999px, 51px, 0);
		transform: skew(0.09deg);
	}
	45% {
		clip: rect(2px, 9999px, 76px, 0);
		transform: skew(0.67deg);
	}
	50% {
		clip: rect(90px, 9999px, 1px, 0);
		transform: skew(0.2deg);
	}
	55% {
		clip: rect(12px, 9999px, 49px, 0);
		transform: skew(0.92deg);
	}
	60% {
		clip: rect(66px, 9999px, 86px, 0);
		transform: skew(0.07deg);
	}
	65% {
		clip: rect(25px, 9999px, 23px, 0);
		transform: skew(0.5deg);
	}
	70% {
		clip: rect(60px, 9999px, 72px, 0);
		transform: skew(0.23deg);
	}
	75% {
		clip: rect(75px, 9999px, 63px, 0);
		transform: skew(0.71deg);
	}
	80% {
		clip: rect(15px, 9999px, 65px, 0);
		transform: skew(0.55deg);
	}
	85% {
		clip: rect(11px, 9999px, 2px, 0);
		transform: skew(0.5deg);
	}
	90% {
		clip: rect(69px, 9999px, 54px, 0);
		transform: skew(0.34deg);
	}
	95% {
		clip: rect(63px, 9999px, 54px, 0);
		transform: skew(0.31deg);
	}
	100% {
		clip: rect(22px, 9999px, 56px, 0);
		transform: skew(0.47deg);
	}
`;

const glitchSkew = keyframes`
	0% {
		transform: skew(4deg);
	}
	10% {
		transform: skew(1deg);
	}
	20% {
		transform: skew(-1deg);
	}
	30% {
		transform: skew(-1deg);
	}
	40% {
		transform: skew(-1deg);
	}
	50% {
		transform: skew(2deg);
	}
	60% {
		transform: skew(-1deg);
	}
	70% {
		transform: skew(0deg);
	}
	80% {
		transform: skew(4deg);
	}
	90% {
		transform: skew(1deg);
	}
	100% {
		transform: skew(1deg);
	}
`;

const GlitchMixin = css`
	content: attr(data-text);
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
`;

const GlitchContainer = styled.span`
	position: relative;
	font-size: 16px;
	font-family: monospace;
	animation: ${ glitchSkew } 1s infinite linear alternate-reverse;
	
	&::before {
		${ GlitchMixin };
		left: 2px;
		text-shadow: -2px 0 #ff00c1;
		clip: rect(44px, 450px, 56px, 0);
		animation: ${ glitchAnim } 5s infinite linear alternate-reverse;
	}
	
	&::after {
		${ GlitchMixin };
		left: -2px;
		text-shadow: -2px 0 #00fff9, 2px 2px #ff00c1;
		animation: ${ glitchAnim2 } 1s infinite linear alternate-reverse;
	}
`;

const getRandomCharSequence = (length: number): string => {
	let result = '';
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~!-_=?';
	const charactersLength = characters.length;
	let counter = 0;
	while (counter < length) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
		counter += 1;
	}
	return result;
};

const delay = async (ms: number) => new Promise(res => setTimeout(res, ms));

interface IGlitchTextProps {
	text: string;
	className?: string;
}

export function GlitchText({
	text,
	className
}: IGlitchTextProps) {
	const container = useRef<HTMLSpanElement | null>(null);

	useEffect(() => {
		let animationFrame: number;

		const drawText = async () => {
			if (container.current) {
				container.current.innerText = getRandomCharSequence(text.length);
				await delay(1000 / 10);
				animationFrame = window.requestAnimationFrame(drawText);
			}
		};

		drawText();

		return () => {
			if (animationFrame) {
				window.cancelAnimationFrame(animationFrame);
			}
		};
	}, []);

	return (
		<GlitchContainer ref={ container } className={ className } data-text={ text }>
			{ text }
		</GlitchContainer>
	);
}
