// 引入 Pinia 的 defineStore 用于定义 store
// 引入 Vue3 的 ref 用于响应式数据
// 引入 axios 用于发起 HTTP 请求
// 引入认证 store，用于获取当前登录用户的 userId 和 token
import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useAuthStore } from './auth'
import request from '@/utils/request'

// 定义用户信息的数据结构（接口返回的字段）
export interface User {
  id: number // 用户 ID
  username: string // 用户名
  createdAt: string // 用户创建时间
}

// 定义修改密码请求的数据结构（前端要传给后端的参数）
export interface UserPasswordChangeRequest {
  oldPassword: string // 旧密码
  newPassword: string // 新密码
}

// 定义 Pinia store：user 模块
export const useUserStore = defineStore('user', () => {
  // currentUser：保存当前用户信息（未登录时为 null）
  const currentUser = ref<User | null>(null)

  // isLoading：请求过程中显示加载状态（true 表示正在请求）
  const isLoading = ref(false)

  // errorMsg：保存错误信息，方便 UI 展示
  const errorMsg = ref<string | null>(null)

  // successMsg：保存成功提示信息，方便 UI 展示
  const successMsg = ref<string | null>(null)

  // 获取认证 store，用于拿到当前登录用户信息
  const authStore = useAuthStore()

  /**
   * 方法一：获取用户信息
   * 返回 Promise<boolean>，表示成功或失败
   */
  const fetchUserInfo = async (): Promise<boolean> => {
    // 请求开始，设置 loading 状态，清空提示信息
    isLoading.value = true
    errorMsg.value = null
    successMsg.value = null

    // // 从认证 store 拿到 userId
    // const userId = authStore.userId
    // if (!userId) {
    //   // 如果没有 userId，说明用户未登录，直接返回错误
    //   errorMsg.value = 'ユーザーは未ログインで、情報を取得できません'
    //   isLoading.value = false
    //   return false
    // }
    // 🌟 关键检查：在发起 API 请求前，先检查 Token 是否存在
    if (!authStore.token) {
      errorMsg.value = '認証情報が見つかりません。' // 找不到认证信息。
      isLoading.value = false
      return false
    }

    try {
      // 调用后端接口，获取用户信息
      const response = await request.get<{ data: User }>('/park/user/me')

      // 把返回的用户信息保存到 currentUser
      currentUser.value = response.data.data
      return true
    } catch (error) {
      // 捕获异常：区分 Axios 错误和网络错误
      if (axios.isAxiosError(error) && error.response) {
        errorMsg.value =
          error.response.data.message || `ユーザー情報取得失敗: ${error.response.status}`
      } else {
        errorMsg.value = 'ネットワークエラーまたはサーバー接続失敗'
      }
      return false
    } finally {
      // 请求结束，关闭 loading 状态
      isLoading.value = false
    }
  }

  /**
   * 方法二：修改密码
   * 参数：formData（包含旧密码和新密码）
   * 返回 Promise<boolean>，表示成功或失败
   */
  const changePassword = async (formData: UserPasswordChangeRequest): Promise<boolean> => {
    // 请求开始，设置 loading 状态，清空提示信息
    isLoading.value = true
    errorMsg.value = null
    successMsg.value = null

    // 从认证 store 拿到 userId
    // const userId = authStore.userId
    // if (!userId) {
    //   // 如果没有 userId，说明用户未登录，不能修改密码
    //   errorMsg.value = 'ユーザー未ログインで、パスワード変更できません'
    //   isLoading.value = false
    //   return false
    // }

    try {
      // 调用后端接口，提交修改密码请求
      //const response = await request.post(`/park/user/password_change`, formData)
      const response = await request.post('/park/user/password_change', formData)
      // 修改成功，保存提示信息
      successMsg.value = `${response.data.message}，请重新登录`
      authStore.logout() // 修改密码后强制登出
      return true
    } catch (error) {
      // 捕获异常：区分 Axios 错误和网络错误
      if (axios.isAxiosError(error) && error.response) {
        errorMsg.value =
          error.response.data.message || `パスワード変更失敗: ${error.response.status}`
      } else {
        errorMsg.value = 'ネットワークエラーまたはサーバー接続失敗'
      }
      return false
    } finally {
      // 请求结束，关闭 loading 状态
      isLoading.value = false
    }
  }

  // 暴露给组件使用的属性和方法
  return {
    currentUser, // 当前用户信息
    isLoading, // 加载状态
    errorMsg, // 错误信息
    successMsg, // 成功提示信息
    fetchUserInfo, // 获取用户信息方法
    changePassword, // 修改密码方法
  }
})
