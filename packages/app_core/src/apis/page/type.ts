import { RoleList } from "@app/core/apis/role/type"
import { VersionList } from "@app/core/apis/version/type"

export type DownloadHomeResponse = {
  panel_info: {
    wallpaper_count: number
    version_count: number
    role_count: number
  }
  role_list: RoleList
  version_list: VersionList
}
