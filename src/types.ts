import { OpenAPIObjectConfigV31 } from '@asteasolutions/zod-to-openapi/dist/v3.1/openapi-generator';
import { ZodSchema } from 'zod';
import { RouteConfig as BaseRouteConfig } from '@asteasolutions/zod-to-openapi';
import { Response as ExpressResponse, RequestHandler } from 'express';

type ContentObject<TScemea> = {
    type: 'application/json';
    schema: ZodSchema<TScemea>;
};

export type ValidateRequest<TBody, TParams, TQuery> = {
    body?: {
        content: ContentObject<TBody>;
        description?: string;
        example?: TBody;
        examples?: Record<string, TBody>;
    };
    params?: ZodSchema<TParams>;
    query?: ZodSchema<TQuery>;
};
export type Request<TBody, TParams, TQuery> = {
    body?: TBody;
    params?: TParams;
    query?: TQuery;
};

export type ResponseItem<TBody> = {
    // statusCode: number;
    description: string;
    content: ContentObject<TBody>;
    example?: TBody;
    examples?: Record<string, TBody>;
};

export type ApplicationOptions = {
    openapi: Omit<OpenAPIObjectConfigV31, "openapi">;
    docs: MountDocsOptions["docs"];
    jsonPath: string;
    generateMockExamples?: boolean;
};

export type MountDocsOptions = {
    docsTitle: string;
    docs: {
        scalar?: string,
        redocly?: string,
    };
    jsonPath: string;
}


export type RouteConfig<TBody, TParams, TQuery> = {
    method: BaseRouteConfig['method'];
    path: BaseRouteConfig['path'];
    validate?: ValidateRequest<TBody, TParams, TQuery>;
    middlewares?: RequestHandler[];
    handler: (ctx: {
        res: ExpressResponse;
        req: Request<TBody, TParams, TQuery>;
        respond: (statusCode: number, response: any) => void;
    }) => any | Promise<any>;
    operationId?: string;
    summary?: string;
    tags?: string[];
    responses?: Record<number, ResponseItem<any>>;
}

// export type RouteHandler<TBody, TParams, TQuery> = (
//     ctx: {
//         req: Request<TBody, TParams, TQuery>;
//         respond: <K extends number>(
//             statusCode: K,
//             response: ExpressResponse<any, any>,
//         ) => void;
//     }
// ) => any | Promise<any>;