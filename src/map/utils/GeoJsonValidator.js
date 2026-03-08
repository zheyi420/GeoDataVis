import geojsonhint from '@mapbox/geojsonhint'

/**
 * 读取文件为文本
 * @param {File} file
 * @returns {Promise<string>}
 */
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('读取文件失败'))
    reader.readAsText(file)
  })
}

/**
 * 解析并校验 GeoJSON（RFC 7946）
 * @param {File} file
 * @returns {Promise<Object>}
 */
export async function parseAndValidate(file) {
  if (!file) {
    throw new Error('未选择文件')
  }

  const text = await readFileAsText(file)
  const errors = geojsonhint.hint(text) || []
  const fatalErrors = errors.filter(err => err.level !== 'message')

  if (fatalErrors.length > 0) {
    const detail = fatalErrors
      .map(err => {
        const line = err.line ? `L${err.line}` : 'L?'
        return `${line}: ${err.message || 'GeoJSON 格式错误'}`
      })
      .join('\n')
    throw new Error(`GeoJSON 校验失败:\n${detail}`)
  }

  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`GeoJSON 解析失败: ${error.message}`)
  }
}

/**
 * 分析 GeoJSON 中要素是否包含高程坐标
 * @param {Object} geoJson
 * @returns {{features2D: Object[], features3D: Object[], hasMixed: boolean}}
 */
export function analyzeGeoJson(geoJson) {
  if (!geoJson) {
    return { features2D: [], features3D: [], hasMixed: false }
  }

  const features = geoJson.type === 'FeatureCollection'
    ? (geoJson.features || [])
    : [geoJson]

  const features2D = []
  const features3D = []

  const hasZInCoordinates = (coords) => {
    if (!Array.isArray(coords)) return false
    if (coords.length === 0) return false
    if (typeof coords[0] === 'number') {
      return coords.length >= 3 && Number.isFinite(coords[2])
    }
    return coords.some(hasZInCoordinates)
  }

  features.forEach(feature => {
    const geometry = feature && feature.geometry
    const is3D = geometry && hasZInCoordinates(geometry.coordinates)
    if (is3D) {
      features3D.push(feature)
    } else {
      features2D.push(feature)
    }
  })

  return {
    features2D,
    features3D,
    hasMixed: features2D.length > 0 && features3D.length > 0
  }
}
