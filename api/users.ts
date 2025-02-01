import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { db } from './utils/db';

// Prisma
import { Appointment, Prisma, User } from '@prisma/client';

const app = new Hono();


// JWT middleware to authenticate the user
const jwtSecret = 'your_jwt_secret_key'; // Replace with your actual JWT secret

app.use('/users/*', jwt({ secret: jwtSecret }));

app.get('/profile', async (c) => {
  try {
    // Extract user ID from the JWT payload
    /*
    const userId = c.get('user')?.sub;

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    */
    // Query the user's profile from the database
    const user = await db.user.findUnique({
      where: { id: 1 },
      select: {
        id: true,
        fullName: true,
        email: true,
        profilePicture: true
      },
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Return the user profile as JSON
    return c.json(user);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Delete Account
app.delete('/:id', async (c) => {
  const id  = c.req.param('id')
  if( !id ) {
    return c.json("Empty Id.", 404)
  }

  try {    
    const deleteUser = await db.user.delete({
      where: {
        email: id
      }
    })
    return c.json({message:`Delete request received for ${id}`, details: deleteUser }, 200)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle known Prisma errors (e.g., unique constraint violation)
        if (error.code === 'P2025') {
          return c.json({ error: 'User does not exist' }, 404);
        }
  } else {
        return c.json({error: 'Something went wrong', message: error}, 500)
  }
  
  }

})

app.patch("/update", async (c) => {
  const data: Partial<User> = await c.req.json(); // Accept partial data of User type
  try {
    // Query the user's profile from the database to confirm existence
    const user = await db.user.findFirst({
      where: { email: data.email },
      select: { email: true }
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Remove `email` from data if present to prevent accidental updates to the primary identifier
    const { email, ...updateData } = data;

    // Update the user with only the provided fields in `data`
    const updatedUser = await db.user.update({
      where: { email: user.email },
      data: updateData
    });

    // Return the updated user profile as JSON
    return c.json(updatedUser);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

app.post("/appointment", async (c) => {
  const data: Appointment = await c.req.json(); // Accept partial data of User type
  try {
    // Query the user's profile from the database to confirm existence
    const user = await db.user.findFirst({
      where: { email: data.userId },
      select: { email: true, appointment: true }
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Remove `email` from data if present to prevent accidental updates to the primary identifier
    const { userId, ...updateData } = data;

    // Update the user with only the provided fields in `data`
    const updatedAppointment = await db.appointment.create({
      data: {
          userId,
          ...updateData
      }
    });

    // Return the updated user profile as JSON
    return c.json(updatedAppointment);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});


export default app;
