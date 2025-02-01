import { Hono } from 'hono';
import { db } from '../utils/db';
import { env } from 'hono/adapter'

// Prisma
import { Prisma } from '@prisma/client';

const app = new Hono();

const airtableApiKey = process.env.AIRTABLE_TOKEN_KEY

app.get('/', async (c) => {
    const airtableApiKey = process.env.AIRTABLE_TOKEN_KEY
    const { AIRTABLE_TOKEN_KEY } = env<{ AIRTABLE_TOKEN_KEY: string }>(c)
    try {
        const airtableResponse = await fetch("https://api.airtable.com/v0/appBniX8lNXPuKs1x/Available%20Times?maxRecords=3&view=Grid%20view", {
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

    try {
        const airtableResponse = await fetch("https://api.airtable.com/v0/appBniX8lNXPuKs1x/Appointments", {
            method: "POST",
            body: JSON.stringify( {
                records: [
                    {
                      "fields": {
                        "Customer Name": "Grieezman",
                        "Appointment Date": "2024-08-21",
                        "Customer Address": "North Roplez Avenue",
                        "Sales Person": [
                        "recJLPJg1EDhsVPtR"
                        ],
                        "Available Time Slot": [
                        "rec2kK2Sm6FUA9Ybc"
                        ],
                        "Appointment Confirmation": true
                       }
                    },
                ]
            } ),
            headers: {
                Authorization: `Bearer ${airtableApiKey}`,
                'Content-Type': 'application/json',
            },
        });
        if (!airtableResponse.ok) {
            throw new Error(`Response status: ${airtableResponse.status}`);
        }

        return c.json({message: 'Success', response: airtableResponse.text}, 200)
    } catch (error) {
        return c.json({message: error}, 500)
    }

    
})

export default app
