'use client'

import { useParams } from 'next/navigation'
import MilestoneComponent from './MilestoneComponent'

export default function MilestonePage() {
  const params = useParams()
  const milestoneId = parseInt(params.id as string)

  return <MilestoneComponent milestoneId={milestoneId} />
}