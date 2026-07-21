import './index.css'

const root = document.getElementById('root')

function loadSdk() {
  return new Promise((resolve, reject) => {
    if (window.GlacierBaaS) return resolve()
    const script = document.createElement('script')
    script.src = 'https://chat.q1.com/baas/glacier-baas-sdk.js'
    script.onload = resolve
    script.onerror = () => reject(new Error('Glacier BaaS SDK ????'))
    document.head.appendChild(script)
  })
}

async function boot() {
  for (let i = 0; i < 20; i += 1) {
    if (window.GlacierBaaS) break
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  await loadSdk()
  await import('./main.jsx')
}

boot().catch(error => {
  console.error('Application bootstrap failed', error)
  root.innerHTML = '<main style="font-family:sans-serif;padding:32px;color:#334155"><h1>??????</h1><p>' + error.message + '</p></main>'
})
