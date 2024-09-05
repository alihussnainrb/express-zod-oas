import express from 'express'
import { MountDocsOptions } from './types';


export const mountDocs = (app: ReturnType<typeof express>, options: MountDocsOptions) => {
    const { docs, jsonPath, docsTitle } = options;
    if (docs.scalar) {
        app.use(docs.scalar, (_, res) => {
            res.send(`
                <!doctype html>
                <html>
                  <head>
                    <title>${docsTitle}</title>
                    <meta charset="utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                  </head>
                  <body>
                    <!-- Need a Custom Header? Check out this example https://codepen.io/scalarorg/pen/VwOXqam -->
                    <script
                      id="api-reference"
                      data-url="${jsonPath}"></script>
                    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
                  </body>
                </html>
            `);
        });
    }
    if (docs.redocly) {
        app.use(docs.redocly, (_, res) => {
            res.send(`
                <!doctype html>
                <html>
                  <head>
                    <title>${docsTitle}</title>
                    <meta charset="utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                  </head>
                  <body>
                  <redoc spec-url="${jsonPath}"></redoc>
                  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"> </script>
                  </body>
                </html>
            `);
        });
    }

}






