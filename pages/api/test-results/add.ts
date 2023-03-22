import connectDB from '@/middleware/mongodb';
import { TestResult, ITestResult } from '@/models/TestResult';
import { NextApiRequest, NextApiResponse } from 'next';

const handler = async (
	req: NextApiRequest,
	res: NextApiResponse<ITestResult | {}>
) => {
	if (req.method === 'POST') {
		const { testResult } = req.body;
		if (testResult) {
			try {
				const testResultDocument = new TestResult(testResult);
				await testResultDocument.save();

				return res.status(200).send(testResult);
			} catch (error) {
				return res.status(500).send({});
			}
		} else {
			res.status(422).send({});
		}
	} else {
		res.status(422).send({});
	}
};

export default connectDB(handler);

export const config = {
	runtime: 'nodejs'
};