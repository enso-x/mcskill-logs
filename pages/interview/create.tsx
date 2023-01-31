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

const Question = styled(Box)`
	width: auto;
	
	&:not(:last-child) {
		padding-bottom: 16px;
		border-bottom: 1px solid #fff;
	}
	
	div {
		display: flex;
		input, textarea {
			flex: 1;
		}
		textarea {
			min-height: 60px;
			resize: none;
		}
	}
`;

const CreateInterviewPage: NextPage<void> = () => {
	const [ name, setName ] = useState<string>('');
	const [ questions, setQuestions ] = useState<{ question: string; answer: string; }[]>([{question: '', answer: ''}]);

	const onAddClick = async () => {
		setQuestions(questions => [...questions, {question: '', answer: ''}]);
	};

	const onClickDownload = async () => {
		const blob = new Blob([ JSON.stringify({ name, questions }, null, 4) ], { type: 'application/json' });
		const url = URL.createObjectURL(blob);

		const downloadLink = document.createElement('a');
		downloadLink.setAttribute('href', url);
		downloadLink.setAttribute('download', 'test.json');
		downloadLink.style.display = 'none';

		document.body.appendChild(downloadLink);
		downloadLink.click();
		document.body.removeChild(downloadLink);

		URL.revokeObjectURL(url);
	};

	const onNameChange: ChangeEventHandler<HTMLInputElement> = (e) => {
		setName(e.target.value);
	};

	const onQuestionChange = (i: number): ChangeEventHandler<HTMLInputElement> => (e) => {
		setQuestions((questions) => {
			const question = questions[i];
			question.question = e.target.value;
			return [...questions];
		});
	};

	const onAnswerChange = (i: number): ChangeEventHandler<HTMLTextAreaElement> => (e) => {
		setQuestions((questions) => {
			const question = questions[i];
			question.answer = e.target.value;
			return [...questions];
		});
	};

	return (
		<Page>
			<Container>
				<Box>
					<div>
						Name: <input type="text" value={ name } onChange={ onNameChange }/><br/>
					</div>
					<Box>
						<QuestionsBox>
							{
								questions.map((question, i) => (
									<Question key={ i }>
										<div><span>{ i + 1 }.</span>&nbsp;<input type="text" value={ question.question } placeholder="Question" onChange={ onQuestionChange(i) }/></div>
										<div><textarea value={ question.answer } placeholder="Answer" onChange={ onAnswerChange(i) }/></div>
									</Question>
								))
							}
						</QuestionsBox>
						<button onClick={ onAddClick }>Add</button>
					</Box>
					<button onClick={ onClickDownload }>Download file</button>
				</Box>
			</Container>
		</Page>
	);
};

export default CreateInterviewPage;
