export * from './application'
export * from './router';
export * from './zod'

// const app = new Application();

// const UserSchema = z.object({
//   id: z.string().uuid(),
//   name: z.string(),
//   email: z.string().email(),
//   address: z.object({
//     street: z.string(),
//     city: z.string(),
//   }),
// });

// app.openapi({
//   method: 'get',
//   path: '/test',
//   tags: ['Test'],
//   operationId: 'getTestOperation',
//   validate: {
//     body: {
//       content: {
//         type: 'application/json',
//         schema: UserSchema.omit({ id: true }),
//       },
//     },
//   },
//   responses: {
//     200: {
//       description: 'Success!',
//       content: {
//         type: 'application/json',
//         schema: UserSchema,
//       },
//     },
//   },
//   handler(ctx) {
//     ctx.respond(200, {});
//   },
// })

// app.listen(4000);

// console.log(app.getSpecAsJson());
