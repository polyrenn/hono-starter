// Subscriptions
import { Hono } from 'hono'
import { env } from 'hono/adapter'


const app = new Hono()


app.post('/', (c) => c.json('create a subscription', 201))
app.get('/:id', (c) => c.json(`get ${c.req.param('id')}`))



app.get('/', async (c) => {
    const airtableApiKey = process.env.AIRTABLE_TOKEN_KEY
    const { AIRTABLE_TOKEN_KEY } = env<{ AIRTABLE_TOKEN_KEY: string }>(c)
    try {
        const airtableResponse = await fetch("https://api.airtable.com/v0/appBniX8lNXPuKs1x/Subscription%20Plans?maxRecords=3&view=Grid%20view", {
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



export default app