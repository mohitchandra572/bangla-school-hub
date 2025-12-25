import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SSLCommerzConfig {
  store_id: string;
  store_password: string;
  is_sandbox: boolean;
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
    console.log('SSLCommerz action:', action);

    // Get SSLCommerz config from system_settings
    const { data: configData } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'sslcommerz_config')
      .single();

    if (!configData?.value?.data) {
      throw new Error('SSLCommerz configuration not found. Please configure in System Settings.');
    }

    const config: SSLCommerzConfig = configData.value.data;
    const baseUrl = config.is_sandbox 
      ? 'https://sandbox.sslcommerz.com' 
      : 'https://securepay.sslcommerz.com';

    let result;

    switch (action) {
      case 'init':
        console.log('Initializing SSLCommerz payment...');
        
        const initData = new URLSearchParams({
          store_id: config.store_id,
          store_passwd: config.store_password,
          total_amount: payload.amount.toString(),
          currency: 'BDT',
          tran_id: payload.transaction_id,
          success_url: payload.success_url,
          fail_url: payload.fail_url,
          cancel_url: payload.cancel_url,
          ipn_url: payload.ipn_url || payload.success_url,
          cus_name: payload.customer_name,
          cus_email: payload.customer_email || 'customer@school.com',
          cus_phone: payload.customer_phone,
          cus_add1: payload.customer_address || 'Bangladesh',
          cus_city: 'Dhaka',
          cus_country: 'Bangladesh',
          shipping_method: 'NO',
          product_name: payload.product_name || 'School Fee',
          product_category: 'Education',
          product_profile: 'general',
          value_a: payload.student_id || '',
          value_b: payload.fee_id || '',
          value_c: payload.invoice_id || '',
        });

        const initResponse = await fetch(`${baseUrl}/gwprocess/v4/api.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: initData.toString(),
        });

        result = await initResponse.json();
        console.log('SSLCommerz init response:', result.status);

        if (result.status === 'SUCCESS') {
          // Store transaction for tracking
          await supabase.from('payment_transactions').insert({
            student_id: payload.student_id,
            invoice_id: payload.invoice_id,
            amount: payload.amount,
            payment_method: 'sslcommerz',
            payment_method_bn: 'এসএসএল কমার্জ',
            transaction_number: payload.transaction_id,
            status: 'pending',
          });
        }
        break;

      case 'validate':
        console.log('Validating SSLCommerz payment:', payload.val_id);
        
        const validateUrl = `${baseUrl}/validator/api/validationserverAPI.php?` +
          `val_id=${payload.val_id}&store_id=${config.store_id}&store_passwd=${config.store_password}&format=json`;

        const validateResponse = await fetch(validateUrl);
        result = await validateResponse.json();
        console.log('SSLCommerz validate response:', result.status);

        if (result.status === 'VALID' || result.status === 'VALIDATED') {
          // Update payment transaction
          await supabase.from('payment_transactions')
            .update({
              status: 'completed',
              gateway_transaction_id: result.bank_tran_id,
              gateway_response: result,
              payment_date: new Date().toISOString(),
              verified_at: new Date().toISOString(),
            })
            .eq('transaction_number', result.tran_id);

          // Update fee status
          if (result.value_b) {
            await supabase.from('fees').update({
              status: 'paid',
              paid_date: new Date().toISOString(),
              payment_method: 'sslcommerz',
              transaction_id: result.bank_tran_id,
            }).eq('id', result.value_b);
          }
        }
        break;

      case 'refund':
        console.log('Processing SSLCommerz refund...');
        
        const refundData = new URLSearchParams({
          store_id: config.store_id,
          store_passwd: config.store_password,
          bank_tran_id: payload.bank_tran_id,
          refund_amount: payload.refund_amount.toString(),
          refund_remarks: payload.remarks || 'Refund requested',
        });

        const refundResponse = await fetch(`${baseUrl}/validator/api/merchantTransIDvalidationAPI.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: refundData.toString(),
        });

        result = await refundResponse.json();
        console.log('SSLCommerz refund response:', result.status);
        break;

      case 'status':
        console.log('Checking SSLCommerz transaction status...');
        
        const statusUrl = `${baseUrl}/validator/api/merchantTransIDvalidationAPI.php?` +
          `tran_id=${payload.tran_id}&store_id=${config.store_id}&store_passwd=${config.store_password}&format=json`;

        const statusResponse = await fetch(statusUrl);
        result = await statusResponse.json();
        console.log('SSLCommerz status response:', result.status);
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('SSLCommerz payment error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
