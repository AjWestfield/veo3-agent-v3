"use client"

export function SessionNavBar() {
  return (
    <div className="w-[3.05rem] h-full shrink-0 bg-[#2f2f2f] border-r border-[#4a4a4a] fixed left-0 z-40">
      <div className="flex h-[54px] w-full shrink-0 items-center border-b border-[#4a4a4a] p-2">
        <button className="w-full h-9 rounded-md flex items-center justify-center text-white hover:bg-[#404040]">
          <span className="text-sm">P</span>
        </button>
      </div>
      <div className="flex flex-col p-2">
        <button className="w-full h-10 rounded-md flex items-center justify-center text-white hover:bg-[#404040]">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"></path>
            <path d="M12 5v14"></path>
          </svg>
        </button>
      </div>
    </div>
  )
}
