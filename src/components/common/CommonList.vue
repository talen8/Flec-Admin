<template>
    <div class="common-list">
        <el-card>
            <!-- 工具栏 -->
            <div class="toolbar">
                <h2>{{ title }}</h2>
                <div class="actions">
                    <!-- 前工具栏 -->
                    <slot name="toolbar-before" />
                    <el-button v-if="showCreate" type="primary" @click="$emit('create')">
                        <el-icon>
                            <Plus />
                        </el-icon>
                        {{ createText }}
                    </el-button>
                    <!-- 后工具栏 -->
                    <slot name="toolbar-after" />
                    <el-button @click="$emit('refresh')">
                        <el-icon>
                            <Refresh />
                        </el-icon>
                    </el-button>
                </div>
            </div>

            <!-- 额外内容 -->
            <slot name="extra" />

            <!-- 表格 - 完全由外部控制 -->
            <el-table v-loading="loading" :data="data" border
                :height="showPagination ? 'calc(100vh - 240px)' : 'calc(100vh - 188px)'" v-bind="$attrs">
                <slot />
            </el-table>

            <!-- 分页 -->
            <div v-if="showPagination" class="pagination">
                <el-pagination :current-page="page" :page-size="pageSize" :page-sizes="[10, 20, 50, 100]" :total="total"
                    layout="total, sizes, prev, pager, next" @current-change="$emit('update:page', $event)"
                    @size-change="$emit('update:pageSize', $event)" />
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { Plus, Refresh } from '@element-plus/icons-vue'

withDefaults(defineProps<{
    title: string
    data: any[]
    loading?: boolean
    total?: number
    page?: number
    pageSize?: number
    showPagination?: boolean
    showCreate?: boolean
    createText?: string
}>(), {
    loading: false,
    total: 0,
    page: 1,
    pageSize: 10,
    showPagination: true,
    showCreate: true,
    createText: '新增'
})

defineEmits<{
    create: []
    refresh: []
    'update:page': [page: number]
    'update:pageSize': [size: number]
}>()
</script>

<style scoped lang="scss">
.common-list {
    .toolbar {
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        h2 {
            margin: 0;
            font-size: 20px;
            font-weight: 500;
        }

        .actions {
            display: flex;
            gap: 12px;
        }
    }

    .pagination {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
    }
}
</style>
