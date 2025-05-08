import { Radio as RadioGroupOption } from "@headlessui/react"
import { Button, Text, clx } from "@medusajs/ui"
import React, { useContext, useMemo, useState, type JSX } from "react"
import { Frames, CardNumber, ExpiryDate, Cvv } from "frames-react";
import Radio from "@modules/common/components/radio"

import { isManual } from "@lib/constants"
import SkeletonCardDetails from "@modules/skeletons/components/skeleton-card-details"
import { CardElement } from "@stripe/react-stripe-js"
import { StripeCardElementOptions } from "@stripe/stripe-js"
import PaymentTest from "../payment-test"
import { StripeContext } from "../payment-wrapper/stripe-wrapper"

type PaymentContainerProps = {
  paymentProviderId: string
  selectedPaymentOptionId: string | null
  disabled?: boolean
  paymentInfoMap: Record<string, { title: string; icon: JSX.Element }>
  children?: React.ReactNode
}

const PaymentContainer: React.FC<PaymentContainerProps> = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  children,
}) => {
  const isDevelopment = process.env.NODE_ENV === "development"

  return (
    <RadioGroupOption
      key={paymentProviderId}
      value={paymentProviderId}
      disabled={disabled}
      className={clx(
        "flex flex-col gap-y-2 text-small-regular cursor-pointer py-4 border rounded-rounded px-8 mb-2 hover:shadow-borders-interactive-with-active",
        {
          "border-ui-border-interactive":
            selectedPaymentOptionId === paymentProviderId,
        }
      )}
    >
      <div className="flex items-center justify-between ">
        <div className="flex items-center gap-x-4">
          <Radio checked={selectedPaymentOptionId === paymentProviderId} />
          <Text className="text-base-regular">
            {paymentInfoMap[paymentProviderId]?.title || paymentProviderId}
          </Text>
          
        </div>
        <span className="justify-self-end text-ui-fg-base">
          {paymentInfoMap[paymentProviderId]?.icon}
        </span>
      </div>
      {children}
    </RadioGroupOption>
  )
}

export default PaymentContainer

export const StripeCardContainer = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  setCardBrand,
  setError,
  setCardComplete,
}: Omit<PaymentContainerProps, "children"> & {
  setCardBrand: (brand: string) => void
  setError: (error: string | null) => void
  setCardComplete: (complete: boolean) => void
}) => {
  const stripeReady = useContext(StripeContext)

  const useOptions: StripeCardElementOptions = useMemo(() => {
    return {
      style: {
        base: {
          fontFamily: "Inter, sans-serif",
          color: "#424270",
          "::placeholder": {
            color: "rgb(107 114 128)",
          },
        },
      },
      classes: {
        base: "pt-3 pb-1 block w-full h-11 px-4 mt-0 bg-ui-bg-field border rounded-md appearance-none focus:outline-none focus:ring-0 focus:shadow-borders-interactive-with-active border-ui-border-base hover:bg-ui-bg-field-hover transition-all duration-300 ease-in-out",
      },
    }
  }, [])

  return (
    <PaymentContainer
      paymentProviderId={paymentProviderId}
      selectedPaymentOptionId={selectedPaymentOptionId}
      paymentInfoMap={paymentInfoMap}
      disabled={disabled}
    >
      {selectedPaymentOptionId === paymentProviderId &&
        (stripeReady ? (
          <div className="my-4 transition-all duration-150 ease-in-out">
            <Text className="txt-medium-plus text-ui-fg-base mb-1">
              Enter your card details:
            </Text>
            <CardElement
              options={useOptions as StripeCardElementOptions}
              onChange={(e) => {
                setCardBrand(
                  e.brand && e.brand.charAt(0).toUpperCase() + e.brand.slice(1)
                )
                setError(e.error?.message || null)
                setCardComplete(e.complete)
              }}
            />
          </div>
        ) : (
          <SkeletonCardDetails />
        ))}
    </PaymentContainer>
  )
}

export const CheckoutCardContainer = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  setCardBrand,
  setError,
  setCardComplete,
  handleCkoPaymentSubmit,
}: Omit<PaymentContainerProps, "children"> & {
  setCardBrand: (brand: string) => void
  setError: (error: string | null) => void
  setCardComplete: (complete: boolean) => void
  handleCkoPaymentSubmit: (token: string) => void
}) => {
  const [stripeReady, setFrameReady] = useState(false)


  return (
    <PaymentContainer
      paymentProviderId={paymentProviderId}
      selectedPaymentOptionId={selectedPaymentOptionId}
      paymentInfoMap={paymentInfoMap}
      disabled={disabled}
    >
      {selectedPaymentOptionId === paymentProviderId &&
        <div className="my-4 transition-all duration-150 ease-in-out">
          <Frames
            config={{
              debug: true,
              publicKey: "pk_sbox_tc6nh5vojzoa5d7umlgauzniamz",
              localization: {
                cardNumberPlaceholder: "Card number",
                expiryMonthPlaceholder: "MM",
                expiryYearPlaceholder: "YY",
                cvvPlaceholder: "CVV",
              },
              style: {
                base: {
                  color: "#000",
                  fontSize: "16px",
                  fontFamily: "inherit",

                },
                invalid: {
                  color: "#e53e3e", // red text
                  borderColor: "#e53e3e", // red border
                },
                focus: {
                  borderColor: "#3182ce", // blue on focus
                }
              }
            }}
            ready={() => {}}
            frameActivated={(e) => { }}
            frameFocus={(e) => { }}

            paymentMethodChanged={(e) => { }}
            cardValidationChanged={(e) => {
              if (e.isValid) {
                setFrameReady(true)
                setCardComplete(true)
              } else {
                setFrameReady(false)
                setCardComplete(false)
              }
            }}
            cardSubmitted={() => { }}
            cardTokenized={(e) => {  handleCkoPaymentSubmit(e.token) }}
            cardTokenizationFailed={(e) => { }}
            cardBinChanged={(e) => { }}
          >
            <div className="space-y-4">
              <label className="block text-sm font-medium">Card Number</label>
              <div className="border rounded-md p-2">
                <CardNumber className="w-full h-10" />
              </div>

              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium">Expiry</label>
                  <div className="border rounded-md p-2">
                    <ExpiryDate className="w-full h-10" />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium">CVV</label>
                  <div className="border rounded-md p-2">
                    <Cvv className="w-full h-10" />
                  </div>
                </div>
              </div>
              <Button size="large"
                className="mt-6"
                data-testid="submit-payment-button"
                onClick={() => {
                  Frames.submitCard();
                }}
                disabled={!stripeReady}
                >
                Pay Now
              </Button>
            </div>
          </Frames>
        </div>
      }
    </PaymentContainer>
  )
}