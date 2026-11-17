import { Link } from 'react-router-dom'

const AuthLayout = ({ illustration, tagline, children }) => (
  <div className='grid min-h-screen w-full md:grid-cols-2'>
    <div className='hidden flex-col justify-between bg-[#434140] p-[40px] text-[#E7D8C6] md:flex dark:bg-[#1F1C1A]'>
      <Link to='/' className='font-bold font-["Trirong"] text-[22px] text-[#A65B46]'>AcademicSchedule</Link>
      <div className='flex flex-col items-center gap-[16px]'>
        {illustration}
        <p className='max-w-[280px] text-center text-[14px] text-[#E7D8C6]/80'>{tagline}</p>
      </div>
      <div />
    </div>
    <div className='flex items-center justify-center p-[24px] sm:p-[48px]'>
      <div className='w-full max-w-[420px]'>
        <div className='mb-[24px] md:hidden'>
          <Link to='/' className='font-bold font-["Trirong"] text-[22px] text-[#A65B46]'>AcademicSchedule</Link>
        </div>
        {children}
      </div>
    </div>
  </div>
)

export default AuthLayout
