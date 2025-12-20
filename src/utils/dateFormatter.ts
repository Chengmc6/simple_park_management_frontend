/**
 * 格式化 ISO 8601 日期时间字符串为 YYYY/MM/DD HH:mm:ss 格式。
 * 特别处理来自后端、缺少时区信息的 LocalDateTime 字符串，确保显示时区正确。
 * * @param isoString ISO 日期时间字符串 (可能为 YYYY-MM-DDTHH:mm:ss 格式)
 * @returns 格式化后的字符串或 '-'
 */
export const formatDateTime = (isoString: string | undefined | null): string => {
  if (!isoString) return '-'

  let dateToParse = isoString

  // 检查字符串是否包含时间分隔符 'T' 但缺少时区信息 (Z, +HH:MM, -HH:MM)
  // 这是 Java LocalDateTime 默认序列化后的常见形式。
  if (
    isoString.includes('T') &&
    !isoString.endsWith('Z') &&
    !isoString.includes('+') &&
    !isoString.includes('-')
  ) {
    // 强制将其视为 UTC 时间。
    // 这样 new Date() 就能可靠地将其转换为用户的本地时间。
    dateToParse = isoString + 'Z'
  }

  try {
    let date = new Date(dateToParse)

    // 如果解析结果无效
    if (isNaN(date.getTime())) {
      // 尝试直接解析原始字符串作为本地时间，作为最终兼容性回退
      const fallbackDate = new Date(isoString)
      if (isNaN(fallbackDate.getTime())) return isoString
      // 如果回退成功，使用回退时间对象
      dateToParse = isoString
      date = fallbackDate
    }

    // 以下所有 date.get*() 方法都返回用户本地时间的分量
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    // 使用 getHours() 等获取本地时间的小时、分钟、秒
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
  } catch (e) {
    console.error('日期格式化失败:', e, '原始输入:', isoString)
    return isoString
  }
}
