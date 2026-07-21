import './index.css'

const root = document.getElementById('root')

async function boot() {
  for (let i = 0; i < 100; i += 1) {
    if (window.GlacierBaaS) {
      await import('./main.jsx')
      return
    }
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  throw new Error('Glacier BaaS SDK was not injected by the hosting platform')
}

boot().catch(error => {
  console.error("Application bootstrap failed", error)
  root.innerHTML = `<main style="font-family:sans-serif;padding:32px;color:#334155"><h1>应用启动失败</h1><p>${error.message}</p></main>`
})
