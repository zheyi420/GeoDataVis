/**
 * WFS 分批加载工具
 * 支持从 WFS URL 加载 GeoJSON，当要素数 > 5000 时自动分批请求并合并
 */

import { ElNotification } from 'element-plus'
import { parseAndValidateFromText } from './GeoJsonValidator'

const BATCH_SIZE = 5000
const MAX_RETRY_ATTEMPTS = 3

/**
 * 解析 WFS URL 参数
 * @param {string} url
 * @returns {{ count: number|null, maxFeatures: number|null, hasLimit: boolean }}
 */
export function parseWfsUrlParams(url) {
  if (!url || typeof url !== 'string') {
    return { count: null, maxFeatures: null, hasLimit: false }
  }
  try {
    const urlObj = new URL(url.trim())
    const params = urlObj.searchParams
    const countStr = params.get('count') ?? params.get('COUNT')
    const maxFeaturesStr = params.get('maxFeatures') ?? params.get('maxfeatures') ?? params.get('MAXFEATURES')
    const count = countStr != null ? parseInt(countStr, 10) : null
    const maxFeatures = maxFeaturesStr != null ? parseInt(maxFeaturesStr, 10) : null
    const hasLimit = (count != null && !Number.isNaN(count)) || (maxFeatures != null && !Number.isNaN(maxFeatures))
    return {
      count: count != null && !Number.isNaN(count) ? count : null,
      maxFeatures: maxFeatures != null && !Number.isNaN(maxFeatures) ? maxFeatures : null,
      hasLimit
    }
  } catch {
    return { count: null, maxFeatures: null, hasLimit: false }
  }
}

/**
 * 确保 URL 包含 GeoJSON 输出格式
 * @param {string} url
 * @returns {string}
 */
export function ensureGeoJsonOutputFormat(url) {
  if (!url || typeof url !== 'string') return url
  try {
    const urlObj = new URL(url.trim())
    const outputFormat = urlObj.searchParams.get('outputFormat') ?? urlObj.searchParams.get('OUTPUTFORMAT')
    if (!outputFormat || !/application\/json|json/i.test(outputFormat)) {
      urlObj.searchParams.set('outputFormat', 'application/json')
    }
    return urlObj.toString()
  } catch {
    return url
  }
}

/**
 * 在 URL 上添加或覆盖参数
 * 分批时需同时设置 count 和 maxFeatures，以覆盖用户 URL 中原有的 maxFeatures，兼容 WFS 1.0/1.1
 * @param {string} baseUrl
 * @param {{ count?: number, startIndex?: number, maxFeatures?: number }}
 * @returns {string}
 */
export function buildWfsUrlWithParams(baseUrl, { count, startIndex, maxFeatures }) {
  if (!baseUrl || typeof baseUrl !== 'string') return baseUrl
  try {
    const urlObj = new URL(baseUrl.trim())
    if (count != null) {
      urlObj.searchParams.set('count', String(count))
    }
    if (startIndex != null) {
      urlObj.searchParams.set('startIndex', String(startIndex))
    }
    if (maxFeatures != null) {
      urlObj.searchParams.set('maxFeatures', String(maxFeatures))
    }
    return urlObj.toString()
  } catch {
    return baseUrl
  }
}

/**
 * 从 URL 获取 GeoJSON 数据
 * @param {string} url
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Object>}
 */
export async function fetchWfsGeoJson(url, options = {}) {
  const { signal } = options
  const fetchOptions = signal ? { signal } : {}
  const response = await fetch(url, fetchOptions)
  if (!response.ok) {
    throw new Error(`WFS 请求失败: ${response.status}`)
  }
  const text = await response.text()
  return parseAndValidateFromText(text)
}

/**
 * 带重试的 fetch，单次请求最多尝试 maxAttempts 次
 * @param {string} url
 * @param {{ maxAttempts?: number, signal?: AbortSignal }} [options]
 * @returns {Promise<Object>}
 */
export async function fetchWfsGeoJsonWithRetry(url, options = {}) {
  const { maxAttempts = MAX_RETRY_ATTEMPTS, signal } = options
  let lastError
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }
    try {
      return await fetchWfsGeoJson(url, { signal })
    } catch (error) {
      lastError = error
      if (error?.name === 'AbortError') throw error
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, 300 * attempt))
      }
    }
  }
  throw lastError
}

/**
 * 获取 WFS 匹配的要素总数
 * @param {string} url
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<number>}
 */
export async function getWfsTotalCount(url, options = {}) {
  const { signal } = options
  const urlWithCount = buildWfsUrlWithParams(ensureGeoJsonOutputFormat(url), { count: 1, maxFeatures: 1 })
  const data = await fetchWfsGeoJson(urlWithCount, { signal })
  const total = data?.numberMatched ?? data?.totalFeatures ?? data?.numberReturned
  if (total != null && Number.isFinite(Number(total))) {
    return Number(total)
  }
  const features = data?.features
  if (Array.isArray(features)) {
    if (features.length === 0) return 0
    if (features.length === 1) return 1
    return features.length
  }
  throw new Error('无法从 WFS 响应获取要素总数')
}

/**
 * 构建失败批次通知的 HTML 内容
 * 格式「第 X–Y」表示 startIndex 至 endExclusive（不含）的要素范围
 * @param {{ startIndex: number, endExclusive: number }[]} failedBatches
 * @returns {string}
 */
function buildFailureNotificationMessage(failedBatches) {
  if (!failedBatches || failedBatches.length === 0) return ''
  const items = failedBatches.map(
    ({ startIndex, endExclusive }) =>
      `第 ${startIndex}–${endExclusive} 批次加载失败，请检查网络或稍后重试`
  )
  if (items.length === 1) {
    return items[0]
  }
  return `<ul style="margin:0;padding-left:1.2em;text-align:left;word-wrap:break-word;">${items.map(i => `<li>${i}</li>`).join('')}</ul>`
}

/**
 * 显示失败批次 ElNotification
 * @param {{ startIndex: number, endExclusive: number }[]} failedBatches
 */
function showFailureNotification(failedBatches) {
  const message = buildFailureNotificationMessage(failedBatches)
  if (!message) return
  ElNotification.warning({
    title: 'WFS 分批加载',
    message,
    duration: 0,
    position: 'top-right',
    dangerouslyUseHTMLString: true
  })
}

/**
 * 分批请求并合并，含失败重试逻辑
 * @param {string} url
 * @param {number} totalCount
 * @param {number} [batchSize=5000]
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ geoJson: Object, partialFailureMessage?: string }|null>}
 */
export async function fetchWfsBatch(url, totalCount, batchSize = BATCH_SIZE, options = {}) {
  const { signal } = options
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  const baseUrl = ensureGeoJsonOutputFormat(url)
  const batchCount = Math.ceil(totalCount / batchSize)
  const batchInfos = []
  for (let i = 0; i < batchCount; i++) {
    const startIndex = i * batchSize
    const endExclusive = Math.min((i + 1) * batchSize, totalCount)
    batchInfos.push({
      startIndex,
      endIndex: endExclusive - 1,
      endExclusive,
      batchIndex: i
    })
  }

  let failedBatches = []

  const runBatch = async (info) => {
    const batchUrl = buildWfsUrlWithParams(baseUrl, {
      count: batchSize,
      startIndex: info.startIndex,
      maxFeatures: batchSize
    })
    try {
      return await fetchWfsGeoJsonWithRetry(batchUrl, { signal })
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      return null
    }
  }

  const runBatches = async (infos) => {
    const results = await Promise.all(infos.map((info, idx) => runBatch(info).then((r) => ({ info, result: r, idx }))))
    const failed = results.filter(r => r.result === null).map(r => r.info)
    const succeeded = results.filter(r => r.result !== null).map(r => r.result)
    return { failed, succeeded }
  }

  let { failed, succeeded } = await runBatches(batchInfos)

  for (let retry = 1; retry < MAX_RETRY_ATTEMPTS && failed.length > 0; retry++) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }
    const retryResults = await runBatches(failed)
    succeeded = succeeded.concat(retryResults.succeeded)
    failed = retryResults.failed
  }

  failedBatches = failed.map(({ startIndex, endExclusive }) => ({ startIndex, endExclusive }))

  if (failedBatches.length > 0) {
    showFailureNotification(failedBatches)
  }

  if (succeeded.length === 0) {
    return null
  }

  const allFeatures = succeeded.flatMap(d => d?.features ?? []).filter(Boolean)
  const geoJson = {
    type: 'FeatureCollection',
    features: allFeatures
  }

  const partialFailureMessage =
    failedBatches.length > 0 ? buildFailureNotificationMessage(failedBatches) : undefined

  return { geoJson, partialFailureMessage }
}

/**
 * 主入口：按需求 (1)(2) 分支加载 WFS
 * @param {string} url
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ geoJson: Object, partialFailureMessage?: string, isEmpty?: boolean }|null>}
 */
export async function loadWfsAsGeoJson(url, options = {}) {
  if (!url || typeof url !== 'string') {
    throw new Error('未提供 WFS URL')
  }
  const trimmed = url.trim()
  if (!trimmed) {
    throw new Error('未提供 WFS URL')
  }

  const { signal } = options
  const params = parseWfsUrlParams(trimmed)
  const baseUrl = ensureGeoJsonOutputFormat(trimmed)

  let totalCount
  let limit

  if (params.hasLimit) {
    limit = params.count ?? params.maxFeatures ?? 0
    if (limit <= 0) {
      throw new Error('URL 中的 count/maxFeatures 无效')
    }
    if (limit <= BATCH_SIZE) {
      const data = await fetchWfsGeoJsonWithRetry(baseUrl, { signal })
      const isEmpty = !data?.features || data.features.length === 0
      return { geoJson: data, isEmpty }
    }
    totalCount = limit
  } else {
    totalCount = await getWfsTotalCount(trimmed, { signal })
    if (totalCount === 0) {
      return { geoJson: { type: 'FeatureCollection', features: [] }, isEmpty: true }
    }
    if (totalCount <= BATCH_SIZE) {
      const data = await fetchWfsGeoJsonWithRetry(baseUrl, { signal })
      const isEmpty = !data?.features || data.features.length === 0
      return { geoJson: data, isEmpty }
    }
  }

  const batchResult = await fetchWfsBatch(baseUrl, totalCount, BATCH_SIZE, { signal })
  if (batchResult === null) return null
  const isEmpty = !batchResult.geoJson?.features || batchResult.geoJson.features.length === 0
  return { ...batchResult, isEmpty }
}
