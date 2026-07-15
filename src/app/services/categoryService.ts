export interface CategoryResponseDto {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  active: boolean;
  parentId: string | null;
  parentName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  children: CategoryResponseDto[];
}

export interface CategoryRequestDto {
  name: string;
  code?: string;
  parentId?: string | null;
  description?: string;
  active?: boolean;
}

export interface FlatCategory {
  id: string;
  name: string;
  code: string | null;
  depth: number;
  label: string;
  parentId: string | null;
  active: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

const CATEGORY_BASE_URL = `${API_BASE_URL}/categories`;

async function parseApiResponse<T>(response: Response): Promise<T> {
  const responseBody = await response.json();
  if (!response.ok) {
    throw new Error(responseBody?.message || "Request failed");
  }
  if (responseBody?.success === false) {
    throw new Error(responseBody?.message || "Request failed");
  }
  return (responseBody.data ?? responseBody) as T;
}

function flattenTree(
  categories: CategoryResponseDto[],
  depth = 0,
  parentLabel = ""
): FlatCategory[] {
  const result: FlatCategory[] = [];

  for (const cat of categories) {
    const label = parentLabel ? `${parentLabel} > ${cat.name}` : cat.name;
    result.push({
      id: cat.id,
      name: cat.name,
      code: cat.code,
      depth,
      label,
      parentId: cat.parentId,
      active: cat.active,
    });

    if (cat.children?.length) {
      result.push(...flattenTree(cat.children, depth + 1, label));
    }
  }

  return result;
}

export const categoryService = {
  async getCategoryTree(): Promise<CategoryResponseDto[]> {
    const response = await fetch(`${CATEGORY_BASE_URL}/tree`);
    return parseApiResponse<CategoryResponseDto[]>(response);
  },

  async getActiveCategories(): Promise<CategoryResponseDto[]> {
    const response = await fetch(`${CATEGORY_BASE_URL}/active`);
    return parseApiResponse<CategoryResponseDto[]>(response);
  },

  async getFlatCategories(): Promise<FlatCategory[]> {
    const tree = await this.getActiveCategories();
    return flattenTree(tree);
  },

  async getAllFlatCategories(): Promise<FlatCategory[]> {
    const tree = await this.getCategoryTree();
    return flattenTree(tree);
  },

  async createCategory(data: CategoryRequestDto): Promise<CategoryResponseDto> {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(CATEGORY_BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return parseApiResponse<CategoryResponseDto>(response);
  },

  async updateCategory(
    id: string,
    data: CategoryRequestDto
  ): Promise<CategoryResponseDto> {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`${CATEGORY_BASE_URL}/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return parseApiResponse<CategoryResponseDto>(response);
  },

  async deleteCategory(id: string): Promise<void> {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`${CATEGORY_BASE_URL}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    await parseApiResponse<void>(response);
  },
};
