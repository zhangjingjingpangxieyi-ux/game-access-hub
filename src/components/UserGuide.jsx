import { useEffect } from 'react'

const GUIDE_TITLE = '\u4f7f\u7528\u6307\u5357'

export default function UserGuide() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 52px)', background: '#f8fafc' }}>
      <iframe
        src="/user-guide.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block'
        }}
        title={GUIDE_TITLE}
      />
    </div>
  )
}
