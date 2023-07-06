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

const dissolveAnim = keyframes`
	0% {
		opacity: 1;
	}
	50% {
		opacity: 1;
	}
	70% {
		clip: rect(2px, 9999px, 4px, 0);
	}
	75% {
		clip: rect(6px, 9999px, 17px, 0);
	}
	80% {
		clip: rect(9px, 9999px, 19px, 0);
	}
	85% {
		clip: rect(17px, 9999px, 7px, 0);
	}
	90% {
		clip: rect(22px, 9999px, 14px, 0);
	}
	95% {
		clip: rect(10px, 9999px, 7px, 0);
	}
	100% {
		clip: rect(15px, 9999px, 2px, 0);
	}
`;

const pathsAnim = keyframes`
	0% {
		clip-path: polygon(
				0% 43%,
				83% 43%,
				83% 22%,
				23% 22%,
				23% 24%,
				91% 24%,
				91% 26%,
				18% 26%,
				18% 83%,
				29% 83%,
				29% 17%,
				41% 17%,
				41% 39%,
				18% 39%,
				18% 82%,
				54% 82%,
				54% 88%,
				19% 88%,
				19% 4%,
				39% 4%,
				39% 14%,
				76% 14%,
				76% 52%,
				23% 52%,
				23% 35%,
				19% 35%,
				19% 8%,
				36% 8%,
				36% 31%,
				73% 31%,
				73% 16%,
				1% 16%,
				1% 56%,
				50% 56%,
				50% 8%
		);
	}

	5% {
		clip-path: polygon(
				0% 29%,
				44% 29%,
				44% 83%,
				94% 83%,
				94% 56%,
				11% 56%,
				11% 64%,
				94% 64%,
				94% 70%,
				88% 70%,
				88% 32%,
				18% 32%,
				18% 96%,
				10% 96%,
				10% 62%,
				9% 62%,
				9% 84%,
				68% 84%,
				68% 50%,
				52% 50%,
				52% 55%,
				35% 55%,
				35% 87%,
				25% 87%,
				25% 39%,
				15% 39%,
				15% 88%,
				52% 88%
		);
	}

	30% {
		clip-path: polygon(
				0% 53%,
				93% 53%,
				93% 62%,
				68% 62%,
				68% 37%,
				97% 37%,
				97% 89%,
				13% 89%,
				13% 45%,
				51% 45%,
				51% 88%,
				17% 88%,
				17% 54%,
				81% 54%,
				81% 75%,
				79% 75%,
				79% 76%,
				38% 76%,
				38% 28%,
				61% 28%,
				61% 12%,
				55% 12%,
				55% 62%,
				68% 62%,
				68% 51%,
				0% 51%,
				0% 92%,
				63% 92%,
				63% 4%,
				65% 4%
		);
	}

	45% {
		clip-path: polygon(
				0% 33%,
				2% 33%,
				2% 69%,
				58% 69%,
				58% 94%,
				55% 94%,
				55% 25%,
				33% 25%,
				33% 85%,
				16% 85%,
				16% 19%,
				5% 19%,
				5% 20%,
				79% 20%,
				79% 96%,
				93% 96%,
				93% 50%,
				5% 50%,
				5% 74%,
				55% 74%,
				55% 57%,
				96% 57%,
				96% 59%,
				87% 59%,
				87% 65%,
				82% 65%,
				82% 39%,
				63% 39%,
				63% 92%,
				4% 92%,
				4% 36%,
				24% 36%,
				24% 70%,
				1% 70%,
				1% 43%,
				15% 43%,
				15% 28%,
				23% 28%,
				23% 71%,
				90% 71%,
				90% 86%,
				97% 86%,
				97% 1%,
				60% 1%,
				60% 67%,
				71% 67%,
				71% 91%,
				17% 91%,
				17% 14%,
				39% 14%,
				39% 30%,
				58% 30%,
				58% 11%,
				52% 11%,
				52% 83%,
				68% 83%
		);
	}

	76% {
		clip-path: polygon(
				0% 26%,
				15% 26%,
				15% 73%,
				72% 73%,
				72% 70%,
				77% 70%,
				77% 75%,
				8% 75%,
				8% 42%,
				4% 42%,
				4% 61%,
				17% 61%,
				17% 12%,
				26% 12%,
				26% 63%,
				73% 63%,
				73% 43%,
				90% 43%,
				90% 67%,
				50% 67%,
				50% 41%,
				42% 41%,
				42% 46%,
				50% 46%,
				50% 84%,
				96% 84%,
				96% 78%,
				49% 78%,
				49% 25%,
				63% 25%,
				63% 14%
		);
	}

	90% {
		clip-path: polygon(
				0% 41%,
				13% 41%,
				13% 6%,
				87% 6%,
				87% 93%,
				10% 93%,
				10% 13%,
				89% 13%,
				89% 6%,
				3% 6%,
				3% 8%,
				16% 8%,
				16% 79%,
				0% 79%,
				0% 99%,
				92% 99%,
				92% 90%,
				5% 90%,
				5% 60%,
				0% 60%,
				0% 48%,
				89% 48%,
				89% 13%,
				80% 13%,
				80% 43%,
				95% 43%,
				95% 19%,
				80% 19%,
				80% 85%,
				38% 85%,
				38% 62%
		);
	}
	
	95% {
		clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
	}
	
	98% {
		clip-path: polygon(0 0, 0 0, 0 0, 0 0);
	}

	1%,
	7%,
	33%,
	47%,
	78%,
	93% {
		clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
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
	animation: ${ glitchSkew } 1s infinite linear alternate-reverse, ${ dissolveAnim } 1s infinite ease-out, ${ pathsAnim } 2s step-end infinite;
	overflow: hidden;

	--r: 0;
	--g: 0;
	--b: 0;
	--a: 0;
	animation: glitch 60s linear infinite;
	
	&::before {
		${ GlitchMixin };
		left: 2px;
		color: transparent;
		text-shadow: -2px 0 #ff00c1;
		clip: rect(44px, 450px, 56px, 0);
		animation: ${ glitchAnim } 5s infinite linear alternate-reverse;
	}
	
	&::after {
		${ GlitchMixin };
		left: -2px;
		color: transparent;
		text-shadow: -2px 0 #00fff9, 2px 2px #ff00c1;
		animation: ${ glitchAnim2 } 1s infinite linear alternate-reverse;
	}
`;

type TGetRandomCharSequenceFn = (length: number, characters?: string) => string;
const getRandomCharSequence: TGetRandomCharSequenceFn = (length, characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~!-_=?'): string => {
	return Array.from({ length }).map(() => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
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

		const setContainerText = (value: string) => {
			if (container.current) {
				container.current.innerText = value;
				container.current?.setAttribute('data-text', value);
			}
		};

		const onAnimationIteration = (e: any) => {
			if (e.animationName === pathsAnim.getName()) {
				if (container.current) {
					const seq = getRandomCharSequence(text.length);
					setContainerText(seq);
				}
			}
		};

		if (container.current) {
			container.current.addEventListener('animationiteration', onAnimationIteration);
		}

		const drawText = async () => {
			if (container.current) {
				const currentText = container.current.innerText;
				const randomCharIndex = Math.floor(Math.random() * currentText.length);
				const changedSequence = currentText.replace(currentText[randomCharIndex], getRandomCharSequence(1));
				setContainerText(changedSequence);
				await delay(Math.random() * 100);
				animationFrame = window.requestAnimationFrame(drawText);
			}
		};

		drawText();

		return () => {
			if (container.current) {
				container.current.removeEventListener('animationiteration', onAnimationIteration);
			}
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
