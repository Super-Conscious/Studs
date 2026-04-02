export interface Project {
  id: string
  name: string
  created_at: string
  user_id: string
}

export interface Upload {
  id: string
  project_id: string
  type: 'content' | 'reference'
  url: string
  filename: string
  storage_path: string
  created_at: string
}

export interface Generation {
  id: string
  project_id: string
  prompt: string
  image_url: string
  saved: boolean
  created_at: string
}
