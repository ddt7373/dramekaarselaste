const YOCO_SECRET_KEY = Deno.env.get('YOCO_SECRET_KEY') ?? '';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("Yoco Checkout Function Started");

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { amount, currency, metadata, successUrl, cancelUrl, failureUrl } = await req.json()

        if (!amount) {
            throw new Error('Amount is required')
        }

        // Yoco API endpoint for creating a checkout
        const response = await fetch('https://payments.yoco.com/api/checkouts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${YOCO_SECRET_KEY}`
            },
            body: JSON.stringify({
                amount: amount, // Amount in cents
                currency: currency || 'ZAR',
                metadata: metadata || {},
                successUrl: successUrl,
                cancelUrl: cancelUrl,
                failureUrl: failureUrl
            })
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Yoco API Error:', data);
            throw new Error(data.message || 'Failed to create Yoco checkout')
        }

        console.log('Yoco checkout created:', data.id);

        return new Response(
            JSON.stringify({
                success: true,
                redirectUrl: data.redirectUrl,
                checkoutId: data.id,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Error:', error.message);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
