import { BasicInfo, ContentItem } from '@/types/content'
import { useQuery } from '@tanstack/react-query'
import { getContentsListService } from '../_services/contents.services'

export function useBasicInfos() {
  return useQuery({
    queryKey: ['basicInfos'],
    queryFn: async () => {
      const response = await getContentsListService()

      const basicInfosMap = new Map<string, BasicInfo>()

      response.data.forEach((item: ContentItem) => {
        if (item.basicInfo && !basicInfosMap.has(item.basicInfo.id)) {
          basicInfosMap.set(item.basicInfo.id, item.basicInfo)
        }
      })

      return Array.from(basicInfosMap.values())
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
