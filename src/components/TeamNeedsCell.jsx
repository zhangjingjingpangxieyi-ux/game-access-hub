/**
 * TeamNeedsCell
 * 用于「项目提供物料」字段的展示：
 * - 最多显示两行，超出省略（line-clamp-2）
 * - 自动识别 URL，渲染为可点击链接（在新标签页打开）
 * - 鼠标悬停时展示完整内容（自定义 Tooltip）
 *   - 用 setTimeout 消抖，防止鼠标移入 tooltip 时闪烁消失
 */
import { useState, useRef } from 'react'

/** 把文本中的 URL 切割成 [文字, 链接, 文字, ...] 片段 */
function parseContent(text) {
  if (!text) return []
  const urlPattern = /(https?:\/\/[^\s）\)，,。\u3000]+)/g
  const parts = []
  let lastIndex = 0
  let match
  while ((match = urlPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'url', value: match[0] })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) })
  }
  return parts
}

/** 把内容渲染成包含链接的 inline 元素 */
export function RichContentInline({ text, linkClassName = '' }) {
  const parts = parseContent(text)
  return (
    <>
      {parts.map((p, i) =>
        p.type === 'url' ? (
          <a
            key={i}
            href={p.value}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName || 'text-primary-500 underline hover:text-primary-700 break-all'}
            onClick={e => e.stopPropagation()}
          >
            📎 查看模板
          </a>
        ) : (
          <span key={i}>{p.value}</span>
        )
      )}
    </>
  )
}

/**
 * 用于功能列表行内展示（两行截断 + hover tooltip）
 * Props:
 *   text      - team_needs 文本内容
 *   className - 外层容器额外样式
 */
export function TeamNeedsCell({ text, className = '' }) {
  const [show, setShow] = useState(false)
  const hideTimer = useRef(null)

  if (!text) return <span className="text-[11px] text-gray-300">-</span>

  function handleMouseEnter() {
    clearTimeout(hideTimer.current)
    setShow(true)
  }

  function handleMouseLeave() {
    // 用 100ms 延迟，让鼠标移入 tooltip 时有时间触发 tooltip 的 mouseEnter 取消隐藏
    hideTimer.current = setTimeout(() => setShow(false), 100)
  }

  return (
    // 必须是 block/div 才能让 line-clamp 和 overflow 生效；relative 给 tooltip 定位用
    <div
      className={`relative text-[11px] text-amber-600 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 两行截断显示：overflow-hidden + line-clamp-2 */}
      <div className="overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        <RichContentInline text={text} />
      </div>

      {/* Tooltip 浮层 */}
      {show && (
        <div
          className="
            absolute z-50 left-0 top-full mt-1
            w-64 max-w-xs
            bg-gray-900 text-white text-[11px] leading-[1.6]
            rounded-lg px-3 py-2 shadow-xl
          "
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <RichContentInline
            text={text}
            linkClassName="text-amber-300 underline hover:text-amber-100 break-all"
          />
        </div>
      )}
    </div>
  )
}

/**
 * 用于详情展开区域的完整展示（不截断，URL 渲染为链接）
 * Props:
 *   text      - team_needs 文本内容
 *   className - 外层容器额外样式
 */
export function TeamNeedsFull({ text, className = '' }) {
  if (!text) return null
  return (
    <div
      className={`text-[12px] text-amber-600 leading-[1.6] ${className}`}
      style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
    >
      <RichContentInline
        text={text}
        linkClassName="text-primary-500 underline hover:text-primary-700 break-all"
      />
    </div>
  )
}
