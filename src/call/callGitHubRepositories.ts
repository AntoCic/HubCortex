import { ensureFirebase, functions } from 'cic-kit'
import { httpsCallable } from 'firebase/functions'

export type ListGitHubRepositoriesRequest = {
  org?: string
}

export type GitHubRepositoryItem = {
  id: number
  fullName: string
  url: string
  owner: string
  name: string
  isPrivate: boolean
  isArchived: boolean
  defaultBranch?: string
  updatedAt?: string
}

export type ListGitHubRepositoriesResponse = {
  source: 'org' | 'user'
  org?: string
  repositories: GitHubRepositoryItem[]
}

function getListGitHubRepositoriesCallable() {
  ensureFirebase()
  return httpsCallable<ListGitHubRepositoriesRequest, ListGitHubRepositoriesResponse>(
    functions,
    'listGitHubRepositories',
  )
}

export async function callListGitHubRepositories(
  input: ListGitHubRepositoriesRequest = {},
): Promise<ListGitHubRepositoriesResponse> {
  const callable = getListGitHubRepositoriesCallable()
  const result = await callable(input)
  return result.data
}
