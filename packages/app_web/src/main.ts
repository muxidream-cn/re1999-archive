import App from "@app/core/App.vue"
import pinia from "@app/core/stores"
import { MotionPlugin } from "@vueuse/motion"
import { createApp } from "vue"

import { bootstrap } from "@/adapters"
import router from "@/router"

import "@app/core/assets/css/main.css"
import "@app/core/assets/css/style.css"
import "@app/core/assets/css/animation.css"
import "@app/core/utils/fonts"
import "@/assets/css/animation.css"
import "@/assets/css/main.css"
import "@/assets/css/style.css"
import "vue-sonner/style.css"

bootstrap()

const app = createApp(App)

app.use(pinia).use(router).use(MotionPlugin).mount("#app")
