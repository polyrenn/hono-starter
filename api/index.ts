import { handle } from 'hono/vercel'

import { serve } from '@hono/node-server'
import { Hono } from 'hono'

// Logger
import { logger } from 'hono/logger'

// Date

import dayjs from 'dayjs'

import { PrismaClient } from '@prisma/client'

// Routes
import subscriptions from './subscriptions'
import users from './users'
import auth from './auth'
import installation from './installation'
import paystack from './paystack'
import appointments from './appointments'

// Prisma
import { Prisma } from '@prisma/client'
import { db } from '../utils/db'

const app = new Hono().basePath('/api')

app.use(logger())

app.use("*", async (c, next) => {
  console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url}`);
  await next();
  console.log(`[${new Date().toISOString()}] Response status: ${c.res.status}`);
});


app.use('/auth/*', async (c, next) => {
  try {
    await next();
  } catch (error) {
    // Handle Prisma errors or other errors globally
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return c.json({ error: 'Unique constraint failed' }, 409);
      }
    } else {
      // Generic error handling
      return c.json({ error: 'An unexpected error occurred' }, 500);
    }
  }
});



app.route('/subscriptions', subscriptions)
app.route('/user', users)
app.route('/auth', auth)
app.route('/installation', installation)
app.route('/paystack', paystack)
app.route('/appointments', appointments)


app.get('/', async (c) => {
  return c.text('Hello Hono!')
})

app.get("/users", async (c) => {
  const users = await db.user.findMany();
  return c.json(users);
});

const port = 3001
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})


app.get('/', (c) => {
  return c.json({ message: "Congrats! You've deployed Hono to Vercel" })
})

const handler = handle(app);

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const OPTIONS = handler;