import mongoose from 'mongoose';
const { Schema } = mongoose;

export interface ITestResult {
	author: string;
	player: string;
	grade: string;
	questionCount: number;
	points: number;
	percent: number;
}

export const testResultSchema = new Schema({
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

mongoose.models.TestResult = mongoose.models.TestResult || mongoose.model('TestResult', testResultSchema);

export const TestResult = mongoose.models.TestResult;
