import { placeOrderV2, retrieveCart, retrieveOrderByCart } from "@lib/data/cart"
import { getCacheTag, removeCartId } from "@lib/data/cookies"
import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("cko-session-id")
  const cartId = req.nextUrl.searchParams.get("cart_id") ?? ""

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session ID" }, { status: 400 })
  }

  let cart = await retrieveCart(cartId)
  let attempts = 0
  const maxAttempts = 5

  while (
    attempts < maxAttempts &&
    cart?.payment_collection?.status !== "authorized" &&
    cart?.payment_collection?.status !== "completed"
  ) {
    await delay(3000) // 3 second delay between retries
    console.log("\n\n attempts", attempts, cart?.payment_collection?.status,"\n\n");
    cart = await retrieveCart(cartId)
    attempts++
  }

  if (
    cart?.payment_collection?.status === "authorized" ||
    cart?.payment_collection?.status === "completed"
  ) {
    console.log("\n\ncart", cart?.payment_collection?.status === "authorized", "\n\n");

    const response = await retrieveOrderByCart(cartId).catch((err) => {
      console.log(err.message)
    })

    if (response) {
      const countryCode =
        response.shipping_address?.country_code?.toLowerCase()

      const orderCacheTag = await getCacheTag("orders")
      revalidateTag(orderCacheTag)

      removeCartId()

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/${countryCode}/order/${response?.id}/confirmed`
      )
    } else {

      return NextResponse.json(
        { error: "Payment not authorized or completed" },
        { status: 400 }
      )
    }
  }
  console.log("error", "error", "ssss");

  return NextResponse.redirect(
    process.env.NEXT_PUBLIC_BASE_URL + "/checkout?step=payment"
  )
  
}
