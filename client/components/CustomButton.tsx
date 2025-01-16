/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
import state from "@/store"
import { useSnapshot } from "valtio"
export interface CustomButtonProps {
  type: string
  title: string
  handleClick: () => boolean
  customStyles: string
}

const CustomButton = ({ type, title, handleClick, customStyles}: CustomButtonProps) => {
  const snap = useSnapshot(state)
  const generateStyle = (type: string) => {
    if (type === 'filled') {
      return {
        backgroundColor: snap.color,
        color: '#fff'
      }
    }
  }
  return (
    <button className={`px-2 py-1.5 flex-1 rounded-md ${customStyles}`}
      style={generateStyle(type)} onClick={handleClick}>{title}</button>
  )
}

export default CustomButton