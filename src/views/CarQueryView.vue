<script setup lang="ts">
import { useCarStore, type Car } from '@/stores/carStore'
import { useAuthStore } from '@/stores/auth'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
//import PageNavigation from '@/components/PageNavigation.vue'

const router = useRouter()

/**
 * 搜索框内容
 * 用于输入“车牌号关键字”
 */
const carNumber = ref<string>('')

/**
 * 当前页码与每页大小
 * 用于分页查询
 */
const currentPage = ref(1)
const pageSize = ref(10)

/**
 * Pinia：车辆 store
 */
const carStore = useCarStore()

/**
 * Pinia：用户认证 store
 * 用于判断用户身份、是否登录、用户 ID 等
 */
const authStore = useAuthStore()

/**
 * 当前 hover 或选中的车辆 ID
 * 用于显示“履历”按钮（只有 hover 时显示）
 */
const selectedCarId = ref<number | null>(null)

/**
 * 当前用户是否是管理员
 * role === 1 → 管理员
 */
const isAdmin = computed(() => authStore.role === 1)

/**
 * 控制「新增车辆」弹窗是否显示
 */
const showAddCarModal = ref(false)

/**
 * 新增车辆输入框
 */
const newCarNumber = ref('')

/**
 * 组件加载时触发
 * → 自动获取第一页车辆数据
 */
onMounted(() => {
  carListData()
})

/**
 * 获取车辆分页数据
 * - page: 页码
 * - size: 每页数量
 * - keywords: 搜索关键字（车牌号）
 */
const carListData = (
  page = currentPage.value,
  size = pageSize.value,
  keywords = carNumber.value,
) => {
  // 更新当前页码与页尺寸（双向绑定分页按钮）
  currentPage.value = page
  pageSize.value = size

  // 调用 store 中的方法向后端发请求
  carStore.fetchCarList({
    page: currentPage.value,
    size: pageSize.value,
    keyword: keywords,
  })
}

/**
 * 点击“查询”按钮触发
 * - 从第一页重新查
 */
const performSearch = () => {
  carListData(1, pageSize.value, carNumber.value)
}

/**
 * 切换分页
 * - 页码不能越界
 */
const changePage = (page: number) => {
  carListData(page, pageSize.value, carNumber.value)
}

/**
 * 提交新增车辆
 */
const submitAddCar = async () => {
  // 前端校验：输入不能为空
  if (!newCarNumber.value.trim()) {
    carStore.errorMsg = '车辆编号不能为空'
    return
  }

  // 调用 store 添加车辆
  const success = await carStore.addCar(newCarNumber.value.trim())

  // 若成功则关闭弹窗清空输入
  if (success) closeAddCarModal()
}

/**
 * 关闭新增车辆弹窗
 */
const closeAddCarModal = () => {
  showAddCarModal.value = false
  newCarNumber.value = ''
  carStore.errorMsg = null
}

/**
 * 根据车辆状态，返回展示信息（文字 + 样式类）
 * 用于不同状态显示不同颜色
 *
 * 状态含义：
 * - 0 → 空闲（绿色）
 * - 1 → 被当前用户使用（蓝色）
 * - 1 → 被其他用户使用（橙色）
 */
const statusInfo = (car: Car) => {
  if (car.status === 0) return { text: '空闲', class: 'success' }
  if (car.status === 1 && car.currentUserId === authStore.userId)
    return { text: '乗車中', class: 'info' }
  return { text: '使用中', class: 'warning' }
}

/**
 * 跳转到车辆操作页面（乘车 / 降车）
 * 通过 query 传递完整车辆对象
 */
const toOperation = (car: Car) => {
  router.push({
    name: 'car-operation',
    query: { car: JSON.stringify(car) }, // 使用 JSON 传输对象
  })
}

/**
 * 跳转到车辆使用履历页面
 */
const toUsage = (carId: number) => {
  router.push({
    name: 'usage-history',
    query: { carId: carId },
  })
}
</script>

<template>
  <div class="car-page">
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form inline @submit.prevent="performSearch">
        <el-form-item>
          <el-input v-model="carNumber" placeholder="请输入车牌号关键字" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="carStore.isLoading" @click="performSearch">
            查询
          </el-button>
        </el-form-item>
        <el-form-item v-if="isAdmin">
          <el-button type="success" @click="showAddCarModal = true">+ 新增车辆</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 车辆列表：一排排竖着展示 -->
    <div class="car-list">
      <el-card
        v-for="car in carStore.carList"
        :key="car.id"
        shadow="hover"
        class="car-item"
        @mouseenter="selectedCarId = car.id"
        @mouseleave="selectedCarId = null"
      >
        <div class="car-header">
          <!-- 左侧：履历按钮 -->
          <div class="left">
            <el-button
              v-if="selectedCarId === car.id"
              type="primary"
              size="small"
              @click.stop="toUsage(car.id)"
            >
              履历
            </el-button>
          </div>

          <!-- 右侧：状态标签（始终固定在右边） -->
          <div class="right">
            <el-tag :type="statusInfo(car).class">{{ statusInfo(car).text }}</el-tag>
          </div>
        </div>

        <div class="car-body">
          <span class="car-number">{{ car.carNumber }}</span>
          <div class="car-actions">
            <el-button
              type="primary"
              size="small"
              :disabled="car.status !== 0"
              @click="toOperation(car)"
            >
              乘车
            </el-button>
            <el-button
              type="warning"
              size="small"
              :disabled="car.currentUserId !== authStore.userId || car.status === 0"
              @click="toOperation(car)"
            >
              降车
            </el-button>
            <el-button v-if="isAdmin" type="default" size="small">修改</el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 分页 -->
    <el-pagination
      v-if="carStore.pagination.pages > 1"
      background
      layout="prev, pager, next"
      :page-count="carStore.pagination.pages"
      :current-page="currentPage"
      @current-change="changePage"
      class="pagination"
    />

    <!-- 新增车辆弹窗 -->
    <el-dialog title="新增车辆" v-model="showAddCarModal" width="400px">
      <el-form @submit.prevent="submitAddCar">
        <el-form-item label="车牌号">
          <el-input v-model="newCarNumber" placeholder="输入车牌号" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitAddCar">提交</el-button>
          <el-button @click="closeAddCarModal">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<style scoped>
.car-page {
  min-height: 100vh;
  background-color: #f0f2f5;
  padding: 24px;
}

.search-card {
  margin-bottom: 20px;
}

.car-list {
  display: flex;
  flex-direction: column;
  gap: 16px; /* 卡片之间的间距 */
}

.car-item {
  border-radius: 12px;
}

.car-header {
  display: flex;
  justify-content: space-between; /* 左右分布 */
  align-items: center;
  margin-bottom: 12px;
}

.car-header .left {
  min-height: 28px; /* 给左侧一个固定高度占位，避免右侧跑位 */
  display: flex;
  align-items: center;
}

.car-header .right {
  display: flex;
  align-items: center;
}

.car-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.car-number {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.car-actions {
  display: flex;
  gap: 8px;
}
</style>
