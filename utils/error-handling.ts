import { Prisma } from "@prisma/client";
import { Context, Next } from "hono";

const withErrorHandling = (handler: (c: Context, next: Next) => Promise<Response>) => {
  return async (c: Context, next: Next) => {
    try {
      await handler(c, next);
      await next()
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return c.json({ error: 'A user with this email already exists' }, 409);
        }
      }
      return c.json({ error: 'An unexpected error occurred' }, 500);
    }
  };
};

export default withErrorHandling
  