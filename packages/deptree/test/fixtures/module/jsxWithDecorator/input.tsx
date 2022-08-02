import React from 'react'
import { createRoot } from 'react-dom/client'
import Sub1 from './Sub1'
import Sub2 from './Sub2'

function App() {
  return (
    <>
      <Sub1 text="1" />
      <Sub2 value={2} />
    </>
  )
}

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<App />)
}
