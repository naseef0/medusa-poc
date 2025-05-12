import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  PaymentActions,
} from "@medusajs/framework/types"
import { processPaymentWorkflow } from "@medusajs/medusa/core-flows";


/**
 * Determines payment status and returns appropriate amount configuration
 * @param response Payment response object from payment provider
 * @returns Object with payment status and amount information
 */
function getPaymentAmountConfig(response: any): any {
  // Default response
  const config = {
    status: 'pending',
    amount: 0,
    isComplete: false
  };

  // Return early if no balances information available
  if (!response?.balances) {
    return config;
  }

  const balances = response.balances;

  // Determine payment status
  if (balances.total_captured > 0 && balances.available_to_capture === 0) {
    config.status = 'captured';
    config.amount = balances.total_captured;
    config.isComplete = true;
  } else if (balances.total_authorized > 0 && balances.total_captured === 0) {
    config.status = 'authorized';
    config.amount = balances.total_authorized;
    config.isComplete = false;
  } else if (balances.total_voided > 0 && balances.available_to_void === 0) {
    config.status = 'canceled';
    config.isComplete = true;
  } else if (balances.total_refunded > 0 && balances.available_to_refund === 0) {
    config.status = 'refunded';
    config.isComplete = true;
    config.amount = balances.total_refunded;
  }

  return config;
}
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {

  const paymentDetails = req.body as any;
  const paymentSessionId = paymentDetails?.data?.metadata?.medusa_payment_session_id;
  const paymentConfig = getPaymentAmountConfig(paymentDetails?.data);
  const paymentModuleService = req.scope.resolve("payment");

  await paymentModuleService.authorizePaymentSession(
    paymentSessionId,
    {
      paymentId: paymentDetails?.data?.id,
      source: {
        paymentId: paymentDetails?.data?.id,
        type: paymentDetails?.data?.source?.type,
        "expiry_month": paymentDetails?.data?.source.expiry_month,
        "expiry_year": paymentDetails?.data?.source.expiry_year,
        "name": paymentDetails?.data?.source.name,
        "scheme": paymentDetails?.data?.source.scheme,
        "last_4": paymentDetails?.data?.source.last_4,
        "bin": paymentDetails?.data?.source.bin,
      }, 
      paymentSessionId, 
      medusaStatus: paymentConfig.status
    }
  )

 await processPaymentWorkflow(req.scope)
    .run({
      input: {
        action: paymentConfig.status as PaymentActions,
        data: {
          session_id: paymentSessionId,
          amount: paymentConfig?.amount,
        }
      }
    })

  res.json({
    message: "Success",
  })
}