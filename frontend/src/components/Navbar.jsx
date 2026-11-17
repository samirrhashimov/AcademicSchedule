import { useState } from 'react'
import { FiAlignRight, FiCalendar, FiPlus, FiPrinter, FiSearch, FiSettings } from 'react-icons/fi'
import AddModal from './AddModal'
import NavMenu from './NavMenu'
import NewSubjectModal from './NewSubjectModal'
import SearchModal from './SearchModal'
import SettingsModal from './SettingsModal'

const Navbar = ({ subjects, onAddSubject, onSelectLesson, theme, onSelectTheme, weekSystem, weekState, onWeekSystemChange, onOpenDayInfo }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false)
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false)

  return (
    <div className='no-print'>
      <div className='my-[15px] flex flex-wrap items-center justify-between gap-[10px] border-b-[3px] border-b-[#A65B46] pb-[15px]'>
        <div className=''>
          <p className='font-bold font-["Trirong"] text-[16px] text-[#A65B46] sm:text-[20px] dark:text-[#FFF]'>AcademicSchedule</p>
        </div>
        <div className='hidden flex-wrap items-center gap-[10px] sm:flex'>
          <button
            type='button'
            onClick={() => setIsAddMenuOpen(true)}
            aria-label='Əlavə et'
            title='Əlavə et'
            className='rounded-[4px] p-[4px] text-[22px] leading-none text-[#434140] hover:bg-[#EADDCF] dark:text-[#EDE8DF] dark:hover:bg-[#3A3632]'
          >
            <FiPlus aria-hidden='true' />
          </button>
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
            onClick={onOpenDayInfo}
            aria-label='Yaxınlıqdakılar'
            title='Yaxınlıqdakılar'
            className='rounded-[4px] p-[4px] text-[22px] leading-none text-[#434140] hover:bg-[#EADDCF] dark:text-[#EDE8DF] dark:hover:bg-[#3A3632]'
          >
            <FiCalendar aria-hidden='true' />
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
        </div>
        <button
          type='button'
          onClick={() => setIsNavMenuOpen(true)}
          aria-label='Menyu'
          title='Menyu'
          className='rounded-[4px] p-[4px] text-[22px] leading-none text-[#434140] hover:bg-[#EADDCF] sm:hidden dark:text-[#EDE8DF] dark:hover:bg-[#3A3632]'
        >
          <FiAlignRight aria-hidden='true' />
        </button>
      </div>

      {isNavMenuOpen && (
        <NavMenu
          open={isNavMenuOpen}
          onClose={() => setIsNavMenuOpen(false)}
          onAdd={() => setIsAddMenuOpen(true)}
          onSearch={() => setIsSearchOpen(true)}
          onDayInfo={onOpenDayInfo}
          onPrint={() => window.print()}
          onSettings={() => setIsSettingsOpen(true)}
        />
      )}

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
          weekState={weekState}
          subjects={subjects}
          onWeekSystemChange={onWeekSystemChange}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      <AddModal
        open={isAddMenuOpen}
        onClose={() => setIsAddMenuOpen(false)}
        onSelectNew={() => {
          setIsAddMenuOpen(false)
          setIsModalOpen(true)
        }}
      />

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
