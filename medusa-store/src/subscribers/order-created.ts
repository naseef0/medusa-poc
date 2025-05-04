import type {
    SubscriberArgs,
    SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function orderCreateHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const notificationModuleService = container.resolve(Modules.NOTIFICATION)
    const orderModuleService = container.resolve(Modules.ORDER)

    const order = await orderModuleService.retrieveOrder(data.id)

    await notificationModuleService.createNotifications({
        to: order.email??"",
        channel: "email",
        template: "d-6321ba71fae44278b27fda47011a5641",
        data: {
            ...order,
            created_at: new Date(order.created_at).toLocaleDateString(),
        },
    })
}

export const config: SubscriberConfig = {
    event: "order.placed",
}