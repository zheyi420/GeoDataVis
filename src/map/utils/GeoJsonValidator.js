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
