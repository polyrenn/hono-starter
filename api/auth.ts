import { Hono } from 'hono';
import { jwt as honoJwt } from 'hono/jwt';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import { Resend } from 'resend';

import { db } from '../utils/db';

//Prisma
import { Prisma, User } from '@prisma/client';

// Prisma Error Handler
import withErrorHandling from '../utils/error-handling';

// Date
import dayjs from 'dayjs';

// OTP
import generateOTP from '../utils/generate-otp';

const app = new Hono();

// Initialize Resend with your API key
const resend = new Resend('re_S2f3jr8t_79c7uMda5zJCXwq542te2Thw'); // Replace with your actual API key

// Email template function
const createVerificationEmail = (email: string, verificationToken: string) => ({
  from: 'onboarding@yourdomain.com',
  to: email,
  subject: 'Verify your email address',
  html: `
    <h1>Welcome to Our Platform!</h1>
    <p>Thank you for signing up. Please verify your email address by entering the following code:</p>
    <h2 style="font-size: 24px; letter-spacing: 2px;">${verificationToken}</h2>
    <p>This code will expire in 24 hours.</p>
    <p>If you didn't create an account, please ignore this email.</p>
  `
});


app.post('/create', async (c) => {
    const { userId, password } = await c.req.json();
    const user = await db.user.findFirst({
        where: {
            id: userId
        },
        select: {
            id: true
        }
      })
    
    
      if (user) {
        return c.json({ error: 'User already exists' }, 400);
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        const createUser = await db.user.create({
            data: {
                id: 427499,
                email: '2majishhl@mail.com',
                address: 'Add',
                profilePicture: null,
                phoneNumber: '08076357798',
                password: hashedPassword,
                fullName: 'Antione Grieezman'
    
            }
        })
        return c.json({ error: 'User Created', userDetails: createUser }, 200);
    }
});

// Register Endpoint
app.post('/signup', async (c) => { 

  const data:User = await c.req.json();

  //Check for Empty Payload
  if (Object.keys(data).length === 0) {
    return c.json({error: 'Empty Payload'}, 400)
  }

  try {
    const user = await db.user.findFirst({
        where: {
            email: data.email
        },
        select: {
            email: true
        }
      })
    
    
      if (user) {
        return c.json({ error: 'User already exists' }, 400);
      } else {
       
         // Generate verification token
        // const verificationToken = crypto.randomBytes(32).toString('hex');

        const verificationToken = generateOTP(5);
        
        const createUser = await db.user.create({
            data: {
                ...data,
                password: await bcrypt.hash(data.password, 2),
                verificationToken: verificationToken
            }
        })
        
        // Create Session
        const sessionId = uuidv4();
        const expiresAt = dayjs().add(7, 'days').toDate();
        // Return the token to the client
        const createSession = await db.session.create({
          data: {
            id: sessionId,
            userId: createUser.id,
            expiresAt,
          },
        });

        // Send Verification Email

        try {
          const emailData = createVerificationEmail(data.email, verificationToken);
          const { data: emailDataResend, error } = await resend.emails.send({
            from: 'updates@m.neurone.studio',
            to: [`${createUser.email}`],
            subject: 'Verify your email address',
            html: `
              <h1>Welcome to Our Platform!</h1>
              <p>Thank you for signing up. Please verify your email address by entering the following code:</p>
              <h2 style="font-size: 24px; letter-spacing: 2px;">${createUser.verificationToken}</h2>
              <p>This code will expire in 20 minutes.</p>
              <p>If you didn't create an account, please ignore this email.</p>
            `
          });
        
          
          return c.json({ 
            message: 'User Created', 
            userDetails: createUser, 
            sessionId: createSession,
            emailSent: true,
            emailId: emailDataResend?.id 
          }, 200);
        } catch (emailError) {
          // Log the email error but don't fail the signup
          console.error('Failed to send verification email:', emailError);
          
          return c.json({ 
            message: 'User Created', 
            userDetails: createUser, 
            sessionId: createSession,
            emailSent: false,
            emailError: 'Failed to send verification email'
          }, 200);
        }
      }
      
        
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle known Prisma errors (e.g., unique constraint violation)
        if (error.code === 'P2002') {
          return c.json({ error: 'A user with this email already exists' }, 409);
        }
  } else {
        return c.json({error: 'Something went wrong', message: error}, 500)
  }
  
  }

});

// Login Endpoint
app.post('/login', async (c) => {
   //Check for Empty Payload
    try {
      const { email, password } = await c.req.json();

      if (!email || !password || !email && !password) {
        return c.json({error: 'Empty Payload'}, 400)
      }
  
      // Find the user by email
      const user = await db.user.findUnique({ where: { email } });
  
      if (!user) {
        return c.json({ error: 'Invalid email or password' }, 401);
      }

      if (!user.isVerified) {
        return c.json({message: 'Please verify your email before logging in.'}, 401)
      }
  
      // Validate the password
      const isValidPassword = await bcrypt.compare(password, user.password);
  
      if (!isValidPassword) {
        return c.json({ error: 'Invalid email or password' }, 401);
      }
  
      // Create a new session
      const sessionId = uuidv4();
      const expiresAt = dayjs().add(7, 'days').toDate();
      // Return the token to the client
      await db.session.create({
        data: {
          id: sessionId,
          userId: user.id,
          expiresAt,
        },
      });
    
      // Send the session ID back to the client
      return c.json({ message: 'Logged in', email: user.email, phone: user.phoneNumber, fullName: user.fullName }, 200);
    } catch (error) {
      console.error(error);
      return c.json({ error: 'Login failed' }, 500);
    }
});

// Log out Endpoint
app.post('/logout', async (c) => {
    const sessionId = c.req.header('session-id');
  
    if (!sessionId) {
      return c.json({ error: 'No session ID provided' }, 401);
    }
  
    // Delete the session
    await db.session.delete({ where: { id: sessionId } });
  
    return c.json({ message: 'Logged out' }, 200);
});

// Verify Email Endpoint

app.post('/verify-email', async (c) => {
  const { token } = await c.req.json();

  if (!token) {
    return c.json({ error: 'Verification token is missing' }, 400);
  }

  // Find user by verification token
  const user = await db.user.findFirst({
    where: {
      verificationToken: token,
    },
  });

  if (!user) {
    return c.json({ error: 'Invalid or expired verification token' }, 400);
  }

  // Verify the user's email
  await db.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationToken: null, // Clear the verification token
    },
  });

  return c.json({ message: 'Email verified successfully!' }, 200);
});

// Resend Token
app.post('/resend-verification', async (c) => {
  const { email } = await c.req.json();

  // Check verification Type 
  const verificationType = c.req.header('X-Verification-Type');
  // Generate verification token
  const verificationToken = generateOTP(5)

  const user = await db.user.findUnique({
    where: { email: email },
  });

  if (!user) {
    return c.json({ error: 'Email not found' }, 404);
  }

  if (user.isVerified) {
    return c.json({ message: 'This email is already verified' });
  }

  await db.user.update({
    where: { id: user.id },
    data: { verificationToken: verificationToken, tokenExpiry: dayjs().add(20, 'm').toDate() },
  });

  
  // Send the verification email

  try {
    const { data: emailDataResend, error } = await resend.emails.send({
      from: 'updates@m.neurone.studio',
      to: [`${user.email}`],
      subject: 'Verify your email address',
      html: `
        <h1>Welcome to Our Platform!</h1>
        <p>Thank you for signing up. Please verify your email address by entering the following code:</p>
        <h2 style="font-size: 24px; letter-spacing: 2px;">${verificationToken}</h2>
        <p>This code will expire in 20 minutes.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      `
    });
  
    
    return c.json({ message: 'Verification token sent to email' }, 200);
  } catch (emailError) {
    // Log the email error but don't fail the signup
    console.error('Failed to send verification email:', emailError);
    
    return c.json({ message: 'Verification token send failed' }, 500);
  }

 
  

 
 
 


 
});

// Password Request
app.post('/password-token', async (c) => {
  const { email } = await c.req.json();

  if (!email) {
    return c.json({ error: 'Enter email to get a new password' }, 400);
  }

  // Find user by email
  const user = await db.user.findFirst({
    where: {
      email: email,
    },
  });

  if (!user) {
    return c.json({ error: 'No account found, you can create one.' }, 401);
  }

  // Generate reset token
  const verificationToken = generateOTP(5);

  // Verify the user's credentials 
  await db.user.update({
    where: { id: user.id },
    data: {
      verificationToken: verificationToken, // Add a verification token
      tokenExpiry: dayjs().add(20, 'm').toDate()
    },
  });

  // Send Email

  return c.json({ message: 'A password reset token has been sent to your email!' }, 200);
});

// Reset Password Endpoint
app.post('/reset-password', async (c) => {
  const { token, password } = await c.req.json();

  if (!token && !password || !token || !password) {
    return c.json({ error: 'Verification token or password is missing' }, 400);
  }

  // Find user by verification token
  const user = await db.user.findFirst({
    where: {
      verificationToken: token,
    },
  });


  // Validate user
  if (!user) {
    return c.json({ error: 'Invalid or expired verification token' }, 400);
  }

  // Check token validity
  if (dayjs().isAfter(dayjs(user.tokenExpiry))) {
    return c.json({ error: 'Session expired or invalid' }, 401);
  }


  // Update password
  await db.user.update({
    where: { id: user.id },
    data: {
      password: await bcrypt.hash(password, 2),
      tokenExpiry: null,
      verificationToken: null, // Clear the verification token
    },
  });

  return c.json({ message: 'Password Changed!' }, 200);
});


export default app
