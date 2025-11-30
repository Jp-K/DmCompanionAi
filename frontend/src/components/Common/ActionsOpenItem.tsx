"use client"

import { IconButton } from "@chakra-ui/react"
import { BsEye } from "react-icons/bs"
import { useRouter } from "next/navigation"

interface ActionsOpenItemProps {
  id: string
  disabled?: boolean
}

const ActionsOpenItem = ({ id, disabled }: ActionsOpenItemProps) => {
  const router = useRouter()

  function openItem() {
    console.log("Open item with id: ", id)
    router.push(`/chat?id=${id}`)
  }

  return (
    <>
      <IconButton
        aria-label="Open chat"
        isDisabled={disabled}
        variant={"ghost"}
        onClick={() => openItem()}
      >
        <BsEye />
      </IconButton>
    </>
  )
}

export default ActionsOpenItem
