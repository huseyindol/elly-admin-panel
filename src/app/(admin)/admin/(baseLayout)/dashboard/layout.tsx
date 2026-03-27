import React from 'react'

type Props = {
  children: React.ReactNode
}

function layout({ children }: Props) {
  return <>{children}</>
}

export default layout
