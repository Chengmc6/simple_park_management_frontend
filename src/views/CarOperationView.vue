<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
// 从模拟的 carStore.ts 中引入类型和 store
import { useCarStore, type Car, type DropFormData, type RideFormData } from '@/stores/carStore'
import { useUserStore } from '@/stores/userStore'
import { onMounted, ref, watch, computed } from 'vue' // 确保导入了 computed
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const carStore = useCarStore()
const userStore = useUserStore()
const authStore = useAuthStore()

// 🌟 使用 ref 存储当前操作的车辆数据，确保响应式 (替换了非响应式的 car)
const currentCar = ref<Car | null>(null)

// 🌟 使用 computed 获取用户信息，确保是响应式的最新状态 (替换了非响应式的 user)
const currentUser = computed(() => userStore.currentUser)

// 获取当前时间，格式为 YYYY-MM-DDTHH:MM，用于 datetime-local input
const getCurrentTime = () => new Date().toISOString().substring(0, 16)

// 初始表单数据，注意这里在 loadData 中会根据 currentCar.status 再次初始化时间
const formData = ref<Partial<RideFormData & DropFormData>>({
  carId: undefined,
  rideTime: undefined,
  dropTime: undefined,
  rideAlcoholLevel: 0,
  dropAlcoholLevel: 0,
})

// 核心加载函数：从路由查询参数中获取车辆信息并初始化表单
const loadData = async () => {
  carStore.isLoading = true // 设置加载状态
  carStore.errorMsg = null

  try {
    const carDataString = route.query.car as string | undefined

    if (!carDataString) {
      carStore.errorMsg = 'URL中缺少车辆信息，无法进行操作。'
      currentCar.value = null
      return
    }

    // 解析车辆对象 (可能是简略信息)
    const parsedCar = JSON.parse(carDataString) as Car

    // 1. 尝试从后端获取最新详情，并直接使用返回值
    const fetchedCar = await carStore.getCarDetails(parsedCar.id)

    // 2. 使用获取到的最新数据，如果获取失败则回退使用解析的数据
    const detailCar = fetchedCar || parsedCar
    currentCar.value = detailCar // 🌟 关键：设置响应式状态，供模板和 handleSubmit 使用

    // 3. 初始化表单
    formData.value.carId = detailCar.id

    if (detailCar.status === 0) {
      // 准备乘车操作
      formData.value.rideTime = getCurrentTime()
      formData.value.dropTime = undefined // 清除不相关的字段
    } else if (detailCar.status === 1) {
      // 准备降车操作
      formData.value.dropTime = getCurrentTime()
      formData.value.rideTime = undefined // 清除不相关的字段
    } else {
      carStore.errorMsg = `车辆状态 (${detailCar.status}) 不支持操作。`
    }
  } catch (e) {
    console.error('加载车辆操作数据失败:', e)
    carStore.errorMsg = '加载数据或解析车辆信息时发生错误。'
  } finally {
    carStore.isLoading = false
  }
}

onMounted(() => {
  // 首次加载数据
  loadData() // 确保当前用户数据已加载（虽然在路由守卫中应该已经加载）
  if (!userStore.currentUser && authStore.token) {
    userStore.fetchUserInfo()
  }
})

watch(
  // 监听 route.query.car 的变化
  () => route.query.car,
  () => {
    loadData()
  },
)

const handleSubmit = async () => {
  carStore.errorMsg = null
  carStore.successMsg = null

  let isSuccess = false

  if (!currentCar.value) {
    // 🌟 使用 currentCar.value
    carStore.errorMsg = '车辆数据不存在或无效。'
    return
  }

  if (currentCar.value.status === 0) {
    // 🌟 使用 currentCar.value.status
    // 乘车
    const rideData: RideFormData = {
      carId: currentCar.value.id, // 🌟 使用 currentCar.value.id
      rideTime: formData.value.rideTime as string,
      rideAlcoholLevel: formData.value.rideAlcoholLevel as number,
    }
    isSuccess = await carStore.rideCar(rideData)
  } else if (currentCar.value.status === 1) {
    // 🌟 使用 currentCar.value.status
    // 降车
    const dropData: DropFormData = {
      carId: currentCar.value.id, // 🌟 使用 currentCar.value.id
      dropTime: formData.value.dropTime as string,
      dropAlcoholLevel: formData.value.dropAlcoholLevel as number,
    }
    isSuccess = await carStore.dropCar(dropData)
  }

  if (isSuccess) {
    // 成功后跳转回查询页面
    carStore.successMsg = '操作成功！' // 设置成功消息
    router.push({ name: 'car-query' })
  }
  // 失败信息已由 store 内部设置
}
</script>

<template>
  <div class="car-operation-page">
    <h2 class="page-title">
      <span class="car-number">{{ currentCar?.carNumber ?? 'N/A' }}</span>
      <span class="title-action">
        {{ currentCar?.status == 0 ? '乗車' : '降車' }} アルコール度数登録
      </span>
    </h2>

    <!-- 提示信息 -->
    <el-alert
      v-if="carStore.isLoading"
      title="操作数据加载中..."
      type="info"
      show-icon
      :closable="false"
      class="mb-4"
    />
    <el-alert
      v-if="carStore.errorMsg && !carStore.isLoading"
      :title="carStore.errorMsg"
      type="error"
      show-icon
      :closable="false"
      class="mb-4"
    />

    <!-- 表单 -->
    <el-form
      v-if="currentCar && !carStore.isLoading && !carStore.errorMsg"
      :model="formData"
      label-position="top"
      @submit.prevent="handleSubmit"
      class="operation-form"
    >
      <!-- 信息栏 -->
      <el-descriptions border :column="2" class="mb-4">
        <el-descriptions-item label="車両番号">
          {{ currentCar?.carNumber ?? '加载中' }}
        </el-descriptions-item>
        <el-descriptions-item label="ユーザー">
          {{ currentUser?.username ?? 'N/A' }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 乘车字段 -->
      <template v-if="currentCar?.status == 0">
        <el-form-item label="乗車時間" prop="rideTime">
          <el-input v-model="formData.rideTime" type="datetime-local" />
        </el-form-item>
        <el-form-item label="乗車時のアルコール度数" prop="rideAlcoholLevel">
          <el-input-number v-model="formData.rideAlcoholLevel" :min="0" :step="0.01" />
        </el-form-item>
      </template>

      <!-- 降车字段 -->
      <template v-else-if="currentCar?.status == 1">
        <el-form-item label="降車時間" prop="dropTime">
          <el-input v-model="formData.dropTime" type="datetime-local" />
        </el-form-item>
        <el-form-item label="降車時のアルコール度数" prop="dropAlcoholLevel">
          <el-input-number v-model="formData.dropAlcoholLevel" :min="0" :step="0.01" />
        </el-form-item>
      </template>

      <!-- 按钮组 -->
      <div class="button-group">
        <el-button type="primary" native-type="submit" :loading="carStore.isLoading">
          {{ carStore.isLoading ? '処理中...' : '送信' }}
        </el-button>
        <el-button @click="router.back()">取消</el-button>
      </div>
    </el-form>
  </div>
</template>

<style scoped>
.car-operation-page {
  min-height: 100vh;
  background-color: #f5f7fa; /* 与整体页面统一 */
  padding: 40px 20px;
}

.page-title {
  font-size: 20px;
  margin-bottom: 20px;
  color: #303133;
  text-align: center; /* 标题居中 */
}

.car-number {
  font-weight: bold;
  margin-right: 8px;
}

.title-action {
  color: #606266;
}

.mb-4 {
  margin-bottom: 1rem;
}

.operation-form {
  width: 100%;
  max-width: 800px; /* 限制最大宽度 */
  margin: 0 auto; /* 居中显示 */
}

.button-group {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
