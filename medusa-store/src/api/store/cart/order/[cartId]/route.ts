import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const cartId = req.params.cartId
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: orderCart } = await query.graph({
      entity: "order_cart",
      fields: ["id", "order_id"],
      filters: {
        cart_id: {
          $eq: cartId,
        },
      },

    })
    try {
      const orderModuleService = req.scope.resolve("order");
      const order = await orderModuleService.retrieveOrder(orderCart[0].order_id, {
        relations: ["shipping_methods", "shipping_address", "billing_address"],
      })

      res.json(order);

    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Oder cart found but order not found",
      )
    }

  } catch (error) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Oder cart not found",
    )
  }
}
