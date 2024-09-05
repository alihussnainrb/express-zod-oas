import { generateMock } from '@anatine/zod-mock';
import {
    OpenAPIRegistry,
    OpenApiGeneratorV31,
    ResponseConfig
} from '@asteasolutions/zod-to-openapi';
import express, { RequestHandler } from 'express';
import { ApplicationOptions, RouteConfig } from './types';
import { Router } from './router';
import { mountDocs } from './docs';
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
    private app = express();
    options: ApplicationOptions;
    __routes: RouteConfig<any, any, any>[] = [];

    constructor(options: Partial<ApplicationOptions> = defaultOptions) {
        this.options = { ...defaultOptions, ...options };
        this.app.get(this.options.jsonPath, (_, res) => res.send(this.getSpecAsJson()));
        mountDocs(this.app, {
            jsonPath: this.options.jsonPath,
            docsTitle: this.options.openapi.info.title,
            docs: this.options.docs,
        })
        // this.app.use(this.options.docsPath, apiReference({ theme: 'purple', spec: { url: this.options.jsonPath } }));
    }

    get = this.app.get;
    post = this.app.post;
    put = this.app.put;
    patch = this.app.patch;
    delete = this.app.delete;


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
        this.__routes.push(...router.getRoutes().map((route) => {
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
        this.__routes.forEach(({
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
                    if (!example && this.options.generateMockExamples) {
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
                        if (!example && this.options.generateMockExamples) {
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
            ...this.options.openapi
        });
    }

    getSpecAsJson() {
        return JSON.stringify(this.getSpec());
    }

    getExpressApp() {
        return this.app;
    }
}


export { Application }
