import mongoose, {
	Types,
	Schema,
	Model,
	SchemaDefinition,
	SchemaDefinitionType,
	Document,
	MergeType,
	ProjectionType,
	QueryOptions
} from 'mongoose';
import { NextApiRequest, NextApiResponse } from 'next';

import validateEnv from '@/helpers/validateEnv';

const URL = validateEnv('MONGODB_URL');
const USER = validateEnv('MONGODB_USER');
const PASSWORD = validateEnv('MONGODB_PASSWORD');

export type DocumentType<T> = Document<unknown, {}, T> & MergeType<T & {_id: Types.ObjectId}, unknown>;
export type ProjectionParameter<T> = ProjectionType<T> | null | undefined;
export type OptionsParameter<T> = QueryOptions<T> | null | undefined;

export type CreateDocumentFunction<T> = (data?: Partial<T>) => Promise<DocumentType<T>>;
export type FindDocumentFunction<T, R> = (query: T & { projection?: ProjectionParameter<R>, options?: OptionsParameter<R> }) => Promise<R[]>;
export type UpdateDocumentFunction<T, R> = (query: T & { projection?: ProjectionParameter<R>, options?: OptionsParameter<R> }, update: (entity: DocumentType<R>) => Promise<DocumentType<R>>) => Promise<R[]>;

export const createDBConnection = async () => {
	if (mongoose.connections[0].readyState) {
		return true;
	}

	try {
		await mongoose.connect(URL, {
			authSource: 'admin',
			user: USER,
			pass: PASSWORD
		});

		return true;
	} catch(e) {
		console.log(e);
		return false;
	}
};

export const createModel = <T>(name: string, schema: SchemaDefinition<SchemaDefinitionType<T>>): Model<T> => {
	if (mongoose.models && mongoose.models[name]) {
		return mongoose.models[name];
	}

	const newSchema = new Schema<T, Model<T>>(schema);
	const newModel = mongoose.model<T>(name, newSchema);

	return (mongoose.models && mongoose.models[name] as typeof newModel) || newModel;
};

export const getIDsFromString = (ids: string): string | string[] => {
	return ids.indexOf(',') > -1 ? ids.split(',') : ids;
};

export const getObjectIDsFromString = (ids: string): Types.ObjectId | Types.ObjectId[] => {
	const parsedIDs = getIDsFromString(ids);
	return parsedIDs instanceof Array ? parsedIDs.map(id => new Types.ObjectId(id)) : new Types.ObjectId(parsedIDs as string);
};

export const getObjectIDsFromStringArray = (ids: string[]): Types.ObjectId[] => {
	return ids.map(id => new Types.ObjectId(id));
};

export const connectDB = (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) => async (req: NextApiRequest, res: NextApiResponse) => {
	await createDBConnection();
	return handler(req, res);
};

export default connectDB;

export const config = {
	runtime: 'nodejs'
};
