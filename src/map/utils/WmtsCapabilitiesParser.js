/*
 * @Description: 解析 WMTS GetCapabilities XML，提取 layer、style、format、tileMatrixSetID、tileMatrixLabels 等供 Cesium 使用
 */

const WMTS_NS = 'http://www.opengis.net/wmts/1.0'
const OWS_NS = 'http://www.opengis.net/ows/1.1'

/**
 * 从节点下取第一个子元素的文本（支持带命名空间的本地名）
 * @param {Element} parent
 * @param {string} localName
 * @param {string} [ns=WMTS_NS]
 * @returns {string|null}
 */
function getFirstText(parent, localName, ns = WMTS_NS) {
  const list = parent.getElementsByTagNameNS(ns, localName)
  if (!list.length) return null
  const text = list[0].textContent
  return text ? text.trim() : null
}

/**
 * 解析 WMTS GetCapabilities XML 字符串
 * @param {string} xmlString - GetCapabilities 响应的 XML 字符串
 * @returns {{ layer: string, style: string, format: string, tileMatrixSetID: string, tileMatrixLabels: string[], tileWidth?: number, tileHeight?: number }}
 * @throws {Error} 当 XML 无效或必需节点缺失时
 */
export function parseWmtsCapabilities(xmlString) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'text/xml')
  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    throw new Error(`WMTS GetCapabilities XML 解析失败: ${parseError.textContent}`)
  }

  const contents = doc.getElementsByTagNameNS(WMTS_NS, 'Contents')[0]
  if (!contents) {
    throw new Error('GetCapabilities 中未找到 Contents')
  }

  const layers = contents.getElementsByTagNameNS(WMTS_NS, 'Layer')
  if (!layers.length) {
    throw new Error('GetCapabilities 中未找到 Layer')
  }
  const layerEl = layers[0]

  const layer = getFirstText(layerEl, 'Identifier', OWS_NS)
  if (!layer) {
    throw new Error('Layer 中未找到 ows:Identifier')
  }

  const styleEl = layerEl.getElementsByTagNameNS(WMTS_NS, 'Style')[0]
  const style = styleEl ? getFirstText(styleEl, 'Identifier', OWS_NS) : null
  if (!style) {
    throw new Error('Layer 中未找到 Style/ows:Identifier')
  }

  const formatEl = layerEl.getElementsByTagNameNS(WMTS_NS, 'Format')[0]
  const format = formatEl ? (formatEl.textContent || '').trim() : null
  if (!format) {
    throw new Error('Layer 中未找到 Format')
  }

  const linkEl = layerEl.getElementsByTagNameNS(WMTS_NS, 'TileMatrixSetLink')[0]
  if (!linkEl) {
    throw new Error('Layer 中未找到 TileMatrixSetLink')
  }
  const tileMatrixSetEl = linkEl.getElementsByTagNameNS(WMTS_NS, 'TileMatrixSet')[0]
  const tileMatrixSetID = tileMatrixSetEl ? (tileMatrixSetEl.textContent || '').trim() : null
  if (!tileMatrixSetID) {
    throw new Error('TileMatrixSetLink 中未找到 TileMatrixSet')
  }

  const tileMatrixSets = contents.getElementsByTagNameNS(WMTS_NS, 'TileMatrixSet')
  let targetTms = null
  for (let i = 0; i < tileMatrixSets.length; i++) {
    const id = getFirstText(tileMatrixSets[i], 'Identifier', OWS_NS)
    if (id === tileMatrixSetID) {
      targetTms = tileMatrixSets[i]
      break
    }
  }
  if (!targetTms) {
    throw new Error(`未找到 TileMatrixSet: ${tileMatrixSetID}`)
  }

  const tileMatrices = targetTms.getElementsByTagNameNS(WMTS_NS, 'TileMatrix')
  const parsedLabels = []
  let tileWidth = null
  let tileHeight = null
  for (let i = 0; i < tileMatrices.length; i++) {
    const id = getFirstText(tileMatrices[i], 'Identifier', OWS_NS)
    if (id) parsedLabels.push(id)
    if (tileWidth == null || tileHeight == null) {
      const w = getFirstText(tileMatrices[i], 'TileWidth', WMTS_NS)
      const h = getFirstText(tileMatrices[i], 'TileHeight', WMTS_NS)
      if (w) tileWidth = parseInt(w, 10)
      if (h) tileHeight = parseInt(h, 10)
    }
  }

  // 基于首级 TileMatrix 的 MatrixWidth 计算 minimumLevel，使 tileMatrixLabels 与 Cesium level 对齐
  const firstMatrixWidth = tileMatrices.length
    ? (parseInt(getFirstText(tileMatrices[0], 'MatrixWidth', WMTS_NS), 10) || 2)
    : 2
  /**
   * The minimum level-of-detail supported by the imagery provider.
   *
   * 如 minimumLevel = 1：
   * Cesium 的影像层不会请求 level 0 的瓦片，
   * 因此 transformedLabels[0] 在实际运行中不会被用到。
   */
  const minimumLevel = Math.max(0, Math.round(Math.log2(firstMatrixWidth)))
  /**
   * 举例：天地图-影像底图-球面墨卡托投影
   * https://t0.tianditu.gov.cn/img_w/wmts?request=GetCapabilities&service=wmts
   *
   * 这里的 transformedLabels[0] = "1" 只是占位，目的是：
   * - 保证 labels[level] 在访问 labels[0] 时不会越界
   * - 在 minimumLevel = 1 的前提下，这个值不会被实际请求
   */
  const transformedLabels = new Array(minimumLevel + parsedLabels.length)
  for (let i = 0; i < minimumLevel; i++) transformedLabels[i] = parsedLabels[0]
  for (let i = 0; i < parsedLabels.length; i++) transformedLabels[minimumLevel + i] = parsedLabels[i]
  const maximumLevel = minimumLevel + parsedLabels.length - 1

  const result = {
    layer,
    style,
    format,
    tileMatrixSetID,
    tileMatrixLabels: transformedLabels,
    minimumLevel,
    maximumLevel
  }
  if (tileWidth != null && !Number.isNaN(tileWidth)) result.tileWidth = tileWidth
  if (tileHeight != null && !Number.isNaN(tileHeight)) result.tileHeight = tileHeight
  return result
}

/**
 * 请求 WMTS GetCapabilities URL 并解析
 * @param {string} capabilitiesUrl - 元数据地址，如 https://t0.tianditu.gov.cn/img_w/wmts?request=GetCapabilities&service=wmts
 * @returns {Promise<ReturnType<parseWmtsCapabilities>>}
 */
export function fetchAndParseWmtsCapabilities(capabilitiesUrl) {
  return fetch(capabilitiesUrl)
    .then(res => {
      if (!res.ok) {
        throw new Error(`获取 WMTS 元数据失败: ${res.status} ${res.statusText}`)
      }
      return res.text()
    })
    .then(xmlString => parseWmtsCapabilities(xmlString))
}
