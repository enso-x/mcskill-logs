import React, { ChangeEventHandler, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { NextPage } from 'next';
import { Button, Card, Descriptions, Input, InputNumber, Select, Space, Table, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';

import { protectedRoute } from '@/middleware/protectedRoute';
import { ModPanelPage, ModPanelPageContent, ModPanelPageControls } from '@/components/mod-panel/ModPanelPage';
import { EUserRoles, IUser } from '@/interfaces/User';
import { ITestResult } from '@/models/TestResult';
import { useSession } from 'next-auth/react';
import { Loading, LoadingContainer } from '../../../components/mod-panel/Loading';

const { Title } = Typography;

interface IResultsTableData {
	key: number;
	question: string;
	points: number;
}

interface ITestResultsTableData extends ITestResult {
	timestamp: Date;
}

const resultTableColumns: ColumnsType<IResultsTableData> = [
	{
		title: '№',
		width: 60,
		align: 'center',
		dataIndex: 'key',
		key: 'key',
		fixed: 'left'
	},
	{
		title: 'Вопрос',
		dataIndex: 'question',
		key: 'question'
	},
	{
		title: 'Очки',
		width: 100,
		dataIndex: 'points',
		key: 'points',
		fixed: 'right'
	}
];

const testResultsTableColumns: ColumnsType<ITestResultsTableData> = [
	{
		title: 'Дата и время',
		dataIndex: 'timestamp',
		key: 'timestamp',
		render: (text, record, index) => dateFormatter.format(new Date(text))
	},
	{
		title: 'Проводил',
		dataIndex: 'author',
		key: 'author'
	},
	{
		title: 'Ник игрока',
		dataIndex: 'player',
		key: 'player'
	},
	{
		title: 'Должность',
		dataIndex: 'grade',
		key: 'grade'
	},
	{
		title: 'Кол-во вопросов',
		dataIndex: 'questionCount',
		key: 'questionCount'
	},
	{
		title: 'Набранные очки',
		width: 100,
		dataIndex: 'points',
		key: 'points',
		render: (text, record, index) => `${ record.points.toFixed(2) }`
	},
	{
		title: 'В процентах',
		width: 100,
		dataIndex: 'percent',
		key: 'percent',
		fixed: 'right',
		render: (text, record, index) => `${ record.percent.toFixed(2) }%`
	}
];

const InnerContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 16px;
	justify-content: center;
	border-bottom: 1px solid var(--border-color);
`;

const Box = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 100%;
`;

const dateFormatter = Intl.DateTimeFormat('ru-RU', {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit'
});

const ModPanelPageContentStyled = styled(ModPanelPageContent)`
	padding: 0;
	gap: 0;
`;

const ModPanelInterviewPage: NextPage = () => {
	const { data: session } = useSession();
	const [ step, setStep ] = useState<string>('');
	const [ grades, setGrades ] = useState<{ name: string; fileName: string; }[]>([]);
	const [ selectedGrade, setSelectedGrade ] = useState<string>('');
	const [ grade, setGrade ] = useState<{ name: string, questions: { question: string; answer: string; }[] }>();
	const [ playerName, setPlayerName ] = useState<string>('');
	const [ questionsCountValue, setQuestionsCountValue ] = useState<string>('0');
	const [ questionsCount, setQuestionsCount ] = useState<number>(0);
	const [ questions, setQuestions ] = useState<{ question: string; answer: string; }[]>([]);
	const [ currentQuestion, setCurrentQuestion ] = useState<number>(0);
	const [ currentQuestionPointsValue, setCurrentQuestionPointsValue ] = useState<string>('0');
	const [ currentQuestionPoints, setCurrentQuestionPoints ] = useState<number>(0);
	const [ results, setResults ] = useState<{ question: string; points: number; }[]>([]);
	const [ testResults, setTestResults ] = useState<ITestResultsTableData[]>([]);

	const user = useMemo(() => {
		return session && session.user;
	}, [ session ]);

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

	const onSelectChange = (value: string) => {
		setSelectedGrade(value);
	};

	const onClickSetup = async () => {
		const response = await fetch('/api/grades', {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				userId: user?.discord_id ?? '',
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
		setPlayerName(e.target.value.trim());
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

	const onCurrentQuestionPointsChange = (stringValue: string | null) => {
		// setCurrentQuestionPointsValue(stringValue);

		if (!stringValue) return;

		const value = parseFloat(stringValue);

		if (isNaN(value)) {
			setCurrentQuestionPoints(0);
			return;
		}

		setCurrentQuestionPoints(value);
		setCurrentQuestionPointsValue(value.toString());
	};

	const onClickNextQuestion = async () => {
		if (currentQuestion < (questionsCount - 1)) {
			addToResults();
			setCurrentQuestion(current => current + 1);
			setCurrentQuestionPoints(0);
			setCurrentQuestionPointsValue('0');
		}
	};

	const onClickGetResults = async () => {
		addToResults();
		setStep('results');
	};

	const resultPoints = useMemo<number>(() => {
		return results.reduce((acc, next) => acc + next.points, 0);
	}, [ results ]);

	const resultPercent = useMemo<string>(() => {
		return ((100 / questionsCount) * resultPoints).toFixed(2);
	}, [ resultPoints ]);

	const selectGrades = useMemo(() => {
		return grades.map(grade => ({
			value: grade.fileName,
			label: grade.name
		}));
	}, [ grades ]);

	const preparedTestResults = useMemo(() => {
		return testResults.map((result, i) => ({ key: i, ...result }));
	}, [ testResults ]);

	useEffect(() => {
		(async () => {
			const testResults = await fetch('/api/test-results').then<ITestResultsTableData[]>(res => res.json());

			if (testResults) {
				setTestResults(testResults);
			}

			if (user) {
				const availableGrades = await fetch('/api/grades/available', {
					method: 'POST',
					headers: {
						'content-type': 'application/json'
					},
					body: JSON.stringify({
						userId: user?.discord_id ?? ''
					})
				}).then(res => res.json());

				if (availableGrades) {
					setGrades(availableGrades);
					setStep('init');
					setSelectedGrade(availableGrades[0].fileName);
				}
			}
		})();
	}, [ user ]);

	useEffect(() => {
		if (step === 'results' && results.length === questionsCount) {
			fetch('/api/test-results/add', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					testResult: {
						author: user?.username || '',
						player: playerName || '',
						grade: grade?.name || '',
						questionCount: questionsCount || 0,
						points: resultPoints,
						percent: parseFloat(resultPercent)
					}
				})
			});
		}
	}, [ resultPoints, resultPercent, results, grade ]);

	return (
		<ModPanelPage needRole={ EUserRoles.st }>
			{
				!session || !testResults ? (
					<LoadingContainer>
						<Loading/>
					</LoadingContainer>
				) : (
					<>
						{
							step === 'init' || step === 'settings' ? (
								<ModPanelPageControls>
									{
										step === 'init' && (
											<>
												<div style={ { display: 'flex', justifyContent: 'flex-end' } }>
													<Select<string> style={ { width: 200 } }
													                getPopupContainer={ () => {
														                return document.body;
													                } } defaultActiveFirstOption
													                defaultValue={ selectedGrade }
													                onChange={ onSelectChange }
													                options={ selectGrades }/>
												</div>
												<Button type="primary" onClick={ onClickSetup }>Настройки
													тестирования</Button>
											</>
										)
									}
									{
										step === 'settings' && grade && (
											<Box>
												<div>
													<Input type="text" value={ playerName }
													       placeholder={ 'Player name' }
													       onChange={ onPlayerNameChange }/>
												</div>
												<div>
													<Input type="text" value={ questionsCountValue }
													       placeholder={ 'Question count' }
													       onChange={ onQuestionCountChange }
													       addonAfter={ `/ ${ grade.questions.length }` }/>
												</div>
												<Button type="primary" onClick={ onClickBegin }>Начать</Button>
											</Box>
										)
									}
								</ModPanelPageControls>
							) : null
						}
						<ModPanelPageContentStyled>
							{
								step === 'test' || step === 'results' ? (
									<InnerContainer>
										{
											step === 'test' && grade && playerName && questions.length && (
												<Space direction="vertical" size={ 16 }>
													<Descriptions bordered
													              column={ {
														              xxl: 1,
														              xl: 1,
														              lg: 1,
														              md: 1,
														              sm: 1,
														              xs: 1
													              } }>
														<Descriptions.Item
															label="Player name">{ playerName }</Descriptions.Item>
														<Descriptions.Item
															label="Grade">{ grade.name }</Descriptions.Item>
													</Descriptions>
													<Card
														title={ `Question: ${ currentQuestion + 1 } / ${ questionsCount }` }
														bordered>
														<Descriptions
															column={ {
																xxl: 1,
																xl: 1,
																lg: 1,
																md: 1,
																sm: 1,
																xs: 1
															} }>
															<Descriptions.Item
																label="Question">{ questions[currentQuestion].question }</Descriptions.Item>
															<Descriptions.Item
																label="Answer">{ questions[currentQuestion].answer }</Descriptions.Item>
														</Descriptions>
														<Space size={ 16 }>
															<InputNumber<string> addonBefore="Points"
															                     stringMode={ true }
															                     min={ '0' }
															                     step={ '0.1' }
															                     controls={ false }
															                     value={ currentQuestionPointsValue }
															                     onChange={ onCurrentQuestionPointsChange }
															/>
															{
																currentQuestion < (questionsCount - 1) ? (
																	<Button
																		onClick={ onClickNextQuestion }>Next</Button>
																) : (
																	<Button type="primary"
																	        onClick={ onClickGetResults }>Get
																		results</Button>
																)
															}
														</Space>
													</Card>
												</Space>
											)
										}
										{
											step === 'results' && grade && playerName && results.length && (
												<Space direction="vertical" size={ 16 }>
													<Descriptions bordered
													              column={ {
														              xxl: 1,
														              xl: 1,
														              lg: 1,
														              md: 1,
														              sm: 1,
														              xs: 1
													              } }>
														<Descriptions.Item
															label="Player name">{ playerName }</Descriptions.Item>
														<Descriptions.Item
															label="Grade">{ grade.name }</Descriptions.Item>
														<Descriptions.Item
															label="Question count">{ questionsCount }</Descriptions.Item>
													</Descriptions>
													<Box>
														<Title level={ 3 }
														       style={ { marginBottom: 0 } }>Results</Title>
														<Table bordered pagination={ false }
														       columns={ resultTableColumns }
														       dataSource={ results.map((result, i) => ({
															       key: i + 1,
															       question: result.question,
															       points: result.points
														       })) } scroll={ { y: 320 } } footer={ () => (
															<span>Points: { resultPoints } / { questionsCount } ( { resultPercent }% )</span>
														) }/>
													</Box>
												</Space>
											)
										}
									</InnerContainer>
								) : null
							}
							{
								testResults.length ? (
									<Table style={ {
										width: '100%',
										display: 'flex',
										flexDirection: 'column',
										overflowY: 'auto',
										padding: '16px'
									} } bordered columns={ testResultsTableColumns }
									       dataSource={ preparedTestResults }/>
								) : null
							}
						</ModPanelPageContentStyled>
					</>
				)
			}
		</ModPanelPage>
	);
};

export default ModPanelInterviewPage;
