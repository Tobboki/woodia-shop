<script lang="ts" setup>
import { Icon } from '@iconify/vue/dist/iconify.js'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'

// === Props ===
interface Props {
  isSideBarActive: boolean
  mode?: 'add' | 'update'
  title?: string
  modelName?: string
  isLoading?: boolean
  submitText?: string
  disableSubmit?: boolean
  disableReset?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'add',
  modelName: 'item',
  isLoading: false,
  disableSubmit: true,
  disableReset: true,
})

// === Emits ===
const emit = defineEmits(['closeSidebar', 'submitForm', 'resetForm'])

// === Composables ===
const { t } = useI18n()

// === Logic ===
const title = computed(() => {
  if (props.title)
    return props.title

  return props.mode === 'add'
    ? `${t('table.actions.add', 'Add')} ${t(`singular-model.${separateCamelCase(props.modelName)}`, separateCamelCaseWithWhitespace(props.modelName))}`
    : `${t('table.actions.edit', 'Edit')} ${t(`singular-model.${separateCamelCase(props.modelName)}`, separateCamelCaseWithWhitespace(props.modelName))}`
})

const buttonText = computed(() => {
  if (props.submitText)
    return props.submitText

  return props.mode === 'add'
    ? t('table.actions.add', 'Add')
    : t('table.actions.edit', 'edit')
})

const isSidebarActiveLocal = computed({
  get: () => props.isSideBarActive,
  set: val => {
    if (!val)
      emit('closeSidebar')
  },
})
</script>

<template>
  <VNavigationDrawer
    v-model="isSidebarActiveLocal"
    :mobile="false"
    :width="400"
    disable-route-watcher
    disable-resize-watcher
    location="right"
    temporary
    class="pt-2"
  >
    <VRow
      class="pa-2"
      align="center"
      justify="space-between"
    >
      <VCol cols="auto">
        <h4 class="h4">
          {{ title }}
        </h4>
      </VCol>

      <VCol cols="auto">
        <IconBtn
          class="border rounded"
          @click="emit('closeSidebar')"
        >
          <Icon icon="mdi:close" />
        </IconBtn>
      </VCol>
    </VRow>

    <VDivider />

    <PerfectScrollbar style="height: calc(100vh - 200px)">
      <div class="pa-4">
        <slot></slot>
      </div>
    </PerfectScrollbar>

    <VDivider />

    <div class="w-full mt-6 px-2 d-flex align-center justify-space-between ga-2">
      <VBtn
        class="flex-grow-1"
        :loading="isLoading"
        :disabled="disableSubmit"
        color="primary"
        @click="emit('submitForm')"
      >
        {{ buttonText }}
      </VBtn>

      <VBtn
        class="flex-grow-1"
        :disabled="disableReset"
        variant="outlined"
        color="secondary"
        @click="emit('resetForm')"
      >
        {{ t('table.actions.custom.reset', 'Reset') }}
      </VBtn>
    </div>
  </VNavigationDrawer>
</template>
