// Paystack
import { Hono } from 'hono'
import { env } from 'hono/adapter'


const app = new Hono()


app.get('/', (c) => c.json('create a checkout url', 201))
app.get('/:id', (c) => c.json(`get ${c.req.param('id')}`))

app.post('/checkout-url', async (c) => {
    const { PAYSTACK_SECRET_KEY } = env<{ PAYSTACK_SECRET_KEY: string }>(c)
        //Check for Empty Payload
    try {
        const { email, amount } = await c.req.json();
  
        if (!email || !amount || !email && !amount) {
          return c.json({error: 'Empty Payload'}, 400)
        }

        const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({email: email, amount: amount})
        });

        if (!paystackResponse.ok) {
            throw new Error(`Response status: ${paystackResponse.json()}`);
        }

        const response = await paystackResponse.json()

        
      
        // Send the session ID back to the client
        return c.json({ message: 'Url generated', response }, 200);
      } catch (error) {
        console.error(error);
        return c.json({ error: 'Url generation failed' }, 500);
      }
})



export default app