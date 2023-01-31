import React, { ChangeEventHandler, useState } from 'react';
import Page from '@/components/Page';
import { NextPage } from 'next';

import styled from 'styled-components';

const Container = styled.div`
	height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 16px;
	gap: 16px;
`;

const dateFormatter = Intl.DateTimeFormat('ru-RU', {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit'
});

const Box = styled.div`
	display: flex;
	flex-direction: column;
	width: 600px;
	gap: 16px;
`;

const QuestionsBox = styled(Box)`
	max-height: 400px;
	overflow-y: auto;
`;

const InterviewPage: NextPage<void> = () => {
	const [ step, setStep ] = useState<string>('auth');
	const [ password, setPassword ] = useState<string>('');
	const [ grades, setGrades ] = useState<{ name: string; fileName: string; }[]>([]);
	const [ selectedGrade, setSelectedGrade ] = useState<string>('');
	const [ grade, setGrade ] = useState<{ name: string, questions: { question: string; answer: string; }[] }>();
	const [ playerName, setPlayerName ] = useState<string>('');
	const [ questionsCountValue, setQuestionsCountValue ] = useState<string>('0');
	const [ questionsCount, setQuestionsCount ] = useState<number>(0);
	const [ questions, setQuestions ] = useState<{ question: string; answer: string; }[]>([]);
	const [ currentQuestion, setCurrentQuestion ] = useState<number>(0);
	const [ currentQuestionPointsValue, setCurrentQuestionPointsValue ] = useState<string>('');
	const [ currentQuestionPoints, setCurrentQuestionPoints ] = useState<number>(0);
	const [ results, setResults ] = useState<{ question: string; points: number; }[]>([]);

	const shuffleArray = (array: any[]) => {
		let currentIndex = array.length;
		let randomIndex;

		while (currentIndex != 0) {
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;

			[ array[currentIndex], array[randomIndex] ] = [
				array[randomIndex], array[currentIndex] ];
		}

		return array;
	};

	const onPasswordInput: React.ChangeEventHandler<HTMLInputElement> = (e) => {
		setPassword(e.target.value);
	};

	const onAuthClick = async () => {
		const response = await fetch('/api/grades/available', {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				password
			})
		});
		if (response.status === 200) {
			const data = await response.json();
			setGrades(data);
			setStep('init');
			setSelectedGrade(data[0].fileName);
		}
	};

	const onSelectChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
		setSelectedGrade(e.target.value);
	};

	const onClickSetup = async () => {
		const response = await fetch('/api/grades', {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				password,
				file: selectedGrade
			})
		});
		if (response.status === 200) {
			const data = await response.json();
			setGrade(data);
			setQuestionsCount(data.questions.length);
			setQuestionsCountValue(data.questions.length);
			setStep('settings');
		}
	};

	const onQuestionCountChange: ChangeEventHandler<HTMLInputElement> = (e) => {
		setQuestionsCountValue(e.target.value);
		if (e.target.value !== '') {
			setQuestionsCount(parseInt(e.target.value, 10));
		}
	};

	const onPlayerNameChange: ChangeEventHandler<HTMLInputElement> = (e) => {
		setPlayerName(e.target.value);
	};

	const onClickBegin = async () => {
		if (playerName && grade && questionsCount > 0) {
			setQuestions(shuffleArray(grade.questions).slice(0, questionsCount));
			setStep('test');
		}
	};

	const addToResults = () => {
		setResults(results => [ ...results, {
			question: questions[currentQuestion].question,
			points: currentQuestionPoints
		} ]);
		setCurrentQuestionPoints(0);
		setCurrentQuestionPointsValue('0');
	};

	const onCurrentQuestionPointsChange: ChangeEventHandler<HTMLInputElement> = (e) => {
		setCurrentQuestionPointsValue(e.target.value);
		if (e.target.value !== '') {
			setCurrentQuestionPoints(parseFloat(e.target.value));
		}
	};

	const onClickNextQuestion = async () => {
		if (currentQuestion < (questionsCount - 1)) {
			addToResults();
			setCurrentQuestion(current => current + 1);
		}
	};

	const onClickGetResults = async () => {
		addToResults();
		setStep('results');
	};

	return (
		<Page>
			<Container>
				{
					step === 'auth' && (
						<>
							<input type="password" onChange={ onPasswordInput }/>
							<button onClick={ onAuthClick }>Auth</button>
						</>
					)
				}
				{
					step === 'init' && (
						<>
							<select onChange={ onSelectChange }>
								{
									grades.map(grade => (
										<option key={ grade.name } value={ grade.fileName }>{ grade.name }</option>
									))
								}
							</select>
							<button onClick={ onClickSetup }>Setup</button>
						</>
					)
				}
				{
					step === 'settings' && grade && (
						<Box>
							<div>
								Player name: <input type="text" value={ playerName } onChange={ onPlayerNameChange }/>
							</div>
							<div>
								Question count: <input type="text" value={ questionsCountValue }
								                       onChange={ onQuestionCountChange }/> / { grade.questions.length }
							</div>
							<button onClick={ onClickBegin }>Begin</button>
						</Box>
					)
				}
				{
					step === 'test' && grade && playerName && questions.length && (
						<Box>
							<div>
								Player name: { playerName }<br/>
								Grade: { grade.name }<br/>
								Question: { currentQuestion + 1 } / { questionsCount }<br/>
							</div>
							<div>
								{ questions[currentQuestion].question }
							</div>
							<div>
								- { questions[currentQuestion].answer }
							</div>
							<div>
								Points: <input type="text" value={ currentQuestionPointsValue }
								               onChange={ onCurrentQuestionPointsChange }/>
							</div>
							{
								currentQuestion < (questionsCount - 1) ? (
									<button onClick={ onClickNextQuestion }>Next</button>
								) : (
									<button onClick={ onClickGetResults }>Get results</button>
								)
							}
						</Box>
					)
				}
				{
					step === 'results' && grade && playerName && results.length && (
						<Box>
							<div>
								Player name: { playerName }<br/>
								Grade: { grade.name }<br/>
								Question count: { questionsCount }<br/>
							</div>
							<Box>
								<span>Results:</span>
								<QuestionsBox>
									{
										results.map((result, i) => (
											<span
												key={ result.question }>{ i + 1 }. { result.question } <br/>- points: { result.points }</span>
										))
									}
								</QuestionsBox>
								<span>Points: { results.reduce((acc, next) => acc + next.points, 0) } / { questionsCount } ( { ((100 / questionsCount) * results.reduce((acc, next) => acc + next.points, 0)).toFixed(2) }% )</span>
							</Box>
						</Box>
					)
				}
			</Container>
		</Page>
	);
};

export default InterviewPage;
