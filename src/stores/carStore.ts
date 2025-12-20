import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'
import { useAuthStore } from './auth' // 引入 authStore 以获取 userId
import request from '@/utils/request'

// ----------------------------------------------------
// 辅助类型定义 (与后端实体结构对齐)
// ----------------------------------------------------

/**
 * 后端 PageResult<R> 的 TypeScript 映射
 */
interface PageResult<T> {
  total: number // 总记录数
  pageNum: number // 当前页码 (对应后端 pageNum)
  pageSize: number // 每页大小 (对应后端 pageSize)
  totalPages: number // 总页数 (对应后端 totalPages)
  records: T[] // 数据列表
}

/**
 * 车辆实体定义 (与后端 Car.java 对齐)
 */
export interface Car {
  id: number // 对应 @TableId(value = "id")
  carNumber: string // 对应 carNumber (车辆编号)
  status: 0 | 1 // 车辆状态
  currentUserId: number | null // 今使用者ID
}

/**
 * 车辆查询请求 DTO
 */
interface CarQuery {
  carNumber?: string // 对应后端 carNumber (关键字查询)
  pageNum: number // 对应后端 pageNum
  pageSize: number // 对应后端 pageSize
}

// ----------------------------------------------------
// 乘车/降车 DTOs
// ----------------------------------------------------

/**
 * 乘车表单数据 (前端提交) - 对应 CarRideRequestDTO
 */
export interface RideFormData {
  carId: number
  rideTime: string // LocalDateTime 映射为 ISO 格式字符串
  rideAlcoholLevel: number // BigDecimal 映射为 number
}

/**
 * 降车表单数据 (前端提交) - 对应 CarDropRequestDTO
 */
export interface DropFormData {
  carId: number
  dropTime: string // LocalDateTime 映射为 ISO 格式字符串
  dropAlcoholLevel: number // BigDecimal 映射为 number
}

// ----------------------------------------------------
// 车辆使用履历 DTOs (新增)
// ----------------------------------------------------

/**
 * 履历请求 DTO (UsageRequestDTO)
 */
interface UsageQuery {
  carId: number
  pageNum: number
  pageSize: number
}

/**
 * 履历响应 VO (UsageResponseVO) - 用于列表项
 */
export interface UsageHistoryItem {
  carNumber: string
  username: string
  rideTime: string // LocalDateTime 映射为 ISO 格式字符串
  rideAlcoholLevel: number // BigDecimal 映射为 number
  dropTime: string | null // LocalDateTime 映射为 ISO 格式字符串 (可能为空)
  dropAlcoholLevel: number | null // BigDecimal 映射为 number (可能为空)
}

// ----------------------------------------------------
// Pinia Store 定义
// ----------------------------------------------------
export const useCarStore = defineStore('car', () => {
  // State
  const carList = ref<Car[]>([])
  const currentCarDetails = ref<Car | null>(null)
  // 车辆列表分页状态
  const pagination = ref({
    total: 0,
    pages: 1, // 对应 totalPages
    current: 1, // 对应 pageNum
    size: 20, // 对应 pageSize
  })
  // 车辆使用履历列表状态 (新增)
  const usageHistoryList = ref<UsageHistoryItem[]>([])
  const usagePagination = ref({
    total: 0,
    pages: 1,
    current: 1,
    size: 20, // 对应 UsageRequestDTO 的默认 pageSize
  })

  const isLoading = ref(false)
  const errorMsg = ref<string | null>(null)
  const successMsg = ref<string | null>(null)

  // Actions
  const authStore = useAuthStore() // 引用 authStore

  /**
   * 1. 查询车辆列表 Action: 调用 POST /park/car/query
   */
  const fetchCarList = async (query: { page: number; size: number; keyword?: string }) => {
    isLoading.value = true
    errorMsg.value = null
    successMsg.value = null

    // 映射前端习惯的 page/size/keyword 映射为后端 CarQueryRequestDTO 的字段
    const payload: CarQuery = {
      pageNum: query.page,
      pageSize: query.size,
      carNumber: query.keyword, // 将 keyword 映射为 carNumber
    }

    try {
      const response = await request.post('/park/car/query', payload)

      const pageData: PageResult<Car> = response.data.data

      carList.value = pageData.records
      // 映射后端字段到前端 pagination 状态
      pagination.value = {
        total: pageData.total,
        pages: pageData.totalPages,
        current: pageData.pageNum,
        size: pageData.pageSize,
      }
      return true
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        errorMsg.value = error.response.data.message || `查询失败: ${error.response.status}`
      } else {
        errorMsg.value = '网络错误或服务器连接失败。'
      }
      carList.value = []
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 2. 查询单个车辆详情 (非分页)
   */
  const getCarDetails = async (carId: number) => {
    isLoading.value = true
    errorMsg.value = null
    currentCarDetails.value = null

    try {
      // 假设后端查询接口支持通过 carNumber 字段查询具体的 ID 或车牌号
      const payload: CarQuery = {
        pageNum: 1,
        pageSize: 1,
        carNumber: carId.toString(), // 传递 carId 作为 carNumber 关键字
      }

      const response = await request.post('/park/car/query', payload)
      const carDetails = response.data.data.records[0] as Car | undefined

      if (carDetails) {
        currentCarDetails.value = carDetails
      } else {
        throw new Error('未找到车辆详情')
      }
      return currentCarDetails.value
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        errorMsg.value = error.response.data.message || `获取车辆详情失败: ${error.response.status}`
      } else {
        errorMsg.value = '网络错误或服务器连接失败。'
      }
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 3. 乘车 (租用) Action: 调用 POST /park/car/ride
   */
  const rideCar = async (formData: RideFormData) => {
    isLoading.value = true
    errorMsg.value = null
    successMsg.value = null

    // 🚨 确保 userId 存在并添加到 Payload
    if (!authStore.userId) {
      errorMsg.value = '用户未登录或用户ID获取失败，无法提交乘车信息。'
      isLoading.value = false
      return false
    }

    try {
      // 构造 Payload，显式添加 userId
      const payload = {
        carId: formData.carId,
        userId: authStore.userId, // 从 authStore 获取并添加
        rideTime: formData.rideTime,
        rideAlcoholLevel: formData.rideAlcoholLevel,
      }

      await request.post('/park/car/ride', payload)
      successMsg.value = '✅ 乘车信息提交成功！'
      return true
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        errorMsg.value = error.response.data.message || `乘车失败: ${error.response.status}`
      } else {
        errorMsg.value = '网络错误或服务器连接失败。'
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 4. 降车 (归还) Action: 调用 POST /park/car/drop
   */
  const dropCar = async (formData: DropFormData) => {
    isLoading.value = true
    errorMsg.value = null
    successMsg.value = null

    // 🚨 确保 userId 存在并添加到 Payload
    if (!authStore.userId) {
      errorMsg.value = '用户未登录或用户ID获取失败，无法提交降车信息。'
      isLoading.value = false
      return false
    }

    try {
      // 构造 Payload，显式添加 userId
      const payload = {
        carId: formData.carId,
        userId: authStore.userId, // 从 authStore 获取并添加
        dropTime: formData.dropTime,
        dropAlcoholLevel: formData.dropAlcoholLevel,
      }

      await request.post('/park/car/drop', payload)
      successMsg.value = '✅ 降车信息提交成功！'
      return true
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        errorMsg.value = error.response.data.message || `降车失败: ${error.response.status}`
      } else {
        errorMsg.value = '网络错误或服务器连接失败。'
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 5. 新增车辆 Action: POST /park/car/add
   */
  const addCar = async (carNumber: string) => {
    isLoading.value = true
    errorMsg.value = null
    successMsg.value = null

    try {
      const payload = { carNumber } // 与 CarAddRequestDTO 对齐

      await request.post('/park/car/add', payload)
      successMsg.value = `✅ 车辆编号 ${carNumber} 新增成功！`
      // 成功后刷新列表
      await fetchCarList({ page: 1, size: pagination.value.size })
      return true
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        errorMsg.value = error.response.data.message || `新增车辆失败: ${error.response.status}`
      } else {
        errorMsg.value = '网络错误或服务器连接失败。'
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 6. 查询车辆使用履历 Action: 调用 POST /park/car-usage/history
   */
  const fetchUsageHistory = async (query: { carId: number; page: number; size: number }) => {
    isLoading.value = true
    errorMsg.value = null

    // 映射前端习惯的 page/size 到后端 UsageRequestDTO
    const payload: UsageQuery = {
      carId: query.carId,
      pageNum: query.page,
      pageSize: query.size,
    }

    try {
      const response = await request.post('/park/car-usage/history', payload)
      const pageData: PageResult<UsageHistoryItem> = response.data.data

      usageHistoryList.value = pageData.records
      usagePagination.value = {
        total: pageData.total,
        pages: pageData.totalPages,
        current: pageData.pageNum,
        size: pageData.pageSize,
      }
      return true
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        errorMsg.value = error.response.data.message || `查询车辆履历失败: ${error.response.status}`
      } else {
        errorMsg.value = '网络错误或服务器连接失败。'
      }
      usageHistoryList.value = []
      return false
    } finally {
      isLoading.value = false
    }
  }

  return {
    carList,
    currentCarDetails,
    pagination,
    usageHistoryList, // 新增
    usagePagination, // 新增
    isLoading,
    errorMsg,
    successMsg,
    fetchCarList,
    getCarDetails,
    rideCar,
    dropCar,
    addCar,
    fetchUsageHistory, // 新增
  }
})
