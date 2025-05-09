"use client"

import { RadioGroup } from "@headlessui/react"
import {
  isCheckoutPaymentFunc,
  isStripe as isStripeFunc,
  paymentInfoMap,
} from "@lib/constants"
import {
  initiateCkoPaymentSession,
  initiatePaymentSession,
} from "@lib/data/cart"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import { Button, Container, Heading, Text, clx } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import Divider from "@modules/common/components/divider"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Frames, CardNumber, ExpiryDate, Cvv } from "frames-react"
import PaymentContainer, {
  StripeCardContainer,
  CheckoutCardContainer,
} from "../payment-container"
import { useCheckoutContext } from "../checkout-wrapper/stripe-wrapper"
import { metadata } from "app/layout"
import CheckoutFlow from "./CheckoutFlow"
import Spinner from "@modules/common/icons/spinner"
const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: any
  availablePaymentMethods: any[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )

  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [checkoutCardComplete, setCheckoutCard] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const isOpen = searchParams.get("step") === "payment"
  
  console.log("cart", cart)
  
  const isCheckoutPayment = useMemo(() => {
    return isCheckoutPaymentFunc(activeSession?.provider_id)
  }, [activeSession?.provider_id])
  
  const [isLoading, setIsLoading] = useState(false)
  const [ckoSession, setCkoSession] = useState<any>(null)
  const hasInitiatedRef = useRef(false)

  useEffect(() => {
    const initiateSession = async () => {
      setIsLoading(true)

      const selectSession = cart.payment_collection?.payment_sessions?.find(
        (paymentSession: any) => paymentSession.status === "pending"
      )

      const response: any = await initiatePaymentSession(cart, {
        provider_id: "pp_checkout-com_checkout-com",
        data: {
          cart_id: cart?.id,
          billing: {
            address: {
              country: cart?.billing_address?.country_code?.toUpperCase(),
            },
          },
          success_url:
            process.env.NEXT_PUBLIC_BASE_URL +
            "/api/payment/checkout/processor" +
            "?cart_id=" +
            cart?.id,
          failure_url:
            process.env.NEXT_PUBLIC_BASE_URL +
            "/api/payment/checkout/processor" +
            "?cart_id=" +
            cart?.id,
          amount: cart?.total,
          currency_code: cart?.currency_code?.toUpperCase(),
          metadata: {
            medusa_payment_collection_id: selectSession?.payment_collection_id,
            medusa_payment_session_id: selectSession?.id,
          },
        },
      })
      setCkoSession(
        response?.payment_collection?.payment_sessions?.[0]?.data?.ckoSession
      )
      hasInitiatedRef.current = true
    }

    if (isOpen&&cart && !ckoSession && !hasInitiatedRef.current) {
      initiateSession()
    }
  }, [cart, isCheckoutPayment, ckoSession])

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const paymentReady =
    (activeSession && cart?.shipping_methods.length !== 0) || paidByGiftcard

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const shouldInputCard =
        isStripeFunc(selectedPaymentMethod) && !activeSession

      const checkActiveSession =
        activeSession?.provider_id === selectedPaymentMethod

      if (!checkActiveSession) {
        !isCheckoutPaymentFunc(selectedPaymentMethod) &&
          (await initiatePaymentSession(cart, {
            provider_id: selectedPaymentMethod,
          }))
      }

      if (!shouldInputCard) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          {
            scroll: false,
          }
        )
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          Payment
          {!isOpen && paymentReady && <CheckCircleSolid />}
        </Heading>
        {!isOpen && paymentReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              data-testid="edit-payment-button"
            >
              Edit
            </button>
          </Text>
        )}
      </div>
      <div>
        {isLoading && (
          <div className="flex items-center justify-center w-full h-full text-ui-fg-base">
            <Spinner size={36} />
          </div>
        )}
        <div className={isLoading ? "hidden" : ""}>
          <CheckoutFlow
            setIsLoading={setIsLoading}
            cart={cart}
            ckoSession={ckoSession}
          />
        </div>
        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession ? (
            <div className="flex items-start gap-x-1 w-full">
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Payment method
                </Text>
                <Text
                  className="txt-medium text-ui-fg-subtle"
                  data-testid="payment-method-summary"
                >
                  {paymentInfoMap[activeSession?.provider_id]?.title ||
                    activeSession?.provider_id}
                </Text>
              </div>
              <div className="flex flex-col">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Payment details
                </Text>
                <div
                  className="flex gap-2 txt-medium text-ui-fg-subtle items-center"
                  data-testid="payment-details-summary"
                >
                  <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                    {paymentInfoMap[selectedPaymentMethod]?.icon || (
                      <CreditCard />
                    )}
                  </Container>
                  <Text>
                    {isStripeFunc(selectedPaymentMethod) && cardBrand ? (
                      cardBrand
                    ) : (
                      <>
                        {isCheckoutPayment
                          ? "Another step will appear"
                          : "Pay in cash/accepted methods when your order arrives."}
                      </>
                    )}
                  </Text>
                </div>
              </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment method
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Gift card
              </Text>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default Payment
