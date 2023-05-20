import { createModel } from '@/middleware/mongodb';

export interface ITestResult {
	author: string;
	player: string;
	grade: string;
	questionCount: number;
	points: number;
	percent: number;
	timestamp: Date;
}

export const TestResult = createModel<ITestResult>('TestResult', {
	author: {
		type: String,
		required: true
	},
	player: {
		type: String,
		required: true
	},
	grade: {
		type: String,
		required: true
	},
	questionCount: {
		type: Number,
		required: true
	},
	points: {
		type: Number,
		required: true
	},
	percent: {
		type: Number,
		required: true
	},
	timestamp: { type: Date, default: Date.now }
});
