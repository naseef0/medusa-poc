import { initiatePaymentSession } from '@lib/data/cart';
import React, { useEffect, useState, useRef } from 'react';
import { useCheckoutContext } from '../checkout-wrapper/stripe-wrapper';

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
  cart: any,
  onPaymentComplete?: (paymentResponse: PaymentResponse) => void;
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
  onPaymentComplete
}) => {
  const [error, setError] = useState<string | null>(null);
  const flowContainerRef = useRef<HTMLDivElement>(null);
  const {state:{session}} =useCheckoutContext()
console.log("session", session);

const handleCkoPaymentSubmit = async (data: any) => {
  await initiatePaymentSession(cart, {
   provider_id: "pp_checkout-com_checkout-com",
   data: {
     id: data?.id,
     payment_collection_id: cart?.payment_collection?.id,
     amount: cart.total,
     currency_code: cart.currency_code,
     paymentSession: session
   }
 })
}

  // Initialize and mount Checkout Flow when payment session is available
  useEffect(() => {
    if (!session || !flowContainerRef.current) return;

    const initializeCheckout = async () => {
      try {
        // Load the Checkout Web Components script if it hasn't been loaded yet
        if (!window.CheckoutWebComponents) {
          const script = document.createElement('script');
          script.src = 'https://checkout-web-components.checkout.com/index.js';
          script.async = true;
          document.body.appendChild(script);

          await new Promise((resolve) => {
            script.onload = resolve;
          });
        }

        // Initialize Checkout Web Components
        const checkout = await window.CheckoutWebComponents({
          paymentSession:session,
          publicKey: process.env.NEXT_PUBLIC_CHECKOUT_PUBLIC_KEY,
          environment:"sandbox", // or "production"
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
          onPaymentCompleted: async(_self: any, paymentResponse: PaymentResponse) => {
            console.log('Payment completed:', paymentResponse);
            if (onPaymentComplete) {
            await   handleCkoPaymentSubmit(paymentResponse);
            }
          }
        });

        const flowComponent = checkout.create('flow');
        if (flowContainerRef?.current) {
          flowComponent.mount(flowContainerRef.current);
        }
      } catch (err) {
        setError('Failed to initialize checkout');
        console.error('Error initializing checkout:', err);
      }
    };

    initializeCheckout();
  }, [session, onPaymentComplete]);


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