import momo from "@app/core/apis"
import { Page } from "@app/core/apis/path"

import { DownloadHomeResponse } from "./type"

/**获取下载器首页初始化数据 */
const api_download_home_info = async () => momo.get<DownloadHomeResponse>(Page.download)

export { api_download_home_info }
