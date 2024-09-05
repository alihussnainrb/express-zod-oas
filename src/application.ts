import { generateMock } from '@anatine/zod-mock';
import {
    OpenAPIRegistry,
    OpenApiGeneratorV31,
    ResponseConfig
} from '@asteasolutions/zod-to-openapi';
import express, { RequestHandler } from 'express';
import { mountDocs } from './docs';
import { Router } from './router';
import { ApplicationOptions, RouteConfig } from './types';
// import { apiReference } from '@scalar/express-api-reference';



const defaultOptions: ApplicationOptions = {
    generateMockExamples: true,
    docs: {
        scalar: "/docs",
        redocly: "/redocly",
    },
    jsonPath: '/api/openapi.json',
    openapi: {
        info: {
            title: 'Sample API',
            version: '1.0.0',
        },
    },
};

class Application {
    private app: ReturnType<typeof express>;
    private _options: ApplicationOptions;
    private routes: RouteConfig<any, any, any>[] = [];

    constructor(options: Partial<ApplicationOptions> = defaultOptions) {
        this.app = express();
        this._options = { ...defaultOptions, ...options };
        this.app.get(this._options.jsonPath, (_, res) => res.send(this.getSpecAsJson()));
        mountDocs(this.app, {
            jsonPath: this._options.jsonPath,
            docsTitle: this._options.openapi.info.title,
            docs: this._options.docs,
        })
        // this.app.use(this._options.docsPath, apiReference({ theme: 'purple', spec: { url: this._options.jsonPath } }));
    }

    get = (path: string, ...handler: RequestHandler[]) => this.app.get(path, ...handler);
    post = (path: string, ...handler: RequestHandler[]) => this.app.post(path, ...handler);
    put = (path: string, ...handler: RequestHandler[]) => this.app.put(path, ...handler);
    delete = (path: string, ...handler: RequestHandler[]) => this.app.delete(path, ...handler);
    patch = (path: string, ...handler: RequestHandler[]) => this.app.patch(path, ...handler);
    options = (path: string, ...handler: RequestHandler[]) => this.app.options(path, ...handler);
    head = (path: string, ...handler: RequestHandler[]) => this.app.head(path, ...handler);


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
        this.routes.push({
            method,
            path,
            handler,
            validate,
            operationId,
            responses,
            tags,
            summary,
            middlewares
        })
        this.app[method](path, ...(middlewares || []), async (req, res) => {
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

    listen(port: number) {
        this.app.listen(port, () =>
            console.log(`App running at http://localhost:${port}`)
        );
    }

    registerRouter(params: {
        prefix: string;
        router: Router;
        middlewares?: RequestHandler[]
    }) {
        const { prefix, router, middlewares } = params
        this.app.use(prefix, ...(middlewares || []), router.getExpressRouter());
        this.routes.push(...router.getRoutes().map((route) => {
            let parsedPrefix = prefix
            if (parsedPrefix.endsWith('/') && route.path.startsWith('/')) {
                parsedPrefix = parsedPrefix.slice(0, -1);
            }
            return {
                ...route,
                path: parsedPrefix + route.path
            }
        }));
    }

    private generateOpenApiSpecs() {
        const openapiRegistry = new OpenAPIRegistry();
        this.routes.forEach(({
            method,
            path,
            validate,
            operationId,
            responses,
            tags,
            summary,
        }) => {
            const mappedResponses = Object.entries(responses || {})?.reduce(
                (acc, [statusCode, resItem]) => {
                    let example = resItem.example;
                    if (!example && this._options.generateMockExamples) {
                        example = generateMock(resItem.content.schema);
                    }
                    acc[String(statusCode)] = {
                        description: resItem.description,
                        content: {
                            [resItem.content.type]: {
                                schema: resItem.content.schema,
                                example: example,
                                examples: resItem.examples,
                            },
                        },
                    };
                    return acc;
                },
                {} as Record<string, ResponseConfig>
            );
            openapiRegistry.registerPath({
                method: method,
                path: path,
                responses: mappedResponses,
                operationId: operationId,
                summary: summary,
                tags: tags,
                request: {
                    ...(validate?.body?.content.schema && (() => {
                        let example = validate.body.example;
                        if (!example && this._options.generateMockExamples) {
                            example = generateMock(validate.body.content.schema);
                        }
                        return {
                            body: {
                                content: {
                                    'application/json': {
                                        schema: validate?.body?.content.schema,
                                        example: example,
                                    },
                                },
                            },
                        }
                    })()),
                },
            });
        });
        return openapiRegistry.definitions
    }

    getSpec() {
        const generator = new OpenApiGeneratorV31(this.generateOpenApiSpecs());
        return generator.generateDocument({
            openapi: "3.1.0",
            ...this._options.openapi
        });
    }

    getSpecAsJson() {
        return JSON.stringify(this.getSpec());
    }

    getExpressApp() {
        return this.app;
    }
}


export { Application };

