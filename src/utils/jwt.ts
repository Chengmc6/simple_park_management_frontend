import { jwtDecode } from 'jwt-decode'

// 定义 Token Payload 的结构
export interface TokenPayload {
  // 'sub' (Subject) 字段，通常用于存储用户 ID
  sub: string
  username: string
  role: number
  iat: number // Issued At
  exp: number // Expiration Time
}

/**
 * 解析 JWT 字符串获取 Payload
 * @param token JWT 字符串
 * @returns 解析后的 Payload 对象，或 null
 */
export const getTokenPlayload = (token: string): TokenPayload | null => {
  try {
    return jwtDecode<TokenPayload>(token)
  } catch (e) {
    console.error('解析 token 失败:', e)
    return null
  }
}

/**
 * 检查 Token 是否已过期
 * @param token JWT 字符串
 * @returns 如果 Token 已过期或无效，则返回 true
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = getTokenPlayload(token)
  if (!payload) return true
  const now = Math.floor(Date.now() / 1000) // 当前时间（秒）
  return payload.exp < now
}
