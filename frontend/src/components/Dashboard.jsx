import { useState } from 'react'

const lessons = (
    <>
        <div className='bg-[#FFFFFF] p-[10px] rounded-[5px]'>
            <p><span className='font-bold'>9:00 - 10:00</span> - Proqramlasdirma</p>
            <p>Dərs tipi: Seminar</p>
        </div>
        <div className='bg-[#FFFFFF] p-[10px] rounded-[5px]'>
            <p><span className='font-bold'>9:00 - 10:00</span> - Proqramlasdirma</p>
            <p>Dərs tipi: Seminar</p>
        </div>
    </>
)

const DayCard = ({ title, isOpen, onToggle }) => {
    return (
        <div className='bg-[#434140] w-[350px] shrink-0 rounded-[5px] p-[10px]'>
            <button
                type='button'
                onClick={onToggle}
                aria-expanded={isOpen}
                className='flex w-full justify-between items-start text-left px-[10px] pb-[10px] cursor-pointer'
            >
                <div>
                    <h1 className='font-bold text-[20px] text-[#FFF]'>{title}</h1>
                    <p className='text-[#DDD]'>Dərs sayı: 2</p>
                </div>
                <span
                    aria-hidden='true'
                    className={`mt-[5px] border-solid border-t-[8px] border-l-[6px] border-r-[6px] border-l-transparent border-r-transparent border-t-[#FFF] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && <div className='flex flex-col gap-[10px]'>{lessons}</div>}
        </div>
    )
}

const Dashboard = () => {
    const [openDays, setOpenDays] = useState({
        today: true,
        tomorrow: false,
        nextDay: false,
    })

    const toggleDay = (day) => {
        setOpenDays((currentDays) => ({
            ...currentDays,
            [day]: !currentDays[day],
        }))
    }

    return (
        <div className='flex flex-row items-start justify-center gap-[10px] overflow-x-auto'>
            <DayCard
                title='Bu gün'
                isOpen={openDays.today}
                onToggle={() => toggleDay('today')}
            />
            <DayCard
                title='Sabah'
                isOpen={openDays.tomorrow}
                onToggle={() => toggleDay('tomorrow')}
            />
            <DayCard
                title='Növbəti gün'
                isOpen={openDays.nextDay}
                onToggle={() => toggleDay('nextDay')}
            />
        </div>
    )
}

export default Dashboard
