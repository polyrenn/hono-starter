import { PrismaClient } from '@prisma/client'

export const db =
  new PrismaClient({
      log: [
          {
          emit: 'event',
          level: 'error',
          },
          {
          emit: 'stdout',
          level: 'error',
          },
          {
          emit: 'stdout',
          level: 'info',
          },
          {
          emit: 'stdout',
          level: 'warn',
          },
      ],
})

db.$on('error', (e) => {
    console.log('Message: ' + e.message)
    console.log('Target: ' + e.target)
    console.log('Timestamp: ' + e.timestamp)
})
