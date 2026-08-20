<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { communityApi, modelsApi } from '../api'
import type { Category } from '../api/types'

type Board = 'community' | 'models'

const props = defineProps<{ show: boolean; loggedIn: boolean }>()
const emit = defineEmits<{
  (e: 'update:show', v: boolean): void
  (e: 'published', board: Board): void
}>()

const message = useMessage()
const board = ref<Board>('community')
const loading = ref(false)

const communityCategories = ref<Category[]>([])
const modelCategories = ref<Category[]>([])
const postForm = ref({ title: '', content: '', categoryId: null as number | null })
const modelForm = ref({ name: '', categoryId: null as number | null })

const communityOptions = computed(() =>
  communityCategories.value.map((c) => ({ label: c.name, value: c.id })),
)
const modelOptions = computed(() =>
  modelCategories.value.map((c) => ({ label: c.name, value: c.id })),
)

function close() {
  emit('update:show', false)
}

async function submit() {
  if (!props.loggedIn) {
    message.warning('请先登录')
    return
  }
  loading.value = true
  try {
    if (board.value === 'community') {
      if (!postForm.value.categoryId) {
        message.warning('请选择分类')
        return
      }
      await communityApi.createPost({
        title: postForm.value.title,
        content: postForm.value.content,
        categoryId: postForm.value.categoryId,
      })
      message.success('发帖成功')
      postForm.value = { title: '', content: '', categoryId: null }
    } else {
      if (!modelForm.value.categoryId) {
        message.warning('请选择分类')
        return
      }
      await modelsApi.create({
        name: modelForm.value.name,
        categoryId: modelForm.value.categoryId,
        status: 'PUBLISHED',
      })
      message.success('模型包创建成功')
      modelForm.value = { name: '', categoryId: null }
    }
    emit('published', board.value)
    close()
  } catch (e) {
    message.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const [cc, mc] = await Promise.all([
    communityApi.categories(),
    modelsApi.categories(),
  ])
  communityCategories.value = cc
  modelCategories.value = mc
})
</script>

<template>
  <n-modal :show="props.show" @update:show="emit('update:show', $event)">
    <n-card
      class="w-full max-w-lg"
      :bordered="false"
      role="dialog"
      aria-modal="true"
      style="border-radius: 20px; background: var(--surface)"
    >
      <!-- 标题 + 关闭按钮 -->
      <div class="mb-4 flex items-center gap-2.5">
        <span
          class="flex h-9 w-9 items-center justify-center rounded-xl text-white"
          style="background: linear-gradient(135deg, #d2613c, #e8935c)"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </span>
        <div class="flex-1">
          <div class="font-bold" style="color: var(--ink)">发布新内容</div>
          <div class="text-xs" style="color: var(--muted)">选择板块，分享给大家</div>
        </div>
        <button
          class="modal-close pressable"
          aria-label="关闭"
          @click="close"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- 板块分段切换：滑动指示块 -->
      <div
        class="relative mb-5 grid grid-cols-2 rounded-full p-1"
        style="background: var(--surface-soft)"
      >
        <span
          class="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full shadow-sm transition-transform duration-300"
          style="
            left: 4px;
            background: var(--accent);
            transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
          "
          :style="{ transform: board === 'community' ? 'translateX(0)' : 'translateX(100%)' }"
        />
        <button
          class="relative z-10 flex items-center justify-center gap-1.5 rounded-full py-1.5 text-sm transition-colors duration-300"
          :style="{ color: board === 'community' ? '#fff' : 'var(--muted)' }"
          @click="board = 'community'"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          社区帖子
        </button>
        <button
          class="relative z-10 flex items-center justify-center gap-1.5 rounded-full py-1.5 text-sm transition-colors duration-300"
          :style="{ color: board === 'models' ? '#fff' : 'var(--muted)' }"
          @click="board = 'models'"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
            />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          模型包
        </button>
      </div>

      <!-- 表单区域：板块切换时淡入 -->
      <Transition name="fade" mode="out-in">
        <div v-if="board === 'community'" key="community" class="space-y-3">
          <n-input
            v-model:value="postForm.title"
            placeholder="标题"
            size="large"
          />
          <n-input
            v-model:value="postForm.content"
            type="textarea"
            placeholder="内容（Markdown）"
            :rows="4"
          />
          <n-select
            v-model:value="postForm.categoryId"
            :options="communityOptions"
            placeholder="选择分类"
            size="large"
          />
        </div>
        <div v-else key="models" class="space-y-3">
          <n-input
            v-model:value="modelForm.name"
            placeholder="模型包名称"
            size="large"
          />
          <n-select
            v-model:value="modelForm.categoryId"
            :options="modelOptions"
            placeholder="选择分类"
            size="large"
          />
          <p class="text-xs" style="color: var(--muted)">
            创建成功后，可在模型包详情中上传版本文件
          </p>
        </div>
      </Transition>

      <!-- 提交区：分隔线 + 充足留白，与上方表单拉开距离 -->
      <div class="mt-8 border-t pt-6" style="border-color: var(--line)">
        <n-button
          type="primary"
          block
          round
          size="large"
          class="pressable"
          :loading="loading"
          :disabled="!props.loggedIn"
          @click="submit"
        >
          {{ props.loggedIn ? '发布' : '请先登录' }}
        </n-button>
      </div>
    </n-card>
  </n-modal>
</template>
