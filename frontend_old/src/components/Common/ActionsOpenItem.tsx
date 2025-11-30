import React from 'react';
import {
    IconButton,
    useDisclosure
  } from "@chakra-ui/react"
  import { BsEye } from "react-icons/bs";
  import { useNavigate } from "@tanstack/react-router";
  
  interface ActionsMenuProps {
    id: string
    disabled?: boolean
  }
  
  const viewItem = ({ id, disabled }: ActionsMenuProps) => {

    const navigate = useNavigate();

    function openItem() {
        console.log("Open item with id: ", id);
        navigate({ to: `/chat?id=${id}` });
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
  
  export default viewItem
  