// 供web端vite-plugin-font字体切分工具使用，app端直接打包全量的woff2字体
// @ts-nocheck
import { css as ClaireMurphy } from "@app/core/assets/fonts/claire-murphy.otf"
import { css as KudryWeirdHeadline } from "@app/core/assets/fonts/kudry_weird-headline.otf"
// import { css as MaShanZheng } from "@app/core/assets/fonts/MaShanZheng-Regular.ttf"
import { css as NotoSans } from "@app/core/assets/fonts/NotoSansSC-VariableFont_wght.ttf"
import { css as SourceHan } from "@app/core/assets/fonts/SourceHanSansSC-VF.otf"

export {
  /** "Source Han Sans SC VF",字重可变250-900 */
  SourceHan,
  /** "Kudry Weird Headline",字重400 */
  KudryWeirdHeadline,
  /** "Claire Murphy DEMO",字重400 */
  ClaireMurphy,
  /** "Noto Sans SC Thin",字重可变100-900 */
  NotoSans,
  /** "Ma Shan Zheng",字重400 */
  // MaShanZheng,
}
