import { storeToRefs } from "pinia"
import { toast } from "vue-sonner"
import z from "zod"

import { hasFileSaver, saveFiles } from "@app/core/adapters/fileSaver"
import momo from "@app/core/apis"
import useDevice from "@app/core/hooks/useDevice"
import { useWallpaperStore } from "@app/core/stores/useWallpaperStore"
import { errorMsg } from "@app/core/utils/system"

/** 图片下载相关的hook */
export default function () {
  const wallpaperStore = useWallpaperStore()
  const { searchResult } = storeToRefs(wallpaperStore)
  const { isWeb } = useDevice()

  //本地代理服务器地址数组
  const localhostArr = ["http://localhost:3000", "http://localhost:1999"]
  const isOpenProxy = ref(false)
  const localhost = ref("")
  // 端口检查状态
  const isChecking = ref(false)
  const { isDownloading } = storeToRefs(wallpaperStore)

  const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
    event.preventDefault()
    // 兼容旧版 Chrome/Edge 的遗留写法
    event.returnValue = ""
  }

  let beforeUnloadRegistered = false
  const setDownloadUnloadProtection = (active: boolean) => {
    if (!active && beforeUnloadRegistered) {
      window.removeEventListener("beforeunload", beforeUnloadHandler)
      beforeUnloadRegistered = false
    } else if (active && !beforeUnloadRegistered && isWeb.value) {
      window.addEventListener("beforeunload", beforeUnloadHandler)
      beforeUnloadRegistered = true
    }
  }

  // 检查本地代理服务器是否打开
  const checkAllPort = async () => {
    // 防止重复点击
    if (isChecking.value) return
    isChecking.value = true

    try {
      // 并发检查所有端口，返回(string | undefined)[] 数组
      const results = await Promise.all(localhostArr.map((url) => checkPort(url)))

      const validUrl = results.find((url): url is string => Boolean(url))

      if (validUrl) {
        // 找到了有效端口
        isOpenProxy.value = true
        localhost.value = validUrl
        toast.success("本地代理服务器已开启，感谢您的耐心合作")
      } else {
        // 所有端口都不可用
        isOpenProxy.value = false
        localhost.value = ""
        toast.error("本地代理服务器未正确运行，请检查错误原因")
      }
    } catch (error) {
      isOpenProxy.value = false
      localhost.value = ""
      errorMsg("检查代理服务时发生未知错误")
    } finally {
      isChecking.value = false
    }
  }

  // 检查单个端口
  const checkPort = async (url: string): Promise<string | undefined> => {
    try {
      const result = await momo.get(url)
      console.log("result", result)

      // 假设你的 momo.get 没抛错但返回了非200，这里也能拦截
      if (result?.code === 200) {
        return url
      }
      return undefined
    } catch (e) {
      console.warn(e, "本地代理服务器端口检查发生错误")
      return undefined
    }
  }

  // 原链接不可用时，使用本地代理或云存储
  const resolveImageUrl = (url: string, imgPath?: string) => {
    if (isOpenProxy.value && url) {
      return url.replace("https://gamecms-res.sl916.com", localhost.value + "/download1999")
    }
    const qiniuUrl = import.meta.env.VITE_OSS_URL
    if (imgPath && qiniuUrl) {
      return `${qiniuUrl}/${imgPath}`
    }
    return url || ""
  }

  /** 批量下载的弹窗示例 */
  const startDownload = () => {
    let current = 0
    const total = 5

    // 1. 创建初始 Toast，设置 duration: Infinity 防止自动消失
    const toastId = toast.loading(`下载进度：${current}/${total}`, {
      duration: Infinity,
    })

    // 2. 设置定时器，每秒更新一次
    const interval = setInterval(() => {
      current += 1

      // 3. 调用 toast 并传入相同的 id，原地更新文本
      toast.loading(`下载进度：${current}/${total}`, {
        id: toastId,
        duration: Infinity,
      })

      // 4. 进度完成后清理定时器并关闭 Toast
      if (current >= total) {
        clearInterval(interval)

        toast.success("下载完成", { id: toastId })
        // 延迟关闭
        setTimeout(() => toast.dismiss(toastId), 2000)
      }
    }, 1000)
  }

  /**下载单张图片*/
  const downloadImg = async (url: string, imgName: string, imgPath?: string) => {
    if (isWeb.value) {
      url = resolveImageUrl(url, imgPath)
      if (!url) {
        toast.error("下载图片出错，本地代理和云存储均不可用")
        return
      }
    }
    console.log("下载：", url)
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const src = URL.createObjectURL(blob)
      const linkA = document.createElement("a")
      linkA.href = src
      linkA.download = imgName // 在这里指定下载的文件名
      document.body.appendChild(linkA)
      linkA.click()
      linkA.remove()

      setTimeout(() => URL.revokeObjectURL(src), 1000)
    } catch (error) {
      errorMsg(error, "下载图片出错")
    }
  }

  // 自定义的下载逻辑
  const customDownload = async (files: { url: string; name: string; path?: string }[]) => {
    if (!files.length) {
      toast.warning("未取得下载列表")
      return
    }
    if (isDownloading.value) {
      toast.info("下载中，请稍后...")
      return
    }

    isDownloading.value = true
    setDownloadUnloadProtection(true)
    const toastId = toast.loading(`下载进度：0/${files.length}`, { duration: Infinity })

    try {
      // web端或无文件保存功能
      if (isWeb.value || !hasFileSaver()) {
        await checkAllPort()
        let completed = 0
        for (const file of files) {
          await downloadImg(file.url, file.name, file.path)
          completed += 1
          toast.loading(`下载进度：${completed}/${files.length}`, { id: toastId, duration: Infinity })
        }
        toast.success(`已开始下载 ${files.length} 个文件`, { id: toastId })
        setTimeout(() => toast.dismiss(toastId), 2000)
        return
      }

      const items = files.flatMap(({ name, url }) => {
        const { success, data } = z.httpUrl().safeParse(url)
        return success ? [{ url: data, fileName: name ?? "download" }] : []
      })

      if (!items.length) {
        toast.error("无可下载文件", { id: toastId })
        return
      }

      const unavailableCount = files.length - items.length
      if (unavailableCount) toast.error(`${unavailableCount} 个文件缺少可用下载地址`)

      const results = await saveFiles(items, (progress) => {
        toast.loading(`下载进度：${progress.completed}/${progress.total}`, { id: toastId, duration: Infinity })
      })
      const savedCount = results.filter((result) => result.path).length
      const cancelled = results.some((result) => result.cancelled)
      const errors = results.filter((result) => result.error)

      if (cancelled) toast.info("已取消保存", { id: toastId })
      else if (errors.length) toast.error(`${savedCount} 个文件已保存，${errors.length} 个失败`, { id: toastId })
      else toast.success(`已保存 ${savedCount} 个文件`, { id: toastId })
      setTimeout(() => toast.dismiss(toastId), 2000)
    } catch (error) {
      errorMsg(error, "保存文件失败")
      toast.error("保存文件失败", { id: toastId })
    } finally {
      isDownloading.value = false
      setDownloadUnloadProtection(false)
    }
  }

  /**拦截LightGallery的默认下载逻辑 */
  const handleDownloadClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    const button = target.closest(".lg-download")

    if (!button) return

    // 阻止 LightGallery 默认下载行为
    event.preventDefault()
    event.stopImmediatePropagation()

    const image = document.querySelector<HTMLImageElement>(".lg-current .lg-image")

    // 先直接查询搜索结果
    const dataIndex = Number(image?.dataset?.index)
    const index = typeof dataIndex === "number" && !isNaN(dataIndex) ? dataIndex : undefined

    if (typeof index === "number") {
      const info = searchResult.value[index]

      if (info) {
        customDownload([
          {
            name: info.name,
            url: info.img_url,
            path: info.img_path,
          },
        ])
        return
      }
    }

    // 没有结果再根据图片的src查询
    if (image?.src) {
      customDownload([
        {
          name: image.alt ?? "",
          url: image.src,
          path: "",
        },
      ])
    }
  }

  return { isChecking, isDownloading, customDownload, downloadImg, handleDownloadClick }
}
