<template>
  <div class="codemirror-editor-wrapper" :class="{ 'is-fullscreen': isBrowserFullscreen || isPageFullscreen }">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <template v-for="(item, index) in toolbarItems" :key="index">
        <div v-if="item.type === 'divider'" class="toolbar-divider"></div>

        <!-- 弹性空间 -->
        <div v-else-if="item.type === 'spacer'" class="toolbar-spacer"></div>

        <!-- 普通按钮 -->
        <button v-else @click="item.action" :title="item.title" :class="{ active: item.isActive?.() }"
          class="toolbar-btn">
          <i v-if="item.icon" :class="item.icon"></i>
          <span v-else>{{ item.label }}</span>
        </button>
      </template>

      <input ref="imageInputRef" type="file" accept="image/*" multiple style="display: none"
        @change="handleImageSelect" />
    </div>

    <!-- 编辑器主体 -->
    <div class="editor-container">
      <!-- 编辑器面板 -->
      <div ref="editorPaneRef" class="editor-pane" :class="{
        'full-width': viewMode === 'editor',
        'hidden': viewMode === 'preview'
      }" @scroll="handleEditorScroll">
        <div ref="editorRef"></div>
      </div>

      <!-- 预览面板 -->
      <div v-if="viewMode !== 'editor'" ref="previewPaneRef" class="preview-pane" :class="{
        'full-width': viewMode === 'preview',
        'html-mode': viewMode === 'html'
      }" @scroll="handlePreviewScroll">
        <div v-if="viewMode === 'html'" class="html-code">
          <pre><code>{{ renderedHtml }}</code></pre>
        </div>
        <div v-else class="markdown-content" v-html="renderedHtml"></div>
      </div>

      <!-- 目录面板 -->
      <div v-if="showToc" class="toc-pane">
        <div class="toc-header">
          <span>目录</span>
          <button @click="showToc = false" class="toc-close">
            <i class="ri-close-line"></i>
          </button>
        </div>
        <div class="toc-content">
          <div v-for="(heading, index) in tableOfContents" :key="index" :class="`toc-item toc-level-${heading.level}`"
            @click="scrollToHeading(heading)">
            {{ heading.text }}
          </div>
          <div v-if="tableOfContents.length === 0" class="toc-empty">
            暂无目录
          </div>
        </div>
      </div>
    </div>

    <!-- 页脚 -->
    <div class="editor-footer">
      <div class="footer-left">
        <span class="word-count">字数：{{ wordCount }}</span>
        <span class="reading-time">阅读时长：{{ readingTime }} 分钟</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadFile } from '@/api/file'
import { renderMarkdown, countWords, extractToc, estimateReadingTime, type TocItem } from '@/utils/markdown'
import { EditorView, keymap } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'

// 类型定义
interface ToolbarItem {
  type?: 'divider' | 'spacer'
  icon?: string
  label?: string
  title?: string
  action?: () => void
  isActive?: () => boolean
}

type ViewMode = 'split' | 'editor' | 'preview' | 'html'

// 常量
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

const props = withDefaults(defineProps<{ modelValue: string }>(), { modelValue: '' })
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

// Refs
const editorRef = ref<HTMLElement>()
const editorPaneRef = ref<HTMLElement>()
const previewPaneRef = ref<HTMLElement>()
const imageInputRef = ref<HTMLInputElement>()
const viewMode = ref<ViewMode>('split')
const syncScroll = ref(true)
const isBrowserFullscreen = ref(false)  // 浏览器全屏
const isPageFullscreen = ref(false)  // CSS 页面全屏
const showToc = ref(false)

// 编辑器实例和同步状态
let editorView: EditorView | null = null
let isSyncingEditor = false
let isSyncingPreview = false

const renderedHtml = computed(() => renderMarkdown(props.modelValue))

// 计算字数
const wordCount = computed(() => countWords(props.modelValue))

// 计算阅读时长
const readingTime = computed(() => estimateReadingTime(props.modelValue))

// 提取目录
const tableOfContents = computed<TocItem[]>(() => {
  return extractToc(props.modelValue)
})

// ==================== 编辑器操作 ====================

// 插入文本到光标位置
const insertText = (before: string, after = '') => {
  if (!editorView) return
  const { from, to } = editorView.state.selection.main
  const text = editorView.state.doc.sliceString(from, to)

  // 如果有选中文本，用语法包裹；否则只插入语法，光标定位在中间
  editorView.dispatch({
    changes: { from, to, insert: `${before}${text}${after}` },
    selection: { anchor: from + before.length, head: from + before.length + text.length }
  })
  editorView.focus()
}

// 插入标题
const insertHeading = (level: string) => insertText(`${'#'.repeat(+level)} `)

// 滚动到指定标题
const scrollToHeading = (heading: TocItem) => {
  if (!editorView) return
  const lines = editorView.state.doc.toString().split('\n')
  const index = lines.findIndex(line => line.includes(heading.text) && line.startsWith('#'))

  if (index !== -1) {
    const pos = editorView.state.doc.line(index + 1).from
    editorView.dispatch({
      selection: { anchor: pos, head: pos },
      effects: EditorView.scrollIntoView(pos, { y: 'start' })
    })
    editorView.focus()
  }
}

// 工具栏配置
const toolbarItems: ToolbarItem[] = [
  // 第一组：基本文本格式
  { icon: 'ri-bold', title: '粗体 (Ctrl+B)', action: () => insertText('**', '**') },
  { icon: 'ri-underline', title: '下划线', action: () => insertText('++', '++') },
  { icon: 'ri-italic', title: '斜体 (Ctrl+I)', action: () => insertText('*', '*') },
  { icon: 'ri-strikethrough', title: '删除线', action: () => insertText('~~', '~~') },
  { type: 'divider' },

  // 第二组：标题
  { label: 'H1', title: '一级标题', action: () => insertHeading('1') },
  { label: 'H2', title: '二级标题', action: () => insertHeading('2') },
  { label: 'H3', title: '三级标题', action: () => insertHeading('3') },
  { label: 'H4', title: '四级标题', action: () => insertHeading('4') },
  { label: 'H5', title: '五级标题', action: () => insertHeading('5') },
  { label: 'H6', title: '六级标题', action: () => insertHeading('6') },
  { type: 'divider' },
  { icon: 'ri-subscript', title: '下标', action: () => insertText('~', '~') },
  { icon: 'ri-superscript', title: '上标', action: () => insertText('^', '^') },
  { icon: 'ri-double-quotes-l', title: '引用', action: () => insertText('> ') },
  { icon: 'ri-list-unordered', title: '无序列表', action: () => insertText('- ') },
  { icon: 'ri-list-ordered', title: '有序列表', action: () => insertText('1. ') },
  { icon: 'ri-list-check', title: '任务列表', action: () => insertText('- [ ] ') },
  { type: 'divider' },

  // 第三组：代码和插入元素
  { icon: 'ri-code-line', title: '行内代码', action: () => insertText('`', '`') },
  { icon: 'ri-code-box-line', title: '块级代码', action: () => insertText('\n```', '\n```\n') },
  { icon: 'ri-link', title: '链接', action: () => insertText('[', '](https://)') },
  { icon: 'ri-image-add-line', title: '图片', action: () => imageInputRef.value?.click() },
  { icon: 'ri-table-2', title: '表格', action: () => insertText('\n| 列1 | 列2 | 列3 |\n|:---:|:---:|:---:|\n|  ', '  |    |    |\n') },
  { icon: 'ri-mark-pen-line', title: '高亮', action: () => insertText('==', '==') },
  { type: 'divider' },

  // 第四组：自定义块
  { icon: 'ri-information-line', title: '提示框', action: () => insertText('\n:::note info 提示标题\n', '\n:::endnote\n') },
  { icon: 'ri-layout-grid-line', title: '标签页', action: () => insertText('\n:::tabs\n:::tab 标签1\n', '\n:::endtab\n:::tab 标签2\n内容2\n:::endtab\n:::endtabs\n') },
  { icon: 'ri-increase-decrease-line', title: '折叠面板', action: () => insertText('\n:::fold 点击展开\n', '\n:::endfold\n') },
  { icon: 'ri-external-link-line', title: '链接卡片', action: () => insertText('\n:::link 标题', ' https://example.com 描述信息 :::\n') },

  // 弹性空间，将后续按钮推到右侧
  { type: 'spacer' },

  // 第五组：视图控制（右侧）
  {
    icon: 'ri-fullscreen-line',
    title: '浏览器全屏',
    action: () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(),
    isActive: () => isBrowserFullscreen.value
  },
  {
    icon: 'ri-picture-in-picture-2-line',
    title: '页面全屏',
    action: () => isPageFullscreen.value = !isPageFullscreen.value,
    isActive: () => isPageFullscreen.value
  },
  {
    icon: 'ri-code-s-slash-line',
    title: 'HTML 代码预览',
    action: () => viewMode.value = viewMode.value === 'html' ? 'split' : 'html',
    isActive: () => viewMode.value === 'html'
  },
  {
    icon: 'ri-list-unordered',
    title: '目录',
    action: () => showToc.value = !showToc.value,
    isActive: () => showToc.value
  },
]

// ==================== 图片上传 ====================
const handleImageSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || []).filter(file => {
    if (!file.type.startsWith('image/')) {
      ElMessage.error(`${file.name} 不是图片格式`)
      return false
    }
    if (file.size > MAX_IMAGE_SIZE) {
      ElMessage.error(`${file.name} 大小超过 5MB`)
      return false
    }
    return true
  })

  if (!files.length) return

  const loading = ElMessage.info({ message: `正在上传 ${files.length} 张图片...`, duration: 0 })
  try {
    const results = await Promise.all(files.map(f => uploadFile(f, '文章图片')))
    insertText(results.map(r => `![图片](${r.file_url})`).join('\n'))
    ElMessage.success(`成功上传 ${files.length} 张图片`)
  } catch (error: any) {
    ElMessage.error(error.message || '图片上传失败')
  } finally {
    loading.close()
    input.value = ''
  }
}

// ==================== 滚动同步 ====================
const doSyncScroll = (source: HTMLElement, target: HTMLElement, callback: () => void) => {
  const maxScroll = source.scrollHeight - source.clientHeight
  if (maxScroll > 0) {
    target.scrollTop = (source.scrollTop / maxScroll) * (target.scrollHeight - target.clientHeight)
  }
  requestAnimationFrame(callback)
}

const handleEditorScroll = () => {
  if (syncScroll.value && !isSyncingPreview && viewMode.value === 'split' && editorPaneRef.value && previewPaneRef.value) {
    isSyncingEditor = true
    doSyncScroll(editorPaneRef.value, previewPaneRef.value, () => isSyncingEditor = false)
  }
}

const handlePreviewScroll = () => {
  if (syncScroll.value && !isSyncingEditor && viewMode.value === 'split' && editorPaneRef.value && previewPaneRef.value) {
    isSyncingPreview = true
    doSyncScroll(previewPaneRef.value, editorPaneRef.value, () => isSyncingPreview = false)
  }
}

// ==================== 编辑器初始化 ====================
const initEditor = () => {
  if (!editorRef.value) return

  editorView = new EditorView({
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        history(),
        markdown(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          { key: 'Mod-b', run: () => (insertText('**', '**'), true) },
          { key: 'Mod-i', run: () => (insertText('*', '*'), true) }
        ]),
        EditorView.updateListener.of(update => {
          if (update.docChanged) emit('update:modelValue', update.state.doc.toString())
        }),
        EditorView.lineWrapping
      ]
    }),
    parent: editorRef.value
  })
}

// 监听外部内容变化
watch(() => props.modelValue, (newValue) => {
  if (editorView && newValue !== editorView.state.doc.toString()) {
    editorView.dispatch({
      changes: { from: 0, to: editorView.state.doc.length, insert: newValue }
    })
  }
})

// ==================== 生命周期 ====================
const handleFullscreenChange = () => isBrowserFullscreen.value = !!document.fullscreenElement

onMounted(() => {
  initEditor()
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onBeforeUnmount(() => {
  editorView?.destroy()
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<style lang="scss">
// 引入 Markdown 内容排版样式
@use '@/assets/css/prose';

// 引入代码高亮样式
@import 'highlight.js/styles/github.css';
</style>

<style scoped lang="scss">
.codemirror-editor-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 4px;
  overflow: hidden;

  &.is-fullscreen {
    position: fixed;
    inset: 0;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 9999;
    border-radius: 0;
  }

  .editor-toolbar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: #f5f7fa;
    border-bottom: 1px solid #e4e7ed;
    flex-wrap: wrap;

    .toolbar-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      height: 28px;
      padding: 0 6px;
      background: transparent;
      border: none;
      border-radius: 4px;
      color: #606266;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s;

      i {
        font-size: 15px;
      }

      &:hover {
        background: #e4e7ed;
        color: #409eff;
      }

      &.active {
        background: #409eff;
        color: #fff;
      }
    }

    .toolbar-divider {
      width: 1px;
      height: 16px;
      background: #dcdfe6;
      margin: 0 4px;
    }

    .toolbar-spacer {
      flex: 1;
      min-width: 12px;
    }
  }

  .editor-container {
    flex: 1;
    display: flex;
    position: relative;
    overflow: hidden;

    .editor-pane {
      flex: 1;
      overflow: auto;
      border-right: 1px solid #e4e7ed;

      &.full-width {
        border-right: none;
      }

      &.hidden {
        display: none;
      }

      :deep(.cm-editor) {
        width: 100%;
        height: 100%;
        font-size: 14px;
        font-family: Consolas, Monaco, monospace;

        &.cm-focused {
          outline: none;
        }

        .cm-content {
          padding: 16px;
        }

        .cm-line {
          line-height: 1.6;
        }

        .cm-cursor {
          border-left-color: #409eff;
        }

        .cm-selectionBackground {
          background: #409eff33 !important;
        }

        .cm-activeLine {
          background: #f5f7fa;
        }

        .cm-gutters {
          background: #fafafa;
          border-right: 1px solid #e4e7ed;
        }
      }
    }

    .preview-pane {
      flex: 1;
      overflow: auto;
      padding: 20px;

      &.html-mode {
        padding: 0;
        background: #282c34;

        pre {
          margin: 0;
          padding: 20px;
          height: 100%;

          code {
            color: #abb2bf;
            font-family: Consolas, Monaco, monospace;
            font-size: 14px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-all;
          }
        }
      }
    }

    .toc-pane {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 260px;
      background: #fff;
      border-left: 1px solid #e4e7ed;
      display: flex;
      flex-direction: column;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
      z-index: 10;

      .toc-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid #e4e7ed;
        background: #f5f7fa;
        font-weight: 600;
        font-size: 14px;
        color: #303133;

        .toc-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: none;
          border-radius: 4px;
          background: transparent;
          color: #909399;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            background: #e4e7ed;
            color: #606266;
          }

          i {
            font-size: 18px;
          }
        }
      }

      .toc-content {
        flex: 1;
        overflow: auto;
        padding: 12px 0;

        .toc-item {
          padding: 8px 16px;
          cursor: pointer;
          font-size: 14px;
          line-height: 1.5;
          color: #606266;
          border-left: 3px solid transparent;
          transition: all 0.2s;

          &:hover {
            background: #f5f7fa;
            color: #409eff;
            border-left-color: #409eff;
          }

          @for $i from 1 through 6 {
            &.toc-level-#{$i} {
              padding-left: 16px + ($i - 1) * 12px;

              @if $i ==1 {
                font-weight: 600;
              }
            }
          }
        }

        .toc-empty {
          padding: 40px 16px;
          text-align: center;
          color: #909399;
          font-size: 14px;
        }
      }
    }
  }

  .editor-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 12px;
    background: #fafafa;
    border-top: 1px solid #e4e7ed;
    font-size: 12px;
    color: #909399;

    .footer-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .word-count,
    .reading-time {
      user-select: none;
    }
  }
}
</style>
