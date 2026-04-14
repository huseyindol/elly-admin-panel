---
name: new-service
description: Scaffold a service + TanStack Query hook pair for an entity. Use when the user runs /new-service <entity-name>.
disable-model-invocation: true
allowed-tools: Read, Write, Glob
---

Create a service and TanStack Query hook pair for: **$ARGUMENTS**

## Steps

1. Parse `$ARGUMENTS`:
   - `entity-name` — kebab-case
   - `EntityName` — PascalCase

2. Read reference files:
   - `src/app/_services/mail-accounts.services.ts` — service pattern
   - `src/app/_hooks/useMailAccounts.ts` — hook pattern
   - `src/types/mail-account.ts` — type pattern

3. Create type file: `src/types/{entity-name}.ts`

```typescript
export interface {EntityName} {
  id: string
  // TODO: Add entity fields
  createdAt: string
  updatedAt: string
}

export interface Create{EntityName}DTO {
  // TODO: Add create fields
}

export interface Update{EntityName}DTO extends Partial<Create{EntityName}DTO> {}
```

4. Create service: `src/app/_services/{entity-name}.services.ts`

```typescript
import { fetcher } from '@/utils/services/fetcher'
import type { {EntityName}, Create{EntityName}DTO, Update{EntityName}DTO } from '@/types/{entity-name}'
import type { BaseResponse } from '@/types/BaseResponse'

const BASE_URL = '/api/v1/{entity-name}'

export const {entityName}Service = {
  getAll: () => fetcher<BaseResponse<{EntityName}[]>>(BASE_URL),
  getById: (id: string) => fetcher<BaseResponse<{EntityName}>>(`${BASE_URL}/${id}`),
  create: (data: Create{EntityName}DTO) => fetcher<BaseResponse<{EntityName}>>(BASE_URL, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Update{EntityName}DTO) => fetcher<BaseResponse<{EntityName}>>(`${BASE_URL}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetcher<BaseResponse<void>>(`${BASE_URL}/${id}`, { method: 'DELETE' }),
}
```

5. Create hook: `src/app/_hooks/use{EntityName}.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { {entityName}Service } from '@/app/_services/{entity-name}.services'

const QUERY_KEY = ['{entity-name}']

export function use{EntityName}() {
  const queryClient = useQueryClient()

  const listQuery = useQuery({ queryKey: QUERY_KEY, queryFn: {entityName}Service.getAll })
  const getQuery = (id: string) => useQuery({ queryKey: [...QUERY_KEY, id], queryFn: () => {entityName}Service.getById(id), enabled: !!id })

  const createMutation = useMutation({
    mutationFn: {entityName}Service.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof {entityName}Service.update>[1] }) => {entityName}Service.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
  const deleteMutation = useMutation({
    mutationFn: {entityName}Service.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  return { listQuery, getQuery, createMutation, updateMutation, deleteMutation }
}
```

6. Report created files
