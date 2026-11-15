import { useState } from 'react'
import { FiPrinter, FiSearch, FiSettings } from 'react-icons/fi'
import NewSubjectModal from './NewSubjectModal'
import SearchModal from './SearchModal'
import SettingsModal from './SettingsModal'

const Navbar = ({ subjects, onAddSubject, onSelectLesson, theme, onSelectTheme, weekSystem, onWeekSystemChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <div className='no-print'>
      <div className='my-[15px] flex flex-wrap items-center justify-between gap-[10px] border-b-[3px] border-b-[#A65B46] pb-[15px]'>
        <div className=''>
          <p className='font-bold font-["Trirong"] text-[20px] text-[#A65B46]'>AcademicSchedule</p>
        </div>
        <div className='flex flex-wrap items-center gap-[10px]'>
          <button
            type='button'
            onClick={() => setIsSearchOpen(true)}
            aria-label='Axtar'
            title='Axtar'
            className='rounded-[4px] p-[4px] text-[22px] leading-none text-[#434140] hover:bg-[#EADDCF] dark:text-[#EDE8DF] dark:hover:bg-[#3A3632]'
          >
            <FiSearch aria-hidden='true' />
          </button>
          <button
            type='button'
            onClick={() => window.print()}
            aria-label='Çap et'
            title='Çap et'
            className='rounded-[4px] p-[4px] text-[22px] leading-none text-[#434140] hover:bg-[#EADDCF] dark:text-[#EDE8DF] dark:hover:bg-[#3A3632]'
          >
            <FiPrinter aria-hidden='true' />
          </button>
          <button
            type='button'
            onClick={() => setIsSettingsOpen(true)}
            aria-label='Tənzimləmələr'
            title='Tənzimləmələr'
            className='rounded-[4px] p-[4px] text-[22px] leading-none text-[#434140] hover:bg-[#EADDCF] dark:text-[#EDE8DF] dark:hover:bg-[#3A3632]'
          >
            <FiSettings aria-hidden='true' />
          </button>
          <button
            type='button'
            onClick={() => setIsModalOpen(true)}
            className='font-[Inter] rounded-[5px] bg-[#434140] px-[10px] py-[5px] font-medium text-[#E7D8C6] hover:bg-[#555250] dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
          >
            + Yeni Fənn
          </button>
        </div>
      </div>

      {isSearchOpen && (
        <SearchModal
          subjects={subjects}
          weekSystem={weekSystem}
          onSelectLesson={onSelectLesson}
          onClose={() => setIsSearchOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          open={isSettingsOpen}
          theme={theme}
          onSelectTheme={onSelectTheme}
          weekSystem={weekSystem}
          onWeekSystemChange={onWeekSystemChange}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isModalOpen && (
        <NewSubjectModal
          weekSystem={weekSystem}
          onClose={() => setIsModalOpen(false)}
          onSubmit={(subject) => {
            onAddSubject(subject)
            setIsModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

export default Navbar
