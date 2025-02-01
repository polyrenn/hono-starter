import { Hono } from 'hono';
import { db } from './utils/db';
import { env } from 'hono/adapter'
import Airtable from 'airtable';

// Prisma
import { Prisma } from '@prisma/client';

const app = new Hono();

const airtableApiKey = process.env.AIRTABLE_TOKEN_KEY

app.get('/', async (c) => {
    const airtableApiKey = process.env.AIRTABLE_TOKEN_KEY
    const { AIRTABLE_TOKEN_KEY } = env<{ AIRTABLE_TOKEN_KEY: string }>(c)
    try {
        const airtableResponse = await fetch("https://api.airtable.com/v0/appBniX8lNXPuKs1x/Available%20Times?maxRecords=3&view=Grid%20view&fields%5B%5D=availableTimes&fields%5B%5D=date", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${AIRTABLE_TOKEN_KEY}`,
            },
        });
        if (!airtableResponse.ok) {
            throw new Error(`Response status: ${airtableResponse.json()}`);
        }

        const response = await airtableResponse.json()

        return c.json({message: 'Success', response: response}, 200)
    } catch (error) {
        return c.json({message: AIRTABLE_TOKEN_KEY}, 500)
    }
})

app.get('/available-times', async (c) => {
    const airtableApiKey = process.env.AIRTABLE_TOKEN_KEY
    const { AIRTABLE_TOKEN_KEY } = env<{ AIRTABLE_TOKEN_KEY: string }>(c)
    try {
        const airtableResponse = await fetch("https://api.airtable.com/v0/appBniX8lNXPuKs1x/Available%20Times?maxRecords=3&view=Grid%20view&fields%5B%5D=availableTimes&fields%5B%5D=date", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${AIRTABLE_TOKEN_KEY}`,
            },
        });
        if (!airtableResponse.ok) {
            throw new Error(`Response status: ${airtableResponse.json()}`);
        }

        const response = await airtableResponse.json()

        return c.json({message: 'Success', response: response}, 200)
    } catch (error) {
        return c.json({message: AIRTABLE_TOKEN_KEY}, 500)
    }
})

// Move Sales People

app.get('/sales-people', async (c) => {
    const airtableApiKey = process.env.AIRTABLE_TOKEN_KEY
    const { AIRTABLE_TOKEN_KEY } = env<{ AIRTABLE_TOKEN_KEY: string }>(c)
    try {
        const airtableResponse = await fetch("https://api.airtable.com/v0/appBniX8lNXPuKs1x/Sales%20People?fields%5B%5D=email&fields%5B%5D=name&fields%5B%5D=serviceArea&fields%5B%5D=status&view=Grid%20view", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${AIRTABLE_TOKEN_KEY}`,
            },
        });
        if (!airtableResponse.ok) {
            throw new Error(`Response status: ${airtableResponse.json()}`);
        }

        const response = await airtableResponse.json()

        return c.json({message: 'Success', response: response}, 200)
    } catch (error) {
        return c.json({message: AIRTABLE_TOKEN_KEY}, 500)
    }
})

app.post('/book', async (c) => {
    // const { date, time, customerName, salesPerson } = await c.req.json();
    const { AIRTABLE_TOKEN_KEY } = env<{ AIRTABLE_TOKEN_KEY: string }>(c)
    const { AIRTABLE_BASE_ID } = env<{ AIRTABLE_BASE_ID: string }>(c)

    Airtable.configure({
        endpointUrl: 'https://api.airtable.com',
        apiKey: AIRTABLE_TOKEN_KEY
    });
    const base = Airtable.base('appBniX8lNXPuKs1x');
    const body = await c.req.json();

    // Basic input validation (Add more robust checks as needed)
    if (!body || !body.fields) {
        return c.json({ success: false, error: 'Missing "fields" in request body' }, 400);
    }

    try {
        const createdRecords = await base('Appointments').create([
        { fields: body.fields }, // Assuming the request body contains the entire 'fields' object
        ]);

        const recordIds = createdRecords.map((record) => record.getId());
        return c.json({ success: true, recordIds });
    } catch (error) {
        console.error('Error creating Airtable record:', error);
        // More specific error handling could be added here based on error types from Airtable
        return c.json({ success: false, error: error }, 500);
    }
})

app.patch('/', async (c) => {
    const { AIRTABLE_TOKEN_KEY } = env<{ AIRTABLE_TOKEN_KEY: string }>(c);

    Airtable.configure({
        endpointUrl: 'https://api.airtable.com',
        apiKey: AIRTABLE_TOKEN_KEY,
    });
    const base = Airtable.base('appBniX8lNXPuKs1x');
    const body = await c.req.json();

    // Input validation
    if (!body || !body.id || !body.fields) {
        return c.json({ success: false, error: 'Missing "id" or "fields" in request body' }, 400);
    }

    const recordId = body.id;
    const fieldsToUpdate = body.fields; // Get fields from the request body

    try {
        const updatedRecords = await base('Appointments').update([
            {
                "id": recordId,
                "fields": fieldsToUpdate, // Use the dynamic fields object
            },
        ]);

        return c.json({ success: true, recordIds: updatedRecords.map((record) => record.getId()) });
    } catch (error) {
        console.error('Error updating appointment:', error);
        return c.json({ success: false, error: error }, 500);
    }
});

// Add proper error text, a message field

export default app
