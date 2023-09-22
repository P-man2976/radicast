import { NextFunction, Request, Response } from 'express'
import { AnyZodObject, ZodError } from "zod";

export const validator = (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {
	try {
		await schema.parseAsync({ ...req.params });
		return next();
	} catch (error) {
		if (error instanceof ZodError) {
			return res.status(400).send({
				error: error.flatten(),
			});
		}
	}
};
