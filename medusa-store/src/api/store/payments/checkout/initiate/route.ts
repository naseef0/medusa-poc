import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createPaymentCollectionForCartWorkflow, createPaymentSessionsWorkflow } from "@medusajs/medusa/core-flows"
import Checkout from "checkout-sdk-node"
import { z } from "zod"

export const PaymentRequestSchema = z.object({
  cart_id: z.string().optional(),
  cko_token: z.string().optional(),
  amount: z.number().optional(),
  currency_code: z.string().optional(),
  success_url: z.string().optional(),
  failure_url: z.string().optional(),
  payment_collection_id: z.string().optional(),
  billing: z.object({
    address: z.object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
      country_code: z.string().optional(),
    }).optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
  metadata:z.object( {
    medusa_payment_collection_id: z.string().optional(),
  }).optional(),
})

type PaymentRequest = z.infer<typeof PaymentRequestSchema>

export async function POST(
  req: MedusaRequest<PaymentRequest>,
  res: MedusaResponse
) {
  const { cart_id, cko_token, amount, currency_code, success_url, failure_url, billing,metadata } = req.body
  console.log("metadata",metadata);
  
  // Validate the request body
  if (!cart_id) {
    return res.status(400).json({ error: "Missing cart_id or cko_token" })
  }
  const cko = new Checkout(process.env.CHECKOUT_COM_SECRET_KEY)

  const paymentIntent: any = await cko.paymentSessions.request({
    "amount": (amount as number * 100),
    "currency": currency_code?.toUpperCase(),
    "billing": billing,
    "success_url": success_url + "?cart_id=" + cart_id,
    "failure_url": failure_url + "?cart_id=" + cart_id,
    capture: false,
    "3ds": {
      "enabled": true
    },
    enabled_payment_methods: ["card"],
    processing_channel_id: "pc_jiyqvedfahaehhlewlhk3o3owm",
    ...(metadata ? {metadata} : {}),
  })

  console.log("\n\n paymentIntent", paymentIntent);
  res.json({...paymentIntent})
}