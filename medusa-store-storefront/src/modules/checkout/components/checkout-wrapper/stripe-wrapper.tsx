"use client"

import { Elements } from "@stripe/react-stripe-js"
import { HttpTypes } from "@medusajs/types"
import { createContext, useContext, useState } from "react"

export interface CheckoutState {
  handleCheckoutSession: (session: any) => void,
  state:  {
    session: any
  }
}
type CheckoutWrapperProps = {
  children: React.ReactNode
}

export const CheckoutContext = createContext({} as CheckoutState)

// Create a custom hook to use the context.
export function useCheckoutContext() {
  return useContext(CheckoutContext) ?? {};
}

const CheckoutWrapper: React.FC<CheckoutWrapperProps> = ({
  children,
}) => {
  const [state, setState] = useState<any>({
    session: null,
  })

  const handleCheckoutSession = async (session: any) => {
    setState({ ...state, session })
  }

  return (
    <CheckoutContext.Provider value={{ state, handleCheckoutSession, }}>
      {children}
    </CheckoutContext.Provider>
  )
}

export default CheckoutWrapper
