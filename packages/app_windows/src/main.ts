import App from "@app/core/App.vue"
import pinia from "@app/core/stores"
import { createPlugin } from "@tauri-store/pinia"
import { MotionPlugin } from "@vueuse/motion"
import { createApp } from "vue"

import { bootstrap } from "@/adapters"
import router from "@/router"

import "@app/core/assets/css/main.css"
import "@app/core/assets/css/style.css"
import "@app/core/assets/css/app.css"
import "@app/core/assets/css/animation.css"
import "@/assets/css/animation.css"
import "@/assets/css/main.css"
import "@/assets/css/style.css"
import "vue-sonner/style.css"

bootstrap()

const app = createApp(App)

// 持久化到本地
pinia.use(createPlugin())

app.use(pinia).use(router).use(MotionPlugin).mount("#app")
