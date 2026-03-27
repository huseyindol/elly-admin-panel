'use client'

import { HydrationBoundary, type DehydratedState } from '@tanstack/react-query'

interface HydrationProviderProps {
  children: React.ReactNode
  dehydratedState: DehydratedState
}

export default function HydrationProvider({
  children,
  dehydratedState,
}: Readonly<HydrationProviderProps>) {
  return (
    <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
  )
}
