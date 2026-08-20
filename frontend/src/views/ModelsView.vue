<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { modelsApi } from '../api'
import type { ModelPackage, PackageVersion } from '../api/types'
import ExpandTransition from '../components/ExpandTransition.vue'

const props = defineProps<{ loggedIn: boolean }>()

const message = useMessage()
const models = ref<ModelPackage[]>([])
const activeModelId = ref<number | null>(null)
const versions = ref<PackageVersion[]>([])
const versionForm = ref({ version: '', changelog: '' })
const uploadFile = ref<File | null>(null)

async function load() {
  const data = await modelsApi.list()
  models.value = data.items
}

defineExpose({ reload: load })

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  uploadFile.value = input.files?.[0] ?? null
}

async function toggleVersions(model: ModelPackage) {
  if (activeModelId.value === model.id) {
    activeModelId.value = null
    return
  }
  activeModelId.value = model.id
  versions.value = await modelsApi.versions(model.id)
}

async function uploadVersion(modelId: number) {
  try {
    if (!uploadFile.value || !versionForm.value.version) {
      message.warning('请选择文件并填写版本号')
      return
    }
    const formData = new FormData()
    formData.append('file', uploadFile.value)
    formData.append('version', versionForm.value.version)
    if (versionForm.value.changelog) {
      formData.append('changelog', versionForm.value.changelog)
    }
    await modelsApi.uploadVersion(modelId, formData)
    message.success('版本上传成功')
    versionForm.value = { version: '', changelog: '' }
    uploadFile.value = null
    versions.value = await modelsApi.versions(modelId)
    const data = await modelsApi.list()
    models.value = data.items
  } catch (e) {
    message.error((e as Error).message)
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <!-- 模型包网格 -->
    <section>
      <h2
        class="mb-3 flex items-center gap-2 text-lg font-semibold"
        style="color: var(--ink)"
      >
        模型包列表
        <span
          class="rounded-full px-2 py-0.5 text-xs font-medium"
          style="background: var(--sage-soft); color: #4d6547"
        >
          {{ models.length }}
        </span>
      </h2>
      <n-empty v-if="!models.length" description="暂无模型包，点击右下角创建一个吧" class="py-10" />
      <div v-else class="grid gap-4 lg:grid-cols-2">
        <n-card
          v-for="(m, i) in models"
          :key="m.id"
          size="small"
          class="lift-card animate-card-in"
          :style="{ animationDelay: `${Math.min(i, 8) * 70}ms` }"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-3">
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 hover:rotate-6 hover:scale-110"
                style="background: var(--sage-soft); color: var(--sage)"
              >
                <svg
                  width="20"
                  height="20"
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
              </span>
              <div class="min-w-0">
                <div class="truncate font-medium" style="color: var(--ink)">
                  {{ m.name }}
                </div>
                <div
                  class="mt-0.5 flex flex-wrap items-center gap-2 text-xs"
                  style="color: var(--muted)"
                >
                  {{ m.author.username }}
                  <span
                    class="rounded-full px-2 py-px"
                    style="background: var(--sage-soft); color: #4d6547"
                  >
                    {{ m.category.name }}
                  </span>
                  <span
                    class="rounded-full px-2 py-px"
                    style="background: var(--accent-soft); color: var(--accent-pressed)"
                  >
                    下载 {{ m.downloadCount }}
                  </span>
                </div>
              </div>
            </div>
            <n-button
              size="small"
              :quaternary="activeModelId !== m.id"
              :tertiary="activeModelId === m.id"
              round
              class="pressable shrink-0"
              @click="toggleVersions(m)"
            >
              {{ activeModelId === m.id ? '收起' : '版本' }}
            </n-button>
          </div>

          <ExpandTransition>
            <div v-if="activeModelId === m.id">
              <div class="mt-4 border-t pt-4" style="border-color: var(--line)">
                <div v-if="versions.length" class="mb-3 space-y-2">
                  <div
                    v-for="(v, vi) in versions"
                    :key="v.id"
                    class="animate-card-in flex items-center justify-between rounded-xl px-3 py-2.5 text-sm"
                    :style="{
                      background: 'var(--surface-soft)',
                      animationDelay: `${vi * 50}ms`,
                    }"
                  >
                    <span style="color: #4a4238">
                      <span
                        class="mr-2 rounded-md px-1.5 py-0.5 text-xs font-semibold"
                        style="background: var(--sage-soft); color: #4d6547"
                      >
                        v{{ v.version }}
                      </span>
                      {{ (v.fileSize / 1024).toFixed(1) }} KB · 下载 {{ v.downloadCount }}
                    </span>
                    <a
                      :href="modelsApi.downloadUrl(m.id, v.id)"
                      class="pressable rounded-full px-3 py-1 text-xs font-medium text-white no-underline transition-colors"
                      style="background: var(--sage)"
                      onmouseover="this.style.background='#68825f'"
                      onmouseout="this.style.background='var(--sage)'"
                    >
                      下载
                    </a>
                  </div>
                </div>
                <div v-else class="mb-3 text-sm" style="color: var(--muted)">
                  暂无版本
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <n-input
                    v-model:value="versionForm.version"
                    placeholder="版本号（如 1.0.0）"
                    size="small"
                    style="width: 150px"
                  />
                  <n-input
                    v-model:value="versionForm.changelog"
                    placeholder="更新说明"
                    size="small"
                    style="width: 190px"
                  />
                  <label class="file-drop">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span class="max-w-32 truncate">
                      {{ uploadFile?.name ?? '选择文件' }}
                    </span>
                    <input type="file" class="hidden" @change="onFileChange" />
                  </label>
                  <n-button
                    size="small"
                    type="primary"
                    round
                    class="pressable"
                    :disabled="!props.loggedIn"
                    @click="uploadVersion(m.id)"
                  >
                    上传版本
                  </n-button>
                </div>
              </div>
            </div>
          </ExpandTransition>
        </n-card>
      </div>
    </section>
  </div>
</template>
