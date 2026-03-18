/**
 * URL 解析工具，用于从 URL 提取图层名称等
 * 供 GeoJSON、KML 等加载对话框共用
 */

/**
 * 判定 URL 是否为 WFS 服务
 * 依据 OGC WFS 1.0/2.0 规范，service=WFS 为必选参数
 * @param {string} url
 * @returns {boolean}
 */
export function isWfsUrl(url) {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (!trimmed) return false
  try {
    const urlObj = new URL(trimmed)
    const service = urlObj.searchParams.get('service')
    return service?.toUpperCase() === 'WFS'
  } catch {
    return false
  }
}

/**
 * 从 URL 解析默认图层名称
 * - 若为 WFS URL：从 query 提取 typeName/typename
 * - 否则：从 path 末尾段去掉扩展名
 * @param {string} url
 * @returns {string|null}
 */
export function parseLayerNameFromUrl(url) {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null
  try {
    const urlObj = new URL(trimmed)

    if (urlObj.searchParams.get('service')?.toUpperCase() === 'WFS') {
      const typeName =
        urlObj.searchParams.get('typeName') || urlObj.searchParams.get('typename')
      if (typeName && typeName.trim()) {
        return typeName.trim().replace(/:/g, '_')
      }
    }

    const pathname = urlObj.pathname
    const pathWithoutQuery = pathname.split('?')[0].split('#')[0]
    const segments = pathWithoutQuery.split('/').filter(Boolean)
    const lastSegment = segments[segments.length - 1]
    if (!lastSegment) return null
    return lastSegment.replace(/\.[^/.]+$/, '') || lastSegment
  } catch {
    return null
  }
}
