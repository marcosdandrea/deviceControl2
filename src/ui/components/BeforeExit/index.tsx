import useProject from '@hooks/useProject'
import React, { useEffect } from 'react'

const BeforeExit = () => {
  const { unsavedChanges } = useProject({ fetchProject: false })

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!unsavedChanges) return
      event.preventDefault()
      event.returnValue = '' // activa el diálogo nativo
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [unsavedChanges]) // 👈 importante

  return null
}

export default BeforeExit
