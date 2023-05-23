import React, { ChangeEventHandler, DragEventHandler, MouseEventHandler, useRef, useState } from 'react';
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

interface DropZoneLabelProps {
	isHovered: boolean;
}

const DropZoneLabel = styled.label<DropZoneLabelProps>`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	margin-top: 8px;
	gap: 8px;
	background: linear-gradient(325deg, #adadad61, #85858538);
	padding: 8px;
	border-radius: 8px;
	box-shadow: 0 0 2px 1px rgb(255 255 255 / 10%);
	min-height: 140px;
	cursor: pointer;
	
	input {
		display: none;
	}

	.drop-icon {
		width: 64px;
		height: 64px;
		margin-bottom: 8px;
		filter: ${props => props.isHovered ? `drop-shadow(0 0 1px #0aab51) drop-shadow(0 0 1px #0aab51)` : `drop-shadow(0 0 1px #fff2) drop-shadow(0 0 1px #fff2)`};
		
		path {
			fill: ${props => props.isHovered ? `#123325` : `#7a7a7add`};
		}
	}
	
	&:hover {
		.drop-icon {
			filter: drop-shadow(0 0 1px #fff) drop-shadow(0 0 1px #fff);

			path {
				fill: #7a7a7add;
			}
		}
	}

	.drop-file-name:hover {
		color: #a81e1e;
	}
`;

const GET_INITIAL_QUESTIONS_STATE = () => [ {
	question: '',
	answer: ''
} ];

const CreateInterviewPage: NextPage<void> = () => {
	const [ name, setName ] = useState<string>('');
	const [ isDragOver, setIsDragOver ] = useState<boolean>(false);
	const [ selectedFileName, setSelectedFileName ] = useState<string>('');
	const [ questions, setQuestions ] = useState<{ question: string; answer: string; }[]>(GET_INITIAL_QUESTIONS_STATE());
	const fileInputRef = useRef<HTMLInputElement>(null);

	const onAddClick = async () => {
		setQuestions(questions => [ ...questions, { question: '', answer: '' } ]);
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
			return [ ...questions ];
		});
	};

	const onAnswerChange = (i: number): ChangeEventHandler<HTMLTextAreaElement> => (e) => {
		setQuestions((questions) => {
			const question = questions[i];
			question.answer = e.target.value;
			return [ ...questions ];
		});
	};

	const onDragOver: DragEventHandler<HTMLLabelElement> = (e) => {
		e.preventDefault();
		setIsDragOver(true);
	};

	const onDragLeave: DragEventHandler<HTMLLabelElement> = (e) => {
		setIsDragOver(false);
	};

	const readFile = async (file: Blob) => {
		const reader = new FileReader();
		reader.addEventListener('load', async () => {
			setSelectedFileName(file.name);
			const result = JSON.parse(reader.result as string);
			setQuestions(result.questions);
			setName(result.name);
		});
		reader.readAsText(file as Blob);
	};

	const onDrop: DragEventHandler<HTMLLabelElement> = async (e) => {
		e.preventDefault();

		setIsDragOver(false);

		if (e.dataTransfer.items) {
			for (let itemIndex in e.dataTransfer.items) {
				const item = e.dataTransfer.items[itemIndex];
				if (item.kind === 'file') {
					const file = item.getAsFile();
					await readFile(file as Blob);
				}
			}
		}
	};

	const onClickSelectedFileName: MouseEventHandler<HTMLSpanElement> = (e) => {
		e.preventDefault();
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
		setSelectedFileName('');
		setQuestions(GET_INITIAL_QUESTIONS_STATE());
		setName('');
	};

	const onFileInputChange: ChangeEventHandler<HTMLInputElement> = async (e) => {
		const target = e.target;
		const file = target.files?.[0];
		if (!file) {
			return;
		}

		await readFile(file);
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
										<div><span>{ i + 1 }.</span>&nbsp;<input type="text" value={ question.question }
										                                         placeholder="Question"
										                                         onChange={ onQuestionChange(i) }/>
										</div>
										<div><textarea value={ question.answer } placeholder="Answer"
										               onChange={ onAnswerChange(i) }/></div>
									</Question>
								))
							}
						</QuestionsBox>
						<button onClick={ onAddClick }>Add</button>
					</Box>
					<button onClick={ onClickDownload }>Download file</button>
					<DropZoneLabel isHovered={ isDragOver } onDragOver={ onDragOver }
					               onDragLeave={ onDragLeave } onDrop={ onDrop }>
						<input ref={ fileInputRef } type="file" onChange={ onFileInputChange }/>
						<svg className="drop-icon" width="260" height="260" viewBox="0 0 260 260" fill="none"
						     xmlns="http://www.w3.org/2000/svg">
							<path
								d="M138.074 3.31123C133.597 -1.10374 126.403 -1.10374 121.926 3.31123L50.4258 73.8112C45.9032 78.2705 45.8519 85.5517 50.3112 90.0743C54.7705 94.5968 62.0518 94.6481 66.5742 90.1888L118.5 38.9893V188.5C118.5 194.851 123.649 200 130 200C136.351 200 141.5 194.851 141.5 188.5V38.9893L193.426 90.1888C197.948 94.6481 205.229 94.5968 209.689 90.0743C214.148 85.5517 214.097 78.2705 209.574 73.8112L138.074 3.31123Z"/>
							<path
								d="M24.0154 202.5C24.0051 202.832 24 203.165 24 203.5C24 221.173 38.3269 235.5 56 235.5H204C221.673 235.5 236 221.173 236 203.5C236 203.165 235.995 202.832 235.985 202.5H236V153.5C236 146.873 241.373 141.5 248 141.5C254.627 141.5 260 146.873 260 153.5V204.5H259.966C258.912 235.054 233.811 259.5 203 259.5H56V259.491C25.6478 258.969 1.07654 234.723 0.0344238 204.5H0V153.5C0 146.873 5.37256 141.5 12 141.5C18.6274 141.5 24 146.873 24 153.5V202.5H24.0154Z"/>
						</svg>
						<span className="drop-file-zone__text">
							{
								selectedFileName ? (
									<span className="drop-file-name" onClick={ onClickSelectedFileName }>{ selectedFileName }</span>
								) : (
									'Выберите/сбросьте файл для редактирования'
								)
							}
						</span>
					</DropZoneLabel>
				</Box>
			</Container>
		</Page>
	);
};

export default CreateInterviewPage;
