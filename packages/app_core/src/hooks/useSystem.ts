import { WallpaperRandomQueryEnum, WallpaperSortEnum } from "@serverSchema/router/wallpaper"
import { toast } from "vue-sonner"

import { api_app_version_latest } from "@app/core/apis/app"
import { api_get_random_wallpaper } from "@app/core/apis/wallpaper"
import useDevice from "@app/core/hooks/useDevice"
import useSettings from "@app/core/hooks/useSettings"

/**
 * 背景写入的模块级协调状态（所有 useSystem() 实例共享）：
 * - bgToken：每次开始一次背景操作或清除背景时自增，让在途的异步操作失效
 * - appliedUrl：最后一次真正写进 DOM 的 URL，用于跳过对同一张图的重复预加载
 */
let bgToken = 0
let appliedUrl: string | null = null

/** 使在途背景操作失效，并清掉「已应用到 DOM」的标记（切深色时重新还原要靠它） */
const invalidateBG = () => {
  bgToken += 1
  appliedUrl = null
}

/**
 * 背景容器：优先使用传入的 Ref，否则回退到 #app-container
 * @param El 需要被修改的元素 Ref；未传入时修改 #app-container
 */
const getBGElement = (El?: Ref<HTMLDivElement | null>) => El?.value ?? document.getElementById("app-container")

/** 以 <html> 的 dark class 为准，与 sidebar 解析出的深浅色保持单一真值来源 */
const isLight = () => !document.documentElement.classList.contains("dark")

/**
 * 预加载图片；先绑事件再赋 src，避免缓存命中时漏掉回调
 * @param url 待校验的图片地址
 */
const preloadImage = (url: string) =>
  new Promise<boolean>((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = encodeURI(url)
  })

/**
 * 把 URL 写进容器，#app-container::before 通过 background-image: inherit 同步显示
 * @param url 已加载成功的背景图地址
 * @param El 需要被修改的元素 Ref；未传入时修改 #app-container
 */
const paintBG = (url: string, El?: Ref<HTMLDivElement | null>) => {
  const el = getBGElement(El)
  if (!el) return false
  el.style.backgroundImage = `url('${url}')`
  return true
}

/** 系统程序相关的hook */
export default function () {
  const getRandomWallpaperList = async () => {
    const res = await api_get_random_wallpaper({
      type: WallpaperRandomQueryEnum.url,
      sort: useDevice().isDesktop.value ? WallpaperSortEnum.pc : WallpaperSortEnum.phone,
      limit: 1,
    })
    const { code, msg, data } = res
    if (code !== 200) throw new Error(msg)
    if (data?.url_list?.length) return data.url_list
    throw new Error("未找到符合条件的壁纸")
  }

  /**
   * 切换壁纸：随机取一张，成功后写入设置项持久化并应用到当前页面
   * @param withToast 是否显示toast
   * @param El 需要被修改的元素Ref
   * - 未传入时修改 #app-container
   * @returns 实际设置的 URL；被后续操作取消时返回 null
   */
  const changeBG = async (withToast = false, El?: Ref<HTMLDivElement | null>) => {
    const fun = async (): Promise<string | null> => {
      const token = ++bgToken
      const data = await getRandomWallpaperList()
      const url = data[0]

      if (!(await preloadImage(url))) throw new Error("图片加载失败，请检查网络或跨域设置")
      // 加载期间若已切深色 / 清除背景 / 发起了新请求，本次结果作废
      if (token !== bgToken) return null

      // immediate watch 在 setup 阶段触发时 #app-container 可能尚未插入文档
      await nextTick()
      if (token !== bgToken) return null

      // 深色态只保存设置不写 DOM，等切浅色时由 restoreBG 应用；
      // 只有真正写进 DOM 才标记 appliedUrl，避免之后的还原被误判为「已应用」
      if (isLight() && paintBG(url, El)) appliedUrl = url
      useSettings().setValue("general.backgroundImage", url)
      return url
    }

    if (withToast)
      return toast.promise<string | null>(fun(), {
        loading: "Loading...",
        success: (url: string | null) => (url ? "背景切换成功" : "背景切换已取消"),
        error: (err: Error) => {
          return err instanceof Error ? err.message : "背景切换失败，请重试"
        },
      })
    else return fun()
  }

  /**
   * 还原已持久化的背景图：不请求随机接口，预加载校验后写回 DOM。
   * URL 失效（链接过期等）时把 store 置回 null，由 watcher 自动回退到一次随机获取。
   * @param url 已持久化的背景图 URL
   * @param El 需要被修改的元素Ref
   */
  const restoreBG = async (url: string, El?: Ref<HTMLDivElement | null>) => {
    // 同一张图已经应用在 DOM 上（例如 changeBG 刚写完 store 触发的 watcher），无需重复预加载；
    // 但 DOM 被重建 / immediate 阶段元素尚不存在时仍要重新应用
    if (appliedUrl === url && getBGElement(El)?.style.backgroundImage) return
    const token = ++bgToken

    if (!(await preloadImage(url))) {
      if (token !== bgToken) return
      console.warn("背景图加载失败，已回退到随机壁纸")
      const settings = useSettings()
      // 期间用户可能已清除或换图，只回退仍指向这张失效 URL 的状态
      if (settings.getValue("general.backgroundImage") === url) settings.setValue("general.backgroundImage", null)
      return
    }
    if (token !== bgToken) return

    await nextTick()
    if (token !== bgToken || !isLight()) return
    if (paintBG(url, El)) appliedUrl = url
  }

  /**
   * 移除壁纸（只清 DOM，不改 store，切深色时保留已设背景）
   * @param El 需要被修改的元素Ref
   * - 未传入时修改 #app-container
   */
  const removeBG = (El?: Ref<HTMLDivElement | null>) => {
    // 让在途的 random / restore 结果失效，避免深色态被回写背景
    invalidateBG()
    const el = getBGElement(El)

    if (el) {
      el.style.backgroundImage = ""
      el.style.backgroundColor = "var(--background)"
    }
  }

  /**
   * 清除背景图：持久化「已清除」状态（""），切浅色 / 重启都不再自动设置背景，
   * 直到再次点击「切换背景图」。
   * @param El 需要被修改的元素Ref
   */
  const clearBG = (El?: Ref<HTMLDivElement | null>) => {
    useSettings().setValue("general.backgroundImage", "")
    removeBG(El)
    toast.success("已清除背景图")
  }

  /** 获取最新的多个平台版本信息 */
  const getLatestVersion = async () => {
    const res = await api_app_version_latest()
    if (res.code !== 200 || !res.data) throw new Error(res.msg)
    return res.data
  }

  return { getRandomWallpaperList, changeBG, restoreBG, removeBG, clearBG, getLatestVersion }
}
