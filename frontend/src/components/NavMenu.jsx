import { FiCalendar, FiPlus, FiPrinter, FiSearch, FiSettings, FiX } from 'react-icons/fi'
import { useEscapeKey } from '../lib/useEscapeKey'
import { useLockBodyScroll } from '../lib/useLockBodyScroll'

const NavMenu = ({ open, onClose, onAdd, onSearch, onDayInfo, onPrint, onSettings }) => {
  useLockBodyScroll(open)
  useEscapeKey(onClose, open)
  if (!open) {
    return null
  }

  const items = [
    { label: 'Əlavə et', icon: FiPlus, action: onAdd },
    { label: 'Axtar', icon: FiSearch, action: onSearch },
    { label: 'Yaxınlıqdakılar', icon: FiCalendar, action: onDayInfo },
    { label: 'Çap et', icon: FiPrinter, action: onPrint },
    { label: 'Tənzimləmələr', icon: FiSettings, action: onSettings },
  ]

  return (
    <div className='menu-slide-in no-print fixed inset-0 z-30 bg-[#FFF] dark:bg-[#201D1B]'>
      <div className='mx-auto flex h-full w-full max-w-[640px] flex-col'>
        <div className='flex items-center justify-between border-b border-[#EEE] px-[24px] py-[18px] dark:border-[#4A4440]'>
          <p className='text-[20px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Menyu</p>
          <button
            type='button'
            onClick={onClose}
            aria-label='Bağla'
            className='flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#F1EFE9] text-[18px] text-[#434140] hover:bg-[#E4E0D6] dark:bg-[#3A3632] dark:text-[#EDE8DF] dark:hover:bg-[#4A4440]'
          >
            <FiX aria-hidden='true' />
          </button>
        </div>
        <nav className='flex flex-col gap-[4px] p-[16px]'>
          {items.map((item) => (
            <button
              key={item.label}
              type='button'
              onClick={() => {
                onClose()
                item.action()
              }}
              className='flex w-full flex-row-reverse items-center gap-[16px] rounded-[10px] px-[16px] py-[18px] text-right text-[28px] font-bold text-[#434140] hover:bg-[#F7F3EC] dark:text-[#EDE8DF] dark:hover:bg-[#35302C]'
            >
              <item.icon aria-hidden='true' className='shrink-0 text-[32px]' />
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default NavMenu
