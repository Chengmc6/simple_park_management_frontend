// 引入 Pinia 的 defineStore 用于定义 store
// 引入 Vue3 的 ref 和 computed 用于响应式数据
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
// 引入 JWT 工具，现在可以从 Token Payload 的 sub 字段中获取 ID
import { getTokenPlayload } from '@/utils/jwt'
import request from '@/utils/request'

// 登录参数类型
interface LoginCredentials {
  username: string
  password: string
}

// 注册参数类型
interface RegisterCredentials {
  username: string
  password: string
  confirmPassword: string
}

// --- 辅助函数：从 localStorage 和 Token 初始化状态 ---
const initializeAuthState = () => {
  // 1. 从 localStorage 读取 Token
  const initialToken = localStorage.getItem('userToken')

  let initialUserId: number | null = null
  let initialRole: number | null = null

  if (initialToken) {
    const payload = getTokenPlayload(initialToken)
    if (payload) {
      // 2. 从 Token Payload 的 'sub' 字段解析 userId
      // 注意：sub 是 string 类型，需转换为 number
      if (payload.sub && !isNaN(Number(payload.sub))) {
        initialUserId = Number(payload.sub)
      }
      // 3. 从 Token Payload 解析 role
      initialRole = payload.role || null
    }
  }
  // 返回所有初始状态
  return { initialToken, initialUserId, initialRole }
}

const { initialToken, initialUserId, initialRole } = initializeAuthState()

// 定义 Pinia store：auth 模块
export const useAuthStore = defineStore('auth', () => {
  // token：保存用户登录后的 JWT
  const token = ref<string | null>(initialToken)

  // userId：从 Token Payload 的 'sub' 字段解析获取
  const userId = ref<number | null>(initialUserId)

  // role：从 Token Payload 解析获取
  const role = ref<number | null>(initialRole)

  // isLoading：请求过程中显示加载状态
  const isLoading = ref(false)

  // errorMsg：保存错误信息
  const errorMsg = ref<string | null>(null)

  // 计算属性：是否已登录
  const isAuthenticated = computed(() => !!token.value)

  // 登录方法
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    isLoading.value = true
    errorMsg.value = null

    try {
      // 调用后端登录接口
      const response = await request.post('/park/user/login', credentials)

      // 从响应中取出数据
      const newToken = response.data.data?.token

      if (newToken) {
        // 1. 设置 Token 并保存到 localStorage
        token.value = newToken
        localStorage.setItem('userToken', newToken)

        // 2. 解析 Token Payload 填充 userId 和 role
        const payload = getTokenPlayload(newToken)

        if (payload) {
          // 从 sub 字段获取 userId
          if (payload.sub && !isNaN(Number(payload.sub))) {
            userId.value = Number(payload.sub)
          }
          // 从 role 字段获取 role
          role.value = payload.role || null
        } else {
          errorMsg.value = '登录成功，但 Token 解析失败。'
          return false
        }

        return true
      } else {
        errorMsg.value = '登录成功，但未返回有效的 Token。'
        return false
      }
    } catch (error) {
      // 捕获异常：区分 Axios 错误和网络错误
      if (axios.isAxiosError(error) && error.response) {
        errorMsg.value = error.response.data.message || `登录失败:${error.response.status}`
      } else {
        errorMsg.value = '网络错误或服务器连接失败。'
      }

      // 登录失败时清空所有状态
      token.value = null
      userId.value = null
      role.value = null
      localStorage.removeItem('userToken')
      return false
    } finally {
      // 请求结束，关闭 loading 状态
      isLoading.value = false
    }
  }

  // 登出方法
  const logout = () => {
    // 彻底清空所有 Pinia 状态
    token.value = null
    userId.value = null
    role.value = null
    isLoading.value = false
    errorMsg.value = null

    // 彻底删除本地存储的 token
    localStorage.removeItem('userToken')
  }

  // 注册方法
  const register = async (credentials: RegisterCredentials) => {
    isLoading.value = true
    errorMsg.value = null
    try {
      // 调用后端注册接口
      const payload = {
        username: credentials.username,
        password: credentials.password,
      }
      const response = await request.post('/park/user', payload)

      // 根据后端返回的 code 判断是否成功
      if (response.data.code == 200) {
        return { success: true, message: response.data.message || '注册成功！请登录。' }
      } else {
        return { success: false, message: response.data.message || '注册失败，请检查输入。' }
      }
    } catch (error) {
      // 捕获异常：区分 Axios 错误和网络错误
      if (axios.isAxiosError(error) && error.response) {
        errorMsg.value = error.response.data.message || `注册失败: ${error.response.status}`
      } else {
        errorMsg.value = '网络错误或服务器连接失败。'
      }
      return { success: false, message: errorMsg.value }
    } finally {
      // 请求结束，关闭 loading 状态
      isLoading.value = false
    }
  }

  // 暴露给组件使用的属性和方法
  return {
    token, // 登录 token
    userId, // 用户 ID (从 token 的 sub 字段解析)
    role,
    isLoading, // 加载状态
    errorMsg, // 错误信息
    isAuthenticated, // 是否已登录
    login, // 登录方法
    logout, // 登出方法
    register, // 注册方法
  }
})
