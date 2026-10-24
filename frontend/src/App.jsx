import { useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'

function App() {
  return (
    <div className='container mx-auto px-[20px] sm:px-[40px] lg:px-[60px]'>
      <Navbar />
      <Dashboard />
    </div>
  )
}

export default App
