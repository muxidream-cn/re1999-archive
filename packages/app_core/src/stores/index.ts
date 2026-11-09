// pinia 的公共入口文件
import { createPinia } from "pinia"
import piniaPluginPersistedstate from "pinia-plugin-persistedstate"
const pinia = createPinia()

// 持久化到浏览器的 localStore/sessionStore  @see:https://prazdevs.github.io/pinia-plugin-persistedstate/zh/guide/config.html
pinia.use(piniaPluginPersistedstate)

export default pinia
