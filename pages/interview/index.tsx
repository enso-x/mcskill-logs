import React, { ChangeEventHandler, useState, useMemo, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import Error from 'next/error';
import {
	ConfigProvider,
	theme,
	Avatar,
	Button,
	Select,
	Input,
	InputNumber,
	Card,
	Space,
	Table,
	Typography,
	Descriptions
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import 'antd/dist/reset.css';

const { darkAlgorithm } = theme;
const { Title } = Typography;

import styled from 'styled-components';
import protectedRoute from '@/middleware/protectedRoute';
import Page from '@/components/Page';
import { DiscordUser } from '@/types/DiscordUser';
import { ITestResult } from '@/models/TestResult';

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
		title: 'Question',
		dataIndex: 'question',
		key: 'question'
	},
	{
		title: 'Points',
		width: 100,
		dataIndex: 'points',
		key: 'points',
		fixed: 'right'
	}
];

const testResultsTableColumns: ColumnsType<ITestResultsTableData> = [
	{
		title: 'Date',
		dataIndex: 'timestamp',
		key: 'timestamp',
		render: (text, record, index) => dateFormatter.format(new Date(text))
	},
	{
		title: 'Reviewer',
		dataIndex: 'author',
		key: 'author'
	},
	{
		title: 'Player',
		dataIndex: 'player',
		key: 'player'
	},
	{
		title: 'Grade',
		dataIndex: 'grade',
		key: 'grade'
	},
	{
		title: 'Question count',
		dataIndex: 'questionCount',
		key: 'questionCount'
	},
	{
		title: 'Points',
		width: 100,
		dataIndex: 'points',
		key: 'points',
	},
	{
		title: 'Percents',
		width: 100,
		dataIndex: 'percent',
		key: 'percent',
		fixed: 'right',
		render: (text, record, index) => `${text}%`
	}
];

const Container = styled.div`
	height: 100vh;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: #141414;
`;

const ContentContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 860px;
`;

const InnerContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 16px;
	justify-content: center;
`;

const dateFormatter = Intl.DateTimeFormat('ru-RU', {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit'
});

const VerticalLayout = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
`;

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

const PointsInput = styled.input.attrs((attrs) => ({
	type: 'number',
	step: 0.1,
	min: 0,
	...attrs
}))`
	&::-webkit-outer-spin-button,
	&::-webkit-inner-spin-button {
		/* display: none; <- Crashes Chrome on hover */
		-webkit-appearance: none;
		margin: 0; /* <-- Apparently some margin are still there even though it's hidden */
	}
`;

interface InterviewPageProps {
	user: DiscordUser | null;
	testResults: ITestResultsTableData[];
}

const InterviewPage: NextPage<InterviewPageProps> = ({
	user,
	testResults
}) => {
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

	useEffect(() => {
		fetch('/api/grades/available', {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				userId: user?.id ?? ''
			})
		}).then(async (response) => {
			if (response.status === 200) {
				const data = await response.json();
				setGrades(data);
				setStep('init');
				setSelectedGrade(data[0].fileName);
			}
		});
	}, []);

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
				userId: user?.id ?? '',
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

	const onLogoutClick = async () => {
		await fetch('/api/oauth/logout');
		location.href = '/';
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
		<ConfigProvider theme={ {
			algorithm: darkAlgorithm,
			token: {
				colorPrimary: '#722ed1',
			}
		} }>
			<Page>
				{
					user && !user.access_is_allowed ? (
						<VerticalLayout>
							<Error title="Access not allowed" statusCode={ 401 }/>
							<button onClick={ onLogoutClick }>Log out</button>
						</VerticalLayout>
					) : (
						<Container>
							<ContentContainer>
								<InnerContainer>
									{
										user && (
											<VerticalLayout>
												<Avatar
													src={ `https://cdn.discordapp.com/avatars/${ user.id }/${ user.avatar }.png` }
													alt={ user.username } size={ 120 }/>
												<Button danger onClick={ onLogoutClick }>Log out</Button>
											</VerticalLayout>
										)
									}
									{
										step === 'init' && (
											<>
												<div style={ { display: 'flex', justifyContent: 'flex-end' } }>
													<Select<string> style={ { width: 200 } } getPopupContainer={ () => {
														return document.body;
													} } defaultActiveFirstOption defaultValue={ selectedGrade }
													                onChange={ onSelectChange } options={ selectGrades }/>
												</div>
												<Button type="primary" onClick={ onClickSetup }>Setup</Button>
											</>
										)
									}
									{
										step === 'settings' && grade && (
											<Box>
												<div>
													<Input type="text" value={ playerName } placeholder={ 'Player name' }
													       onChange={ onPlayerNameChange }/>
												</div>
												<div>
													<Input type="text" value={ questionsCountValue }
													       placeholder={ 'Question count' }
													       onChange={ onQuestionCountChange }
													       addonAfter={ `/ ${ grade.questions.length }` }/>
												</div>
												<Button type="primary" onClick={ onClickBegin }>Begin</Button>
											</Box>
										)
									}
									{
										step === 'test' && grade && playerName && questions.length && (
											<Space direction="vertical" size={ 16 }>
												<Descriptions bordered
												              column={ { xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 } }>
													<Descriptions.Item
														label="Player name">{ playerName }</Descriptions.Item>
													<Descriptions.Item label="Grade">{ grade.name }</Descriptions.Item>
												</Descriptions>
												<Card title={ `Question: ${ currentQuestion + 1 } / ${ questionsCount }` }
												      bordered>
													<Descriptions column={ { xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 } }>
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
																<Button onClick={ onClickNextQuestion }>Next</Button>
															) : (
																<Button type="primary" onClick={ onClickGetResults }>Get
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
												              column={ { xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 } }>
													<Descriptions.Item
														label="Player name">{ playerName }</Descriptions.Item>
													<Descriptions.Item label="Grade">{ grade.name }</Descriptions.Item>
													<Descriptions.Item
														label="Question count">{ questionsCount }</Descriptions.Item>
												</Descriptions>
												<Box>
													<Title level={ 3 } style={ { marginBottom: 0 } }>Results</Title>
													<Table bordered pagination={ false } columns={ resultTableColumns }
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
								{
									testResults.length ? (
										<Table bordered pagination={ false } columns={ testResultsTableColumns }
										       dataSource={ testResults.reverse().map((testResult) => (testResult)) } scroll={ { y: 320 } }/>
									) : null
								}
							</ContentContainer>
						</Container>
					)
				}
			</Page>
		</ConfigProvider>
	);
};

export const getServerSideProps = protectedRoute<InterviewPageProps>(async (context) => {
	const proto = context.req.headers['x-forwarded-proto'] ? 'https' : 'http';
	const testResults: ITestResultsTableData[] = await fetch(`${ proto }://${ context.req.headers.host }/api/test-results`).then(res => res.json());

	return ({
		props: {
			user: context.user ?? null,
			testResults
		}
	});
}, '/interview');

export default InterviewPage;

export const config = {
	runtime: 'nodejs'
};
