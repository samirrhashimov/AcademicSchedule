import { useState } from 'react'
import { FiSearch } from 'react-icons/fi'
import NewSubjectModal from './NewSubjectModal'
import SearchModal from './SearchModal'

const Navbar = ({ subjects, onAddSubject }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <div>
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
            className='p-[4px] text-[22px] leading-none text-[#434140]'
          >
            <FiSearch aria-hidden='true' />
          </button>
          <button
            type='button'
            onClick={() => setIsModalOpen(true)}
            className='font-[Inter] rounded-[5px] bg-[#434140] px-[10px] py-[5px] font-medium text-[#E7D8C6]'
          >
            + Yeni Fənn
          </button>
        </div>
      </div>

      {isSearchOpen && (
        <SearchModal
          subjects={subjects}
          onClose={() => setIsSearchOpen(false)}
        />
      )}

      {isModalOpen && (
        <NewSubjectModal
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
