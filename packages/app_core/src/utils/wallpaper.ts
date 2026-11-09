/**
 * 拼接以影像之图片的缩略图地址
 * @param path 以影像之图片名称
 */
export const formatWallpaperPreviewSrc = (path: string) => {
  const fileName = path.split("/").pop() ?? path
  return import.meta.env.VITE_OSS_1999_PREVIEW_URL + "/" + fileName.replace(/\.(jpe?g|png)$/i, ".webp")
}
