import { AbstractPaymentProvider } from "@medusajs/framework/utils"
import {
  Logger,
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  PaymentSessionStatus,
  ProviderWebhookPayload,
  WebhookActionResult
} from "@medusajs/framework/types"
import { BigNumber, MedusaError } from "@medusajs/framework/utils"
import { Checkout } from "checkout-sdk-node"

type CheckoutComOptions = {
  secretKey: string
  publicKey?: string
  clientId?: string
  scope?: string[]
  environment?: string
  webhookSecret?: string
  processingChannelId?: string
}

type InjectedDependencies = {
  logger: Logger
}

class CheckoutComPaymentService extends AbstractPaymentProvider<CheckoutComOptions> {
  static identifier = "checkout-com"
  protected logger_: Logger
  protected options_: CheckoutComOptions
  protected client_: Checkout

  constructor(
    container: InjectedDependencies,
    options: CheckoutComOptions
  ) {
    super(container, options)

    this.logger_ = container.logger
    this.options_ = options

    try {
      // Initialize the Checkout.com client
      // Using access credentials
      if (options.publicKey) {
        this.client_ = new Checkout(options.secretKey, {
          pk: options.publicKey,
        })
      }
    } catch (error) {
      this.logger_.error("Error initializing Checkout.com client", error)
      throw error
    }
  }

  static validateOptions(options: Record<string, unknown>): void {
    if (!options.secretKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Secret key is required in the Checkout.com provider's options."
      )
    }

    // If client ID is provided, scope is required
    if (options.clientId && !options.scope) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Scope is required when using client ID for Checkout.com"
      )
    }

    // If using API keys, public key is required
    if (!options.clientId && !options.publicKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Public key is required when using API keys for Checkout.com"
      )
    }
  }

  async initiatePayment(
    input: InitiatePaymentInput,

  ): Promise<InitiatePaymentOutput> {
      //TODO: Implement initiatePayment
    return {
      id: "",
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const context = input?.context as any
    try {
      const paymentId = context?.paymentId as string ?? ""
      const source = context?.source

      console.log("context", input);

      return {
        status: context?.medusaStatus ?? "authorized",
        data: { success: true, ...(paymentId ? { paymentId } : {}), ...(source ? source : {}) }
      }
    } catch (error) {
      this.logger_.error("Error authorizing Checkout.com payment", error)
      throw error
    }
  }

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    try {
      const { data } = input
      const paymentId = data?.paymentId as string ?? ""
console.log();

      if (!paymentId) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Missing payment ID in capture request"
        )
      }

      // Capture the full payment amount in Checkout.com
      const captureResponse = await this.client_.payments.capture(paymentId)

      return {
        data: { ...captureResponse }
      }
    } catch (error) {
      this.logger_.error("Error capturing Checkout.com payment", error)
      throw error
    }
  }

  async cancelPayment(
    input: CancelPaymentInput
  ): Promise<CancelPaymentOutput> {
    try {
      const { data } = input
      const paymentId = data?.paymentId as string ?? ""
      console.log("---> retrievePayment", input);

      if (!paymentId) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Missing payment ID in cancel request"
        )
      }

      // Cancel the payment in Checkout.com
      const cancelResponse = await this.client_.payments.void(paymentId)

      return {
        data: { ...cancelResponse }
      }
    } catch (error) {
      this.logger_.error("Error canceling Checkout.com payment", error)
      throw error
    }
  }

  async deletePayment(
    input: DeletePaymentInput
  ): Promise<DeletePaymentOutput> {
    try {
      const { data } = input
      const paymentId = data?.paymentId as string ?? ""
      console.log("---> retrievePayment", input);

      if (!paymentId) {
        this.logger_.warn("No payment ID to delete, skipping")
        return {}
      }

      // For Checkout.com, we can't truly delete a payment
      // So we'll try to void/cancel it if it's in a state that allows it
      try {
        await this.client_.payments.void(paymentId)
      } catch (cancelError) {
        this.logger_.warn(
          `Could not void payment ${paymentId} during deletion, it may already be completed or canceled`,
        )
      }

      return {}
    } catch (error) {
      this.logger_.error("Error deleting Checkout.com payment", error)
      throw error
    }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    try {
      const { data } = input
      const paymentId = data?.paymentId as string ?? ""

      if (!paymentId) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Missing payment ID in status request"
        )
      }

      // Get payment status from Checkout.com
      const paymentDetails = await this.client_.payments.get(paymentId)

      // Map Checkout.com status to Medusa status
      let status: PaymentSessionStatus = "pending"

      switch (paymentDetails.status) {
        case "Authorized":
          status = "authorized"
          break
        case "Captured":
          status = "captured"
          break
        case "Declined":
        case "Expired":
        case "Canceled":
          status = "canceled"
          break
        default:
          status = "pending"
      }

      return { status }
    } catch (error) {
      this.logger_.error("Error getting Checkout.com payment status", error)
      throw error
    }
  }

  async refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    try {
      const { data, amount } = input
      console.log("input", input);

      
      const paymentId = input?.data?.paymentId as string ?? ""

      if (!paymentId) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Missing payment ID in refund request"
        )
      }

      // Process refund through Checkout.com
      const refundResponse = await this.client_.payments.refund(paymentId)

      return {
        data: { ...refundResponse }
      }
    } catch (error) {
      this.logger_.error("Error refunding Checkout.com payment", error)
      throw error
    }
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    try {      
      // TODO: Implement updatePayment 
      return {
        data: {}
      }
    } catch (error) {
      this.logger_.error("Error retrieving Checkout.com payment", error)
      throw error
    }
  }

  async updatePayment(
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    try {
      // TODO: Implement updatePayment 
      return {
        data: {}
      }
    } catch (error) {
      this.logger_.error("Error updating Checkout.com payment", error)
      throw error
    }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<any> {
    try {
      const { data: response, headers } = payload as any

      // Validate webhook signature if provided
      // This is important for security
      if (this.options_.webhookSecret && headers["cko-signature"]) {
        // Implementation for signature validation would go here
        // For now, we'll skip this implementation detail
      }

      const balances = response.data.balances;

      // Determine payment status
      if (balances.total_captured > 0 && balances.available_to_capture === 0) {
        return {
          action: "captured",
          data: {
            session_id: response.data.metadata?.medusa_payment_session_id,
            amount: balances.total_authorized,
            response
          }
        }
      } else if (balances.total_authorized > 0 && balances.total_captured === 0) {
        return {
          action: "authorized",
          data: {
            session_id: response.data.metadata?.medusa_payment_session_id,
            amount: balances.total_authorized,
            response
          }
        }
      } else if (balances.total_voided > 0 && balances.available_to_void === 0) {
        return {
          action: "canceled",
          data: {
            session_id: response.data.metadata?.medusa_payment_session_id,
            amount: balances.total_authorized
          }
        }
      } else {
        return {
          action: "not_supported"
        }
      }

    } catch (error) {
      this.logger_.error("Error processing Checkout.com webhook", error)
      return {
        action: "failed",
      }
    }
  }
}

export default CheckoutComPaymentService