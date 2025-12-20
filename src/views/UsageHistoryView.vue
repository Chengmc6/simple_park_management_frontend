<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
// 假设 carStore 中包含了 pagination 状态
import { useCarStore, type Car, type UsageHistoryItem } from '@/stores/carStore'
import { onMounted, ref, computed } from 'vue'
import { formatDateTime } from '@/utils/dateFormatter' // 导入日期格式化函数

const route = useRoute()
const router = useRouter()
const carStore = useCarStore()
// 记录列表
const usageRecords = ref<UsageHistoryItem[]>([])
// 从路由获取的车辆ID
const routeCarId = route.query.carId as string | undefined
// 页面内错误消息
const errorMsg = ref<string | null>(null)
// 分页参数
const pageSize = ref<number>(10)
const currentPage = ref<number>(1)
const car = ref<Car | null>(null)

// 计算总页数
const totalPages = computed(() => carStore.pagination?.total || 1)

/**
 * 核心加载函数：获取使用履历
 * @param params 分页和车辆ID参数
 */
const loadUsageRecords = async (params: { page?: number; size?: number; carId?: number }) => {
  // 确定最终用于查询的车辆 ID
  const finalId = params.carId ?? car.value?.id ?? (routeCarId ? Number(routeCarId) : undefined)

  carStore.isLoading = true
  carStore.errorMsg = null
  errorMsg.value = null

  // 更新当前分页状态
  currentPage.value = params.page ?? currentPage.value
  pageSize.value = params.size ?? pageSize.value

  try {
    if (!finalId) {
      errorMsg.value = 'URL中缺少车辆ID，无法获取使用履历。'
      usageRecords.value = []
      return
    }

    const success = await carStore.fetchUsageHistory({
      page: currentPage.value,
      size: pageSize.value,
      carId: finalId,
    })

    if (success) {
      usageRecords.value = carStore.usageHistoryList
    } else {
      errorMsg.value = carStore.errorMsg || '获取车辆使用履历失败，请稍后重试。'
      usageRecords.value = []
    }
  } catch (error) {
    errorMsg.value =
      '获取车辆使用履历时出错，请稍后重试。' +
      (error instanceof Error ? `错误信息：${error.message}` : '')
    usageRecords.value = []
  } finally {
    carStore.isLoading = false
  }
}

/**
 * 切换页码
 * @param page 要跳转的页码
 */
const changePage = (page: number) => {
  loadUsageRecords({ page })
}

onMounted(async () => {
  // 1. 获取车辆详情，用于展示标题
  if (routeCarId) {
    car.value = await carStore.getCarDetails(Number(routeCarId))
  }
  // 2. 加载使用履历
  await loadUsageRecords({})
})

const goBack = () => {
  router.push({ name: 'car-query' })
}
</script>

<template>
  <div class="usage-history-page">
    <!-- 页面标题 -->
    <div class="header-group">
      <h2 class="page-title">车辆使用履历</h2>
      <p v-if="car" class="car-info">
        车辆编号: <span class="car-number">{{ car.carNumber }}</span>
      </p>
      <p v-else-if="routeCarId" class="car-info gray">
        车辆ID: <span class="car-number">{{ routeCarId }}</span>
      </p>
      <!-- 返回按钮 -->
      <el-button type="primary" icon="ArrowLeft" @click="goBack">返回列表</el-button>
    </div>

    <!-- 错误/加载提示 -->
    <el-alert
      v-if="carStore.isLoading"
      title="正在加载使用记录..."
      type="info"
      show-icon
      :closable="false"
      class="mb-4"
    />
    <el-alert
      v-else-if="errorMsg"
      :title="errorMsg"
      type="error"
      show-icon
      :closable="false"
      class="mb-4"
    />
    <el-alert
      v-else-if="!usageRecords.length"
      title="没有找到该车辆的使用历史记录。"
      type="warning"
      show-icon
      :closable="false"
      class="mb-4"
    />

    <!-- 履历表格 -->
    <el-table v-else :data="usageRecords" border stripe style="width: 100%" class="mb-4">
      <el-table-column prop="username" label="用户 ID" width="150" />
      <el-table-column label="乘车时间" width="200">
        <template #default="scope">
          {{ formatDateTime(scope.row.rideTime) }}
        </template>
      </el-table-column>
      <el-table-column label="降车时间" width="200">
        <template #default="scope">
          {{ scope.row.dropTime ? formatDateTime(scope.row.dropTime) : '进行中' }}
        </template>
      </el-table-column>
      <el-table-column label="乘车度数" width="150">
        <template #default="scope">
          {{ scope.row.rideAlcoholLevel != null ? scope.row.rideAlcoholLevel.toFixed(2) : '-' }}
        </template>
      </el-table-column>

      <el-table-column label="降车度数" width="150">
        <template #default="scope">
          {{ scope.row.dropAlcoholLevel != null ? scope.row.dropAlcoholLevel.toFixed(2) : '-' }}
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页控制 -->
    <el-pagination
      v-if="totalPages > 1"
      background
      layout="prev, pager, next"
      :page-count="totalPages"
      :current-page="currentPage"
      :disabled="carStore.isLoading"
      @current-change="changePage"
    />
  </div>
</template>

<style scoped>
.usage-history-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 24px;
}

.header-group {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 12px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.car-info {
  font-size: 16px;
  color: #409eff;
}

.car-info.gray {
  color: #909399;
}

.car-number {
  font-weight: 600;
}
</style>
