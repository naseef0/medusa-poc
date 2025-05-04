import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { SearchSchema } from "./store/products/search/route"
import { PostAdminCreateBrand } from "./admin/brands/validators"
import { z } from "zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
export const GetBrandsSchema = createFindParams()

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/products/search",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(SearchSchema),
      ],
    },
    {
      matcher: "/admin/brands",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateBrand),
      ],
    },
    {
      matcher: "/admin/products",
      method: ["POST"],
      additionalDataValidator: {
        brand_id: z.string().optional(),
      },
    },
    {
      matcher: "/admin/brands",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(
          GetBrandsSchema,
          {
            defaults: [
              "id",
              "name",
              "products.*",
            ],
            isList: true,
          }
        ),
      ],
    },

  ],
})