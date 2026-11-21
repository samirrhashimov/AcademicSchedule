import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiCalendar, FiPrinter, FiRepeat, FiShare2 } from 'react-icons/fi'

const THEME_KEY = 'academic-schedule-theme'

const features = [
  { icon: FiCalendar, title: 'Həftəlik cədvəl', text: 'Bütün dərslərin bir ekranda.' },
  { icon: FiRepeat, title: 'Alt/Üst həftə', text: 'Növbələşmə avtomatik hesablanır.' },
  { icon: FiShare2, title: 'Şablon paylaşma', text: 'Kodla cədvəlini başqasına göndər.' },
  { icon: FiPrinter, title: 'Çap', text: 'Təmiz çap görünüşü ilə kağıza köçür.' },
]

const LandingPage = () => {
  useEffect(() => {
    try {
      document.documentElement.classList.toggle('dark', localStorage.getItem(THEME_KEY) === 'dark')
    } catch {
      // yaddaş əlçatan deyilsə açıq rejim qalır
    }
  }, [])

  return (
    <div className='min-h-screen bg-[#FAFAF8] text-[#333] dark:bg-[#201D1B] dark:text-[#E8E2D9]'>
      <header className='mx-auto flex w-full max-w-[960px] items-center justify-between gap-[8px] px-[20px] py-[18px]'>
        <p className='truncate font-bold font-["Trirong"] text-[16px] text-[#A65B46] sm:text-[20px]'>AcademicSchedule</p>
        <div className='flex shrink-0 items-center gap-[6px] sm:gap-[10px]'>
          <Link
            to='/login'
            className='rounded-[8px] px-[10px] py-[8px] text-[13px] font-medium text-[#434140] hover:bg-[#EEE] sm:px-[14px] sm:py-[9px] sm:text-[14px] dark:text-[#EDE8DF] dark:hover:bg-[#3A3632]'
          >
            Daxil ol
          </Link>
          <Link
            to='/register'
            className='rounded-[8px] bg-[#434140] px-[10px] py-[8px] text-[13px] font-medium text-[#E7D8C6] hover:bg-[#555250] sm:px-[14px] sm:py-[9px] sm:text-[14px] dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
          >
            Qeydiyyat
          </Link>
        </div>
      </header>

      <main className='mx-auto w-full max-w-[960px] px-[20px]'>
        <section className='grid items-center gap-[24px] py-[32px] sm:gap-[32px] sm:py-[48px] md:grid-cols-2 md:py-[72px]'>
          <div>
            <h1 className='text-center font-["Trirong"] text-[30px] font-bold leading-tight text-[#434140] sm:text-[36px] md:text-left md:text-[44px] dark:text-[#EDE8DF]'>
              Dərs cədvəlin bir yerdə
            </h1>
            <p className='mx-auto mt-[12px] max-w-[420px] text-center text-[16px] text-[#666] md:mx-0 md:text-left dark:text-[#A8A29E]'>
              Mühazirə və seminarlarını izlə, alt və üst həftələri qarışdırma.
            </p>
            <div className='mt-[24px] flex flex-col gap-[10px] sm:flex-row sm:flex-wrap sm:justify-center md:justify-start'>
              <Link
                to='/register'
                className='rounded-[8px] bg-[#A65B46] px-[20px] py-[12px] text-center text-[15px] font-medium text-[#FFF] hover:bg-[#96543F]'
              >
                Pulsuz başla
              </Link>
              <Link
                to='/login'
                className='rounded-[8px] border border-[#D8D5CE] px-[20px] py-[12px] text-center text-[15px] font-medium text-[#434140] hover:bg-[#F7F3EC] dark:border-[#4A4440] dark:text-[#EDE8DF] dark:hover:bg-[#35302C]'
              >
                Daxil ol
              </Link>
            </div>
          </div>
          <div className='rounded-[14px] border border-[#D8D5CE] bg-[#FFF] p-[16px] shadow-sm dark:border-[#4A4440] dark:bg-[#2A2724]'>
            <p className='mb-[10px] text-[13px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Bu gün</p>
            <div className='flex flex-col gap-[8px]'>
              <div className='rounded-[8px] border-l-[4px] border-[#A65B46] bg-[#FCE5E0] p-[10px]'>
                <p className='text-[12px] font-bold tabular-nums text-[#333]'>09:00 - 10:20</p>
                <p className='truncate text-[14px] font-bold text-[#333]'>Riyaziyyat</p>
                <p className='text-[12px] font-medium text-[#A65B46]'>Mühazirə</p>
              </div>
              <div className='rounded-[8px] border-l-[4px] border-[#477A68] bg-[#E3F1EC] p-[10px]'>
                <p className='text-[12px] font-bold tabular-nums text-[#333]'>10:30 - 11:50</p>
                <p className='truncate text-[14px] font-bold text-[#333]'>Fizika</p>
                <p className='text-[12px] font-medium text-[#477A68]'>Seminar</p>
              </div>
            </div>
          </div>
        </section>

        <section className='grid gap-[12px] pb-[48px] sm:grid-cols-2 lg:grid-cols-4'>
          {features.map((feature) => (
            <div
              key={feature.title}
              className='rounded-[12px] border border-[#D8D5CE] bg-[#FFF] p-[18px] dark:border-[#4A4440] dark:bg-[#2A2724]'
            >
              <feature.icon aria-hidden='true' className='text-[28px] text-[#A65B46]' />
              <p className='mt-[10px] text-[15px] font-bold text-[#434140] dark:text-[#EDE8DF]'>{feature.title}</p>
              <p className='mt-[4px] text-[13px] text-[#666] dark:text-[#A8A29E]'>{feature.text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}

export default LandingPage
