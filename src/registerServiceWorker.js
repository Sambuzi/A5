// Minimal service worker registration for PWA
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('/service-worker.js').catch(()=>{})
  })
}
