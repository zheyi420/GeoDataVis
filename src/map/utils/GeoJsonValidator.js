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
      return coords.length >= 3
        && coords[2] !== null
        && coords[2] !== undefined
        && Number.isFinite(coords[2])
        && coords[2] !== 0
    }
    return coords.every(hasZInCoordinates)
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

  const result = {
    features2D,
    features3D,
    hasMixed: features2D.length > 0 && features3D.length > 0
  }

  const { warnings, stats } = validateGeoJsonQuality(geoJson, features2D, features3D)

  console.log('[GeoJSON 分析]', {
    '2D 要素数': features2D.length,
    '3D 要素数': features3D.length,
    '是否混合': result.hasMixed,
    '地理范围': stats,
    '警告': warnings
  })

  return { ...result, warnings, stats }
}

export function validateGeoJsonQuality(geoJson, features2D, features3D) {
  const stats = {
    bounds2D: null,
    bounds3D: null,
    heightRange: { min: Infinity, max: -Infinity }
  }

  if (features2D.length > 0) {
    stats.bounds2D = calculateBounds(features2D)
  }

  if (features3D.length > 0) {
    stats.bounds3D = calculateBounds(features3D)
    stats.heightRange = calculateHeightRange(features3D)
  }

  return { warnings: [], stats }
}

/**
 * 合并 stats 中的 2D/3D 范围，供相机定位使用
 * @param {{bounds2D: object|null, bounds3D: object|null, heightRange: {min: number, max: number}}} stats
 * @returns {{west: number, south: number, east: number, north: number, minHeight: number, maxHeight: number}|null}
 */
export function computeMergedBounds(stats) {
  const bounds2D = stats?.bounds2D
  const bounds3D = stats?.bounds3D
  const heightRange = stats?.heightRange
  if (!bounds2D && !bounds3D) {
    return null
  }

  const west = Math.min(bounds2D?.west ?? Infinity, bounds3D?.west ?? Infinity)
  const east = Math.max(bounds2D?.east ?? -Infinity, bounds3D?.east ?? -Infinity)
  const south = Math.min(bounds2D?.south ?? Infinity, bounds3D?.south ?? Infinity)
  const north = Math.max(bounds2D?.north ?? -Infinity, bounds3D?.north ?? -Infinity)

  const has3D = Boolean(bounds3D)
  const minHeight = has3D && Number.isFinite(heightRange?.min) ? heightRange.min : 0
  const maxHeight = has3D && Number.isFinite(heightRange?.max) ? heightRange.max : 0

  return { west, south, east, north, minHeight, maxHeight }
}

function calculateBounds(features) {
  let minLon = Infinity
  let maxLon = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity

  features.forEach(feature => {
    const coords = feature?.geometry?.coordinates
    if (coords) {
      extractCoordinates(coords).forEach(([lon, lat]) => {
        if (!Number.isFinite(lon) || !Number.isFinite(lat)) return
        minLon = Math.min(minLon, lon)
        maxLon = Math.max(maxLon, lon)
        minLat = Math.min(minLat, lat)
        maxLat = Math.max(maxLat, lat)
      })
    }
  })

  if (!Number.isFinite(minLon) || !Number.isFinite(minLat)) {
    return null
  }

  return {
    west: minLon,
    east: maxLon,
    south: minLat,
    north: maxLat
  }
}

function calculateHeightRange(features) {
  let min = Infinity
  let max = -Infinity

  features.forEach(feature => {
    const coords = feature?.geometry?.coordinates
    if (coords) {
      extractCoordinates(coords).forEach(coord => {
        if (coord.length >= 3 && Number.isFinite(coord[2])) {
          min = Math.min(min, coord[2])
          max = Math.max(max, coord[2])
        }
      })
    }
  })

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: Infinity, max: -Infinity }
  }

  return { min, max }
}

function extractCoordinates(coords) {
  if (!Array.isArray(coords)) return []
  if (typeof coords[0] === 'number') return [coords]
  return coords.flatMap(extractCoordinates)
}
