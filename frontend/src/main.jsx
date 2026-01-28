import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// AGREGA ESTA LÍNEA AQUÍ:
import 'sweetalert2/dist/sweetalert2.min.css'; 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)