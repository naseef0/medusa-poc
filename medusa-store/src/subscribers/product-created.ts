import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function productCreateHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)
  const productModuleService = container.resolve(Modules.PRODUCT)

  const product = await productModuleService.retrieveProduct(data.id)
console.log("product", product);

  await notificationModuleService.createNotifications({
    to: "naseefro2@gmail.com",
    channel: "email",
    template: "d-6321ba71fae44278b27fda47011a5641",
    data: {
      product_title: product.title,
      product_image: product.thumbnail,
    },
  })
}

export const config: SubscriberConfig = {
  event: "product.created",
}