import { createDevOverlay } from '../src/dev-overlay/index'

// Example: override defaults to always show floating button (even outside dev),
// use a larger light-themed button in the top-right corner.
const { tracker, ui } = createDevOverlay({
  devOnly: false,
  floatingButtonSize: 35,
  floatingButtonOffset: 28,
  floatingButtonTheme: 'light',
  position: 'top-right',
})

console.log('Dev overlay (example) ready', { tracker, ui })

// Optional: programmatically toggle after 2s (demo)
setTimeout(() => ui.toggle(), 2000)
