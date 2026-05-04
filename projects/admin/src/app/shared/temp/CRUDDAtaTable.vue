<script setup lang="ts">
// === Modules ===
import type { TypedSchema } from 'vee-validate'
import { Form, useForm } from 'vee-validate'

// === App ===
import type { DocumentNode } from 'graphql'
import type { DataTableHeader } from 'vuetify/lib/types.mjs'
import rawGraphQL from '../../graphql/index'

import type { Operations, OverrideObject, PagingConfig, QueryOptions } from '@/interfaces/globals'
import { getSubjectOperations } from '@/plugins/casl'
import { useConfirmStore } from '@/stores/confirm'
import { useSnackbarStore } from '@/stores/snackbar'
import type { ModelName, SortDirection } from '@/types/globals'
import { pluralizeModel } from '@/utils/pluralizeModel'

// todo: fix table select
// todo: fix header sortable or not

// === PROPS ===
interface Props {
  modelName: ModelName
  pagingConfig?: Partial<PagingConfig>
  queryOptions?: Partial<QueryOptions>
  allowedOperations?: Partial<Operations>
  hasSingle?: boolean
  headers: Partial<DataTableHeader>[]
  density?: 'default' | 'compact' | 'comfortable'
  override?: OverrideObject
  addValidationSchema?: TypedSchema<Record<string, any>>
  updateValidationSchema?: TypedSchema<Record<string, any>>
  readNestedKey?: string
  // showSelect?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  density: 'default',
  hasSingle: false,
  readNestedKey: 'getAll',

  // showSelect: false,
})

// === SLOTS ===
const slots = useSlots()

// === STORES ===
const { openSnackbar } = useSnackbarStore()
const { openConfirm } = useConfirmStore()

// === COMPOSABLES ===
const route = useRoute()
const { t } = useI18n()

const { executeQuery, executeLazyQuery, executeMutation } = useGraphQL()
const { isMobile } = useMobileView()

// === PROPS: Defaults ===
const defaultPagingConfig: PagingConfig = {
  limit: 10,
  page: 1,
  limits: [10],
}

const defaultQueryOptions: QueryOptions = {
  paging: true,
  search: true,
  sort: true,
}

const defaultAllowedOperations: Operations = {
  readSingle: false,
  add: false,
  update: false,
  delete: false,
}

const pagingConfig = reactive<PagingConfig>({
  ...defaultPagingConfig,
  ...props.pagingConfig,
})

const queryOptions = reactive<QueryOptions>({
  ...defaultQueryOptions,
  ...props.queryOptions,
})

const allowedOperations: ComputedRef<Operations> = computed(() => ({
  ...defaultAllowedOperations,
  ...getSubjectOperations(props.modelName),
  ...props.allowedOperations,
}))

const hasActions: ComputedRef<boolean> = computed(() => {
  return allowedOperations.value.update || allowedOperations.value.delete || allowedOperations.value.readSingle || !!slots.customActions
})

// === READ OPERATION ===
interface IReadState {
  loading: boolean
  data: any[]
  dataLength: number
  searchQuery: string
  order: {
    sortBy: string
    sortDirection: SortDirection
  }
}

const dataTable = reactive<IReadState>({
  loading: true,
  data: [],
  dataLength: 0,
  searchQuery: '',
  order: {
    sortBy: 'id',
    sortDirection: 'desc',
  },
})

// === READ OPERATION: Query ===
const { result: allData, loading: allDataLoading, error: allDataError, refetch: refetchAllData } = executeQuery(
  `GetAll${props.modelName}`,
  {
    ...props.override?.read,
    pagination: {
      take: pagingConfig.limit,
      skip: ((pagingConfig.page - 1) * pagingConfig.limit),
    },
  },
  { fetchPolicy: 'cache-and-network' },
)

watch(allDataLoading, val => {
  dataTable.loading = val
})

watch(allDataError, err => {
  if (err) {
    console.error(`[GraphQL Error]: ${err.message}`)
    openSnackbar('Failed to load data', 'error')
    dataTable.data = []
  }
})

const allModelQueryName = `${lowerFirst(props.modelName)}Query`
const allModelNestedKey = props.readNestedKey

watch(allData, val => {
  if (val && val[allModelQueryName] && val[allModelQueryName][allModelNestedKey]) {
    const dataResponse = val[allModelQueryName][allModelNestedKey]

    dataTable.data = dataResponse.data ?? dataResponse
    dataTable.dataLength = queryOptions.paging ? (dataResponse.pageInfo.totalCount ?? 0) : dataResponse.length
  }
})

// === PAGINATION WATCHERS ===
const searchDebounceDelay = 400 // in mille seconds

const debouncedSearch = useDebounceFn(() => {
  pagingConfig.page = 1
  refetchAllData({
    pagination: {
      filter: dataTable.searchQuery,
    },
  })
}, searchDebounceDelay)

watch(() => dataTable.searchQuery, debouncedSearch)

watch(() => dataTable.order.sortDirection, () => {
  let variables = {}
  if (dataTable.order.sortDirection) {
    variables = {
      pagination: {
        take: pagingConfig.limit,
        skip: (pagingConfig.page - 1) * pagingConfig.limit,
        order: {
          field: dataTable.order.sortBy,
          direction: dataTable.order.sortDirection?.toUpperCase(),
        },
      },
    }
  }
  else {
    variables = {
      pagination: {
        take: pagingConfig.limit,
        skip: (pagingConfig.page - 1) * pagingConfig.limit,
      },
    }
  }
  refetchAllData({
    ...variables,
  })
})

watch(
  () => [pagingConfig.page, pagingConfig.limit],
  () => {
    refetchAllData({
      pagination: {
        take: pagingConfig.limit,
        skip: (pagingConfig.page - 1) * pagingConfig.limit,
      },
    })
  })

// === CONDITIONAL CREATE OPERATION ===
interface IAddState {
  loading: boolean
  sidebarActive: boolean
  showLoadingRow: boolean
  openDiscardConfirm: () => void
}

let addForm: ReturnType<typeof useForm> | null = null
let addState: ReturnType<typeof reactive<IAddState>>
let createModel: (() => Promise<void>) | null = null
let openAddSidebar: ((itemId: string) => void) | null = null

const canAdd: ComputedRef<boolean> = computed(() => {
  return !!slots.addForm && !!props.addValidationSchema && allowedOperations.value.add
})

if (canAdd) {
  addForm = useForm({
    initialValues: useModelFactory(props.modelName),
    validationSchema: props.addValidationSchema,
    validateOnMount: false,
  })

  addState = reactive<IAddState>({
    loading: false,
    sidebarActive: false,
    showLoadingRow: false,
    openDiscardConfirm: () => {
      openConfirm({
        title: 'Discard Changes',
        confirmText: 'Discard',
        confirmColor: 'error',
        cancelColor: 'primary',
        persistent: true,
        onConfirm: () => {
          addState.sidebarActive = false
          if (addForm)
            addForm.resetForm()
        },
      })
    },
  })

  openAddSidebar = () => {
    addState.sidebarActive = true
  }

  // === CREATE OPERATION: Mutation ===
  const { mutate: createModelMutation, loading: createModelLoading, error: createModelError } = executeMutation(
    `Create${props.modelName}`,
  )

  watch(createModelLoading, val => {
    addState.loading = val
  })

  watch(createModelError, val => {
    openSnackbar(`An error happened while adding a ${props.modelName}.`, 'error')
    console.log(val)
  })

  createModel = async () => {
    if (addForm) {
      const valid = await addForm.validate()

      if (!valid) {
        openSnackbar(`Invalid create ${props.modelName} data.`, 'error')

        return
      }

      if (createModelMutation) {
        const result = await createModelMutation({
          ...props.override?.add?.outer,
          createInput: {
            ...mapFormValuesToInput(props.modelName, addForm.values),
            ...props.override?.add?.createInput,
          },
        })

        if (result?.data?.[`${lowerFirst(props.modelName)}Mutation`].create) {
          addForm.resetForm()
          openSnackbar(`${props.modelName} added successfully.`, 'success')
          refetchAllData()
          addState.sidebarActive = false
        }
      }
    }
  }
}

// === CONDITIONAL UPDATE OPERATION ===
interface IUpdateState {
  loading: boolean
  sidebarActive: boolean
  item: any
  itemId: string | null
  openDiscardConfirm: () => void
}

let updateForm: ReturnType<typeof useForm>
let updateState: ReturnType<typeof reactive<IUpdateState>>
let updateModel: (() => Promise<void>)
let openUpdateSidebar: ((itemId: string) => void)

const canUpdate: ComputedRef<boolean> = computed(() => {
  return !!slots.updateForm && !!props.updateValidationSchema && allowedOperations.value.update
})

if (canUpdate.value) {
  updateForm = useForm({
    validationSchema: props.updateValidationSchema,
    validateOnMount: false,
  })

  updateState = reactive<IUpdateState>({
    loading: false,
    sidebarActive: false,
    item: {},
    itemId: null,
    openDiscardConfirm: () => {
      openConfirm({
        title: 'Discard Changes',
        confirmText: 'Discard',
        confirmColor: 'error',
        cancelColor: 'primary',
        persistent: true,
        onConfirm: () => {
          updateState.sidebarActive = false
          if (updateForm)
            updateForm.resetForm()
        },
      })
    },
  })

  watch(
    () => updateState.item,
    (newItem: any) => {
      if (newItem && updateForm) {
        updateForm.resetForm({
          values: newItem,
        })
      }
    },
    { immediate: true },
  )

  // === UPDATE OPERATION: Mutation ===
  const { mutate: updateModelMutation, loading: updateModelLoading, error: updateModelError } = executeMutation(
    `Update${props.modelName}`,
  )

  watch(updateModelLoading, val => {
    updateState.loading = val
  })

  watch(updateModelError, val => {
    openSnackbar(`An error happened while updating ${props.modelName}.`, 'error')
    console.log(val)
  })

  updateModel = async () => {
    if (updateForm) {
      const valid = await updateForm.validate() && canUpdate.value

      if (!valid) {
        openSnackbar(`Invalid update ${props.modelName} data.`, 'error')

        return
      }

      const formValues = updateForm.values

      const updatedFields: Record<string, any> = {}

      for (const key in formValues) {
        // fix: this is hardcoded  till backend change it
        if (props.modelName === 'Product' && (key === 'category' || key === 'hashtags'))
          updatedFields[key] = formValues[key]

        if (updateForm.isFieldDirty(key))
          updatedFields[key] = formValues[key]
      }

      if (updateModelMutation && Object.keys(updatedFields).length !== 0) {
        const result = await updateModelMutation({
          [`${lowerFirst(props.modelName)}Id`]: updateState.item.id,
          ...props.override?.update?.outer,
          updateInput: {
            ...mapFormValuesToInput(props.modelName, updatedFields),
            ...props.override?.update?.updateInput,
          },
        })

        const updatedItem = result?.data?.[`${lowerFirst(props.modelName)}Mutation`].update
        if (updatedItem) {
          refetchAllData()
          openSnackbar(`${props.modelName} updated successfully.`, 'success')
          updateState.item = updatedItem
          updateState.sidebarActive = false
        }
      }
    }
  }

  // UPDATE OPERATION: Get item to update & open update sidebar
  const { load: readOne, result: readOneResult, loading: readOneLoading, error: readOneError } = executeLazyQuery(
    `GetOne${props.modelName}`,
  )

  watch(readOneLoading, val => {
    updateState.loading = val
  })

  watch(readOneError, err => {
    if (err) {
      console.error(`[GraphQL Error]: ${err.message}`)
      openSnackbar(`Failed to load ${props.modelName} for update`, 'error')
      updateState.item = {}
    }
  })

  const queryName = `${lowerFirst(props.modelName)}Query`
  const nestedKey = 'getOne'

  openUpdateSidebar = async (itemId: string) => {
    updateState.itemId = itemId
    updateState.sidebarActive = true

    await readOne(null, {
      [`${lowerFirst(props.modelName)}Id`]: itemId,
      ...props.override?.update?.readOne,
    })
  }

  watch(readOneResult, val => {
    if (
      val
    && val[queryName]
    && val[queryName][nestedKey]
    ) {
      const dataResponse = val[queryName][nestedKey]

      updateState.item = dataResponse
      updateState.sidebarActive = true
    }
  })
}

// === Warnings For Forms Functionality ===
watch([canAdd, canUpdate], () => {
  if (!canAdd.value && !allowedOperations.value.add) {
    console.warn('[CRUDServerDataTable][Add] Cannot enable "add" functionality due to:')
    if (!slots.addForm)
      console.warn('  • Missing updateForm template.')
    if (!props.addValidationSchema)
      console.warn('  • Missing `addValidationSchema` prop.')
  }

  if (!canUpdate.value && allowedOperations.value.update) {
    console.warn('[CRUDServerDataTable][Update] Cannot enable "update" functionality due to:')
    if (!slots.updateForm)
      console.warn('  • Missing updateForm template.')
    if (!props.updateValidationSchema)
      console.warn('  • Missing `updateValidationSchema` prop.')
  }
})

// === DELETE OPERATION ===
interface IDeleteState {
  loading: boolean
  itemId: null | string
  openDeleteConfirm: (itemId: string) => void
}

let deleteState: ReturnType<typeof reactive<IDeleteState>>
let deleteModel: (() => Promise<void>)

const GraphQL = rawGraphQL as Record<string, DocumentNode>

const canDelete = computed(() => {
  return !!GraphQL[`Delete${props.modelName}`] && allowedOperations.value.delete
})

if (canDelete.value) {
  deleteState = reactive<IDeleteState>({
    loading: false,
    itemId: null,
    openDeleteConfirm: (itemId: string) => {
      openConfirm({
        title: 'Confirm Delete',
        confirmText: 'Confirm',
        confirmColor: 'error',
        cancelColor: 'primary',
        persistent: true,
        onConfirm: () => {
          deleteState.itemId = itemId
          deleteModel()
        },
      })
    },
  })

  // === DELETE OPERATION: Mutation ===
  const { mutate: deleteModelMutation, loading: deleteModelLoading, error: deleteModelError } = executeMutation(
    `Delete${props.modelName}`,
  )

  watch(deleteModelLoading, val => {
    deleteState.loading = val
  })

  watch(deleteModelError, val => {
    openSnackbar(`An error happened while deleting ${props.modelName}.`, 'error')
    console.log(val)
  })

  deleteModel = async () => {
    if (!canDelete.value) {
      openSnackbar('You are not allowed to delete Models', 'error')

      return
    }

    if (deleteModelMutation) {
      const result = await deleteModelMutation({
        [`${lowerFirst(props.modelName)}Id`]: deleteState.itemId,
        ...props.override?.delete,
      })

      if (result?.data?.[`${lowerFirst(props.modelName)}Mutation`].delete) {
        refetchAllData()
        openSnackbar(`${props.modelName} was deleted successfully.`, 'success')
        deleteState.itemId = null
      }
    }
  }
}

const headers: ComputedRef<any> = computed(() => {
  const baseHeaders = props.headers.map(h => ({
    ...h,
    title: t(`table.headers.${props.modelName}.${h.key}`, h.title!),
  }))

  if (!hasActions.value || (!props.hasSingle && !canUpdate.value && !canDelete.value && !slots.customActions))
    return baseHeaders

  return [
    ...baseHeaders,
    {
      title: t('table.headers.actions', 'Actions'),
      key: 'actions',
      sortable: false,
      align: 'center',
    },
  ]
})

// === EXPOSED ===
defineExpose({
  refetchAll: refetchAllData,
})
</script>

<template>
  <!-- === Add Form === -->
  <CUFormSidebar
    v-if="canAdd && addForm"
    mode="add"
    :is-side-bar-active="addState.sidebarActive"
    :is-loading="addForm.meta.value.dirty && addState.loading"
    :disable-submit="!addForm.meta.value.dirty || !addForm.meta.value.valid"
    :disable-reset="!addForm.meta.value.dirty || addState.loading"
    :model-name="props.modelName"
    @close-sidebar="() => {
      if (addForm?.meta.value.dirty) {
        addState.openDiscardConfirm()
      }
      else {
        addForm?.resetForm()
        addState.sidebarActive = false
      }
    }"
    @submit-form="() => createModel ? addForm?.handleSubmit(createModel)() : null"
    @reset-form="addForm.resetForm"
  >
    <Form
      :validation-schema="props.addValidationSchema"
      :validate-on-mount="false"
    >
      <slot
        name="addForm"
        v-bind="addForm"
      ></slot>
    </Form>
  </CUFormSidebar>

  <!-- === Update Form === -->
  <CUFormSidebar
    v-if="canUpdate && updateForm"
    mode="update"
    :is-side-bar-active="updateState.sidebarActive"
    :is-loading="updateForm.meta.value.dirty && updateState?.loading"
    :disable-submit="!updateForm.meta.value.dirty || !updateForm.meta.value.valid"
    :disable-reset="!updateForm.meta.value.dirty || updateState?.loading"
    :model-name="props.modelName"
    @close-sidebar="updateForm.meta.value.dirty
      ? updateState.openDiscardConfirm()
      : updateState.sidebarActive = false"
    @submit-form="() => updateModel ? updateForm!.handleSubmit(updateModel)() : null"
    @reset-form="updateState.openDiscardConfirm"
  >
    <slot
      name="updateForm"
      v-bind="updateForm"
      :item="updateState.item"
    ></slot>
  </CUFormSidebar>

  <div class="border-t-sm border-b-sm d-flex flex-row flex-nowrap align-center justify-space-between pa-2 mb-4">
    <div class="d-flex flex-row flex-nowrap align-center ga-1">
      <span class="text-h5">{{ t(pluralizeModel(props.modelName), pluralizeModel(props.modelName)) }}</span>
    </div>
    <div class="d-flex flex-row flex-nowrap align-center ga-2">
      <VBtn
        v-if="canAdd"
        variant="flat"
        color="primary"
        @click="openAddSidebar"
      >
        {{ t('table.actions.add', 'Add') }}
      </VBtn>
    </div>
  </div>
  <VDataTableServer
    show-current-page
    hover
    :headers="headers"
    :items="dataTable.data"
    :loading="dataTable.loading || addState.loading || updateState?.loading"
    :density="props.density"
    :page="pagingConfig.page"
    :items-per-page="pagingConfig.limit"
    :items-length="dataTable.dataLength"
    :sort-by="[
      {
        key: dataTable.order.sortBy,
        order: dataTable.order.sortDirection,
      },
    ]"
    @update:sort-by="(val) => {
      if (val?.length) {
        dataTable.order.sortBy = val[0].key
        dataTable.order.sortDirection = val[0].order
      }
      else {
        dataTable.order.sortBy = ''
        dataTable.order.sortDirection = undefined
      }
    }"
    @update:page="val => pagingConfig.page = val"
    @update:items-per-page="val => { pagingConfig.limit = val; pagingConfig.page = 1 }"
  >
    <!-- Slot Above The Entire Table -->
    <template #top>
      <slot
        v-if="slots.top"
        name="table-top"
      />
      <VRow
        v-else
        class="px-4 py-2 mb-4"
      >
        <!-- Optional Top Slot -->
        <VCol
          v-if="slots.topPartialAbove"
          cols="12"
        >
          <slot name="topPartialAbove" />
        </VCol>

        <!-- Pagination + Search Controls -->
        <VCol
          v-if="queryOptions.paging || queryOptions.search"
          cols="12"
          md="6"
          class="d-flex align-center gap-4"
        >
          <div
            v-if="queryOptions?.paging"
            class="d-flex align-center gap-2"
          >
            <span>{{ t('table.pagination.show', 'Show') }}</span>
            <VSelect
              v-model="pagingConfig.limit"
              :items="[...pagingConfig.limits.filter(limit => limit < dataTable.dataLength), { title: `${t('table.pagination.all', 'All')}`, value: dataTable.dataLength }]"
              density="compact"
              hide-details
              style="max-inline-size: 90px;"
            />
            <span>{{ t('table.pagination.entries', 'entries') }}</span>
          </div>
        </VCol>

        <VCol
          v-if="queryOptions?.search"
          cols="12"
          md="6"
          class="d-flex justify-end"
        >
          <VTextField
            v-model="dataTable.searchQuery"
            :placeholder="`${t('table.pagination.search', 'Search in')} ${t(pluralizeModel(props.modelName), pluralizeModel(props.modelName))}`"
            prepend-inner-icon="tabler-search"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
            style=" inline-size: 100%;max-inline-size: 300px;"
          />
        </VCol>

        <!-- Optional Under Slot -->
        <VCol
          v-if="slots.topPartialUnder"
          cols="12"
        >
          <slot name="topPartialUnder" />
        </VCol>
      </VRow>

    </template>

    <template #item="{ item }">
      <!-- === Row-Wise Data Representation === -->
      <tr v-if="slots.read">
        <slot
          name="read"
          :item="item"
        />
        <!-- === Conditional Static Actions cell === -->
        <ResponsiveDataTableColumn
          v-if="hasActions"
          :is-mobile="isMobile"
        >
          <VRow class="d-flex flex-nowrap justify-center">
            <slot
              name="customActions"
              :item="item"
            ></slot>

            <!-- View -->
            <VTooltip
              :text="t('table.actions.view', 'View')"
              location="top"
              hover
            >
              <template #activator="{ props: tooltip }">
                <VBtn
                  v-if="allowedOperations.readSingle && props.hasSingle"
                  v-bind="tooltip"
                  :to="{ name: `${normalizeRouteName(route.fullPath)}-id`, params: { id: item.id } }"
                  icon
                  color="info"
                  variant="plain"
                >
                  <VIcon icon="tabler-eye" />
                </VBtn>
              </template>
            </VTooltip>

            <!-- Edit -->
            <VTooltip
              :text="t('table.actions.edit', 'Edit')"
              location="top"
              hover
            >
              <template #activator="{ props: tooltip }">
                <VBtn
                  v-if="canUpdate"
                  v-bind="tooltip"
                  icon
                  color="primary"
                  variant="plain"
                  @click="openUpdateSidebar ? openUpdateSidebar(item.id) : null"
                >
                  <VIcon icon="tabler-edit" />
                </VBtn>
              </template>
            </VTooltip>

            <!-- Delete -->
            <VTooltip
              :text="t('table.actions.delete', 'Delete')"
              location="top"
              hover
            >
              <template #activator="{ props: tooltip }">
                <VBtn
                  v-if="canDelete"
                  v-bind="tooltip"
                  icon
                  color="error"
                  variant="plain"
                  @click="deleteState.openDeleteConfirm(item.id)"
                >
                  <VIcon icon="tabler-trash" />
                </VBtn>
              </template>
            </VTooltip>

          </VRow>
        </ResponsiveDataTableColumn>
      </tr>

      <!-- === Column-Wise Data Representation === -->
      <tr v-else>
        <ResponsiveDataTableColumn
          v-for="header in headers"
          :key="header.key"
          :label="header.key"
          :is-mobile="isMobile"
        >
          <slot
            v-if="slots[`item.${header.key}`]"
            :name="`item.${header.key}`"
            :item="item"
          />

          <!-- === Conditional Static Actions cell === -->
          <span v-else-if="(hasActions && header.key === 'actions')">
            <VRow class="d-flex flex-nowrap justify-center">

              <slot
                name="customActions"
                :item="item"
              ></slot>

              <!-- View -->
              <VTooltip
                :text="t('table.actions.view', 'View')"
                location="top"
                hover
              >
                <template #activator="{ props: tooltip }">
                  <VBtn
                    v-if="allowedOperations.readSingle && props.hasSingle"
                    v-bind="tooltip"
                    :to="{ name: `${normalizeRouteName(route.fullPath)}-id`, params: { id: item.id } }"
                    icon
                    color="info"
                    variant="plain"
                  >
                    <VIcon icon="tabler-eye" />
                  </VBtn>
                </template>
              </VTooltip>

              <!-- Edit -->
              <VTooltip
                :text="t('table.actions.edit', 'Edit')"
                location="top"
                hover
              >
                <template #activator="{ props: tooltip }">
                  <VBtn
                    v-if="canUpdate"
                    v-bind="tooltip"
                    icon
                    color="primary"
                    variant="plain"
                    @click="openUpdateSidebar ? openUpdateSidebar(item.id) : null"
                  >
                    <VIcon icon="tabler-edit" />
                  </VBtn>
                </template>
              </VTooltip>

              <!-- Delete -->
              <VTooltip
                :text="t('table.actions.delete', 'Delete')"
                location="top"
                hover
              >
                <template #activator="{ props: tooltip }">
                  <VBtn
                    v-if="canDelete"
                    v-bind="tooltip"
                    icon
                    color="error"
                    variant="plain"
                    @click="deleteState.openDeleteConfirm(item.id)"
                  >
                    <VIcon icon="tabler-trash" />
                  </VBtn>
                </template>
              </VTooltip>

            </VRow>
          </span>

          <!-- === Column-Wise: Fallback Data Representation Slot === -->
          <span v-else>{{ (item as any)[header.key] }}</span>
        </ResponsiveDataTableColumn>
      </tr>
    </template>

    <template #bottom="{ page, itemsPerPage, pageCount, setItemsPerPage }">
      <slot
        v-if="slots.bottom"
        name="bottom"
        :table-data="{ page, itemsPerPage, pageCount, setItemsPerPage }"
      />
      <VCardText
        v-else
        class="pt-2"
      >
        <div class="d-flex flex-wrap align-center justify-sm-space-between gap-y-2 mt-2">
          <span>
            {{ `${t('table.pagination.showing', 'showing')} ${dataTable.dataLength > 0 ? (page - 1) * itemsPerPage + 1 : 0} ${t('table.pagination.to', 'to')} ${Math.min(page * itemsPerPage, dataTable.dataLength)} ${t('table.pagination.of', 'of')} ${dataTable.dataLength} ${t('table.pagination.secondary-entries', 'entries')}` }}
          </span>

          <VPagination
            v-if="queryOptions?.paging"
            v-model="pagingConfig.page"
            :total-visible="dataTable.dataLength"
            :length="Math.ceil(dataTable.dataLength / pagingConfig.limit)"
          />
        </div>
      </VCardText>
    </template>
  </VDataTableServer>
</template>
