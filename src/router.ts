
import express from 'express';
import { RouteConfig } from './types';



export class Router {
    protected router = express.Router();
    protected __routes: RouteConfig<any, any, any>[] = [];

    get = this.router.get;
    post = this.router.post;
    put = this.router.put;
    patch = this.router.patch;
    delete = this.router.delete;

    getExpressRouter() {
        return this.router;
    }
    getRoutes() {
        return this.__routes;
    }


    openapi<TBody, TParams, TQuery>({
        method,
        path,
        handler,
        validate,
        operationId,
        responses,
        tags,
        summary,
        middlewares
    }: RouteConfig<TBody, TParams, TQuery>) {
        this.__routes.push({
            method,
            path,
            handler,
            validate,
            operationId,
            responses,
            tags,
            summary,
            middlewares
        });
        this.router[method](path, ...(middlewares || []), async (req, res) => {
            let body = req.body;
            if (validate?.body) {
                const result = validate?.body?.content.schema.safeParse(req.body);
                if (!result?.success) {
                    res.status(422).send('Invalid request!');
                    return;
                }
                body = result.data;
            }
            let params: any = req.params;
            if (validate?.params) {
                const result = validate?.params?.safeParse(req.params);
                if (!result?.success) {
                    res.status(422).send('Invalid request!');
                    return;
                }
                params = result.data;
            }
            let query: any = req.query;
            if (validate?.query) {
                const result = validate?.query.safeParse(req.query);
                if (!result?.success) {
                    res.status(422).send('Invalid request!');
                    return;
                }
                query = result.data;
            }

            const response = await handler({
                res: res,
                req: {
                    body: body,
                    params: params,
                    query: query,
                },
                respond: (response, statusCode) => {
                    if (!statusCode) res.send(response);
                    res.status(statusCode).send(response);
                },
            });
            if (response) res.send(response);
        });
    }

    //       private createValidator(
    //           type: 'params' | 'query' | 'headers' | 'body',
    //           schema: ZodType
    //       ): express.RequestHandler {
    //           return async (req, res, next: express.NextFunction) => {
    //               try {
    //                   const result = await schema.parseAsync(req[type]);
    //                   req[type] = result;
    //                   next();
    //               } catch (error) {
    //                   if (error instanceof ZodError) {
    //                       res.status(400).json({ errors: error.errors });
    //                   } else {
    //                       next(error);
    //                   }
    //               }
    //           };
    //       }


}