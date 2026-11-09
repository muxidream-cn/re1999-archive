import { createAppRouter } from "@app/core/router"

/** 本端路由实例：路由表与守卫由 app_core 统一维护，此处只保留跨端差异（如 history 模式） */
const router = createAppRouter()

export default router
