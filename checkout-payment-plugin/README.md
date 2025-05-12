# Medusa Checkout.com Payment

## What is it?

Medusa Checkout.com Payment is a basic integration of payment provider for Checkout.com Payment.

## Installation

1. Install plugin by adding to your `package.json`:

**Warning**

```json
...
"checkout-payment-plugin-by-valoriz": "1.0.0" // or other available version
...
```
and execute install, e.g. `yarn install`.

2. Add plugin to your `medusa-config.js` (**Note** - please notice that you need to add it to payment plugin):

```js
...
  plugins: [
    {
      resolve: "checkout-payment-plugin-by-valoriz",
      options: {},
    }
  ],
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "checkout-payment-plugin-by-valoriz/providers/checkout-payment",
            id: "checkout-com",
            options: {
              secretKey: process.env.CHECKOUT_COM_SECRET_KEY,
              publicKey: process.env.CHECKOUT_COM_PUBLIC_KEY,
              processingChannelId: process.env.CHECKOUT_COM_PROCESSING_CHANNEL_ID,
              webhookSecret: process.env.CHECKOUT_COM_WEBHOOK_SECRET
            }
          }
        ],
      },
    },
  ]
...
```

## Overview

The basic implementation of Checkout.com payment provider gives the possibility to make a payment in your storefront.

## Configuration

Plugin uses 3 required parameter:

- `secretKey` - required parameter which you can find in your Checkout.com Developer Dashboard
- `publicKey` - required parameter which you can find in your Checkout.com Developer Dashboard
- `webhookSecret` - required parameter which you can find in your Checkout.com Developer Dashboard
- `processing_channel` - required parameter which you can find in your Checkout.com Developer Dashboard


After above configuration, you can then add the payment provider to your region.

4. Configure the endpoint URL `/store/webhooks/cko` in the Webhooks settings on the Checkout.com Dashboard.

HTTP Headers:
Key:` x-publishable-api-key`

Value: (your Medusa publishable API key)

## Storefront

Here is the example of using credit card as payment:

```tsx
 
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

    if (cart && !ckoSession && !hasInitiatedRef.current) {
      initiateSession()
    }
  }, [cart, isCheckoutPayment, ckoSession])

 ...

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
 
```
CheckoutFlow.tsx
```tsx
import React, { useEffect, useState, useRef } from 'react';
import { HttpTypes } from '@medusajs/types';

// Define the PaymentSession types
interface PaymentSessionResponse {
  id: string;
  payment_session_secret: string;
  payment_session_token: string;
  _links: {
    self: {
      href: string;
    };
  };
}

interface PaymentResponse {
  id: string;
  status: string;
  // Add other properties as needed
}

interface CheckoutFlowProps {
  cart: HttpTypes.StoreCart,
  ckoSession: any,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>; 
  onPaymentComplete?: (paymentResponse: PaymentResponse) => void;
}

interface Cart {
  total: number;
  currency_code: string;
  payment_collection?: {
    id: string;
  };
}
// Declare the global CheckoutWebComponents type
declare global {
  interface Window {
    CheckoutWebComponents: (config: any) => Promise<{
      create: (type: string) => {
        mount: (elementOrSelector: string | HTMLElement) => void;
      };
    }>;
  }
}

const CheckoutFlow: React.FC<CheckoutFlowProps> = ({
  cart,
  ckoSession,
  onPaymentComplete,
  setIsLoading
}) => {
  const [error, setError] = useState<string | null>(null);
  const flowContainerRef = useRef<HTMLDivElement>(null);


  // Initialize and mount Checkout Flow when payment session is available
  useEffect(() => {
    if (!ckoSession || !flowContainerRef.current) return;

    const initializeCheckout = async () => {
      try {
        // Load the Checkout Web Components script if it hasn't been loaded yet
        if (!window.CheckoutWebComponents) {
          const script = document.createElement('script');
          script.src = 'https://checkout-web-components.checkout.com/index.js';
          script.async = true;
          document.body.appendChild(script);
          script.onerror = () => {
            setError('Failed to load Checkout.com script');
            console.error('Script load error for Checkout Web Components');
            setIsLoading(false)
          };
          await new Promise((resolve) => {
            script.onload = resolve;
          });
        }

        // Initialize Checkout Web Components
        const checkout = await window.CheckoutWebComponents({
          paymentSession: ckoSession,
          publicKey: process.env.NEXT_PUBLIC_CHECKOUT_PUBLIC_KEY,
          environment: "sandbox", // or "production"
          appearance: {
            colorPrimary: '#1c1c1c',
            colorAction: '#1c1c1c',
            button: {
              fontFamily: '"Roboto Mono", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: 0,
              lineHeight: '24px',
            },
            footnote: {
              fontFamily: '"PT Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif',
              fontSize: '14px',
              fontWeight: 400,
              letterSpacing: 0,
              lineHeight: '20px',
            },
            label: {
              fontFamily: '"Roboto Mono", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif',
              fontSize: '14px',
              fontWeight: 400,
              letterSpacing: 0,
              lineHeight: '20px',
            },
            subheading: {
              fontFamily: '"Roboto Mono", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: 0,
              lineHeight: '24px',
            },
            borderRadius: ['8px', '8px'],
          },
          onReady: () => {
            console.log("on Ready");
            
            setIsLoading(false)
          },
          onPaymentCompleted: async(_self: any, paymentResponse: PaymentResponse) => {
            console.log('Payment completed:', paymentResponse);
            if (onPaymentComplete) {
             //TODO: Add callbacks
            }
          }
        });

        const flowComponent = checkout.create('flow');
        if (flowContainerRef?.current) {
          flowComponent.mount(flowContainerRef.current);
        }
      } catch (err) {
        setIsLoading(false)
        setError('Failed to initialize checkout');
        console.error('Error initializing checkout:', err);
      }
    };

    initializeCheckout();
  }, [ckoSession, onPaymentComplete]);


  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="checkout-flow-container">
      <div id="flow-container" ref={flowContainerRef}></div>
    </div>
  );
};

export default CheckoutFlow;

```

`publicKey` - you can retrieve it from your Checkout.com Developer Dashboard.

## Limitations

Plugin does not support refunds and cancels. It has been tested using only credit card - when authorized, it captures money automatically.

## License

MIT

---
