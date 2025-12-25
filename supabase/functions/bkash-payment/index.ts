import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BkashConfig {
  app_key: string;
  app_secret: string;
  username: string;
  password: string;
  base_url: string;
}

// Get bKash token
async function getBkashToken(config: BkashConfig): Promise<string> {
  console.log('Getting bKash token...');
  
  const response = await fetch(`${config.base_url}/tokenized/checkout/token/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'username': config.username,
      'password': config.password,
    },
    body: JSON.stringify({
      app_key: config.app_key,
      app_secret: config.app_secret,
    }),
  });

  const data = await response.json();
  console.log('bKash token response:', data.statusCode || 'success');
  
  if (data.statusCode && data.statusCode !== '0000') {
    throw new Error(data.statusMessage || 'Failed to get bKash token');
  }
  
  return data.id_token;
}

// Create bKash payment
async function createPayment(config: BkashConfig, token: string, paymentData: any): Promise<any> {
  console.log('Creating bKash payment...');
  
  const response = await fetch(`${config.base_url}/tokenized/checkout/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token,
      'X-APP-Key': config.app_key,
    },
    body: JSON.stringify({
      mode: '0011',
      payerReference: paymentData.payer_reference,
      callbackURL: paymentData.callback_url,
      amount: paymentData.amount.toString(),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: paymentData.invoice_number,
    }),
  });

  const data = await response.json();
  console.log('bKash create payment response:', data.statusCode || data.paymentID);
  
  return data;
}

// Execute bKash payment
async function executePayment(config: BkashConfig, token: string, paymentID: string): Promise<any> {
  console.log('Executing bKash payment:', paymentID);
  
  const response = await fetch(`${config.base_url}/tokenized/checkout/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token,
      'X-APP-Key': config.app_key,
    },
    body: JSON.stringify({ paymentID }),
  });

  const data = await response.json();
  console.log('bKash execute payment response:', data.statusCode || data.trxID);
  
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, ...payload } = await req.json();
    console.log('bKash action:', action);

    // Get bKash config from system_settings
    const { data: configData } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'bkash_config')
      .single();

    if (!configData?.value?.data) {
      throw new Error('bKash configuration not found. Please configure in System Settings.');
    }

    const configValue = configData.value.data;
    const config: BkashConfig = {
      app_key: configValue.app_key,
      app_secret: configValue.app_secret,
      username: configValue.username,
      password: configValue.password,
      base_url: configValue.is_sandbox 
        ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta' 
        : 'https://tokenized.pay.bka.sh/v1.2.0-beta',
    };

    let result;

    switch (action) {
      case 'create':
        const token = await getBkashToken(config);
        result = await createPayment(config, token, payload);
        break;

      case 'execute':
        const execToken = await getBkashToken(config);
        result = await executePayment(config, execToken, payload.paymentID);
        
        // If payment successful, update database
        if (result.statusCode === '0000' && result.transactionStatus === 'Completed') {
          console.log('Payment successful, updating database...');
          
          // Update payment transaction
          await supabase.from('payment_transactions').insert({
            student_id: payload.student_id,
            invoice_id: payload.invoice_id,
            amount: parseFloat(result.amount),
            payment_method: 'bkash',
            payment_method_bn: 'বিকাশ',
            transaction_number: result.trxID,
            gateway_transaction_id: result.paymentID,
            gateway_response: result,
            status: 'completed',
            payment_date: new Date().toISOString(),
          });

          // Update fee status
          if (payload.fee_id) {
            await supabase.from('fees').update({
              status: 'paid',
              paid_date: new Date().toISOString(),
              payment_method: 'bkash',
              transaction_id: result.trxID,
            }).eq('id', payload.fee_id);
          }
        }
        break;

      case 'query':
        const queryToken = await getBkashToken(config);
        const queryResponse = await fetch(`${config.base_url}/tokenized/checkout/payment/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': queryToken,
            'X-APP-Key': config.app_key,
          },
          body: JSON.stringify({ paymentID: payload.paymentID }),
        });
        result = await queryResponse.json();
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('bKash payment error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
