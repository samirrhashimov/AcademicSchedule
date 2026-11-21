import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'

const QrScanner = ({ onDetected, onBack }) => {
  const videoRef = useRef(null)
  const callbackRef = useRef(onDetected)
  const detectedRef = useRef(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    callbackRef.current = onDetected
  })

  useEffect(() => {
    let stream = null
    let raf = 0
    let stopped = false
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { willReadFrequently: true })

    const scan = () => {
      if (stopped) {
        return
      }
      const video = videoRef.current
      if (video && video.readyState === video.HAVE_ENOUGH_DATA && !detectedRef.current) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)
        const image = context.getImageData(0, 0, canvas.width, canvas.height)
        const result = jsQR(image.data, canvas.width, canvas.height)
        if (result?.data) {
          detectedRef.current = true
          callbackRef.current(result.data)
          return
        }
      }
      raf = requestAnimationFrame(scan)
    }

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Kamera dəstəklənmir.')
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        const video = videoRef.current
        if (stopped || !video) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        video.srcObject = stream
        await video.play()
        raf = requestAnimationFrame(scan)
      } catch {
        setError('Kameraya icazə verilmədi.')
      }
    }
    start()

    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return (
    <div className='flex flex-col gap-[12px]'>
      <div className='overflow-hidden rounded-[8px] bg-[#000]'>
        <video ref={videoRef} playsInline muted className='max-h-[320px] w-full object-cover' />
      </div>
      {error ? (
        <p className='rounded-[8px] bg-[#FCE5E0] p-[10px] text-[13px] text-[#A65B46]'>{error}</p>
      ) : (
        <p className='text-center text-[13px] text-[#777] dark:text-[#A8A29E]'>QR kodu kameraya tut</p>
      )}
      <button
        type='button'
        onClick={onBack}
        className='rounded-[8px] border border-[#D8D5CE] px-[12px] py-[10px] text-[14px] font-medium text-[#434140] hover:bg-[#F7F3EC] dark:border-[#4A4440] dark:text-[#EDE8DF] dark:hover:bg-[#35302C]'
      >
        Geri
      </button>
    </div>
  )
}

export default QrScanner
