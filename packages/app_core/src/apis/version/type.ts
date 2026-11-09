import { VersionDiffItemType, VersionAllItemType, VersionQueryTypeType } from "@serverSchema/router/version"

export type VersionInfoItemRequest = { type: VersionQueryTypeType }

export type VersionDiffItem = VersionDiffItemType

export type VersionAllItem = VersionAllItemType

export type VersionList = Array<VersionDiffItem> | Array<VersionAllItem>

export type VersionInfoItemResponse = {
  version_list: VersionList
}
