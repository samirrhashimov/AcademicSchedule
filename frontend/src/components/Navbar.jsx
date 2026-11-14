import { useState } from 'react'
import NewSubjectModal from './NewSubjectModal'

const Navbar = ({ subjects, onAddSubject }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div>
      <div className='flex justify-between items-center my-[15px] pb-[15px] border-b-[3px] border-b-[#A65B46]'>
        <div className=''>
            <p className='font-bold font-["Trirong"] text-[20px] text-[#A65B46]'>AcademicSchedule</p>
        </div>
        <div className='flex items-center gap-[15px]'>
            <div className='flex gap-[5px] text-[#333]'>
                <p>Fənn sayı: </p><p>{subjects.length}</p>
            </div>
            <button
              type='button'
              onClick={() => setIsModalOpen(true)}
              className='font-[Inter] text-[#E7D8C6] font-medium bg-[#434140] py-[5px] px-[10px] rounded-[5px]'
            >
              + Yeni Fənn
            </button>
        </div>
      </div>

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
