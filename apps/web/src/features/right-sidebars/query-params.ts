'use client'

import { useParams } from 'next/navigation'
import { createSerializer, useQueryStates } from 'nuqs'
import { parseAsBoolean, parseAsString } from 'nuqs/server'

import { useSidebar } from './right-sidebar'

type Sidebars =
  | 'filterOpen'
  | 'filterSaving'
  | 'infoId'
  | 'downloadList'

export const sidebarParamsParser = {
  filterOpen: parseAsString,
  filterSaving: parseAsBoolean.withDefault(false),
  infoId: parseAsString,
  downloadList: parseAsBoolean.withDefault(false),
}

const emptySidebarParams: Record<Sidebars, null> = {
  filterOpen: null,
  filterSaving: null,
  infoId: null,
  downloadList: null,
}

export const sidebarParamsSerializer = createSerializer(sidebarParamsParser)

export const useSidebarParams = () => {
  const [sidebarParams, setSidebarParams] = useQueryStates(sidebarParamsParser)
  const { setOpen } = useSidebar('right')
  const params = useParams()
  const paramsSmartListId = params.smartListId as string
  const aiSmartListId = params.aiSmartListId as string

  const toggleFilterOpen = (filter = 'new') => {
    void setSidebarParams((prev) => {
      const filterOpen = prev.filterOpen === filter ? null : filter
      setOpen(!!filterOpen)
      return {
        ...emptySidebarParams,
        filterOpen,
      }
    })
  }

  const toggleFilterSaving = () => {
    void setSidebarParams((prev) => {
      const filterSaving = !prev.filterSaving || null
      setOpen(!!filterSaving)
      return {
        ...emptySidebarParams,
        filterSaving,
      }
    })
  }




  const toggleDownloadList = (open?: boolean) => {
    void setSidebarParams((prev) => {
      const downloadList = open ?? (!prev.downloadList || null)
      setOpen(!!downloadList)
      return {
        ...emptySidebarParams,
        downloadList,
      }
    })
  }

  const toggleInfoSidebarId = (id: string) => {
    void setSidebarParams((prev) => {
      const infoId = prev.infoId === id ? null : id
      setOpen(!!infoId)
      return {
        ...emptySidebarParams,
        infoId,
      }
    })
  }

  const setFilterOpenId = (newFilterOpen: string) => {
    void setSidebarParams((prev) => {
      const filterOpen = prev.filterOpen === newFilterOpen ? null : newFilterOpen
      setOpen(!!filterOpen)
      return {
        ...emptySidebarParams,
        filterOpen,
      }
    })
  }

  const closeSidebar = () => {
    setOpen(false)
    void setSidebarParams(null)
  }

  const getSmartListId = () => {
    if (!sidebarParams.filterOpen) return
    if (sidebarParams.filterOpen === 'new') return
    if (sidebarParams.filterOpen === 'edit') return paramsSmartListId
    return sidebarParams.filterOpen
  }

  return {
    sidebarParams,
    smartListId: getSmartListId(),
    aiSmartListId,
    toggleFilterSaving,
    toggleFilterOpen,
    toggleInfoSidebarId,
    toggleDownloadList,
    setFilterOpenId,
    setSidebarParams,
    closeSidebar,
  }
}
