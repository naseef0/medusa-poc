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