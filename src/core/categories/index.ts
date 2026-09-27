export interface ProductCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  rates: {
    mercadolivre: {
      classic: number;
      premium: number;
    };
    amazon: {
      general: number;
      electronics?: number;
    };
    shopee: {
      standard: number;
      free_shipping: number;
    };
  };
}

export const productCategories: ProductCategory[] = [
  {
    id: 'general',
    name: 'Geral / Outros',
    icon: '📦',
    description: 'Categorias padrão sem taxas reduzidas ou específicas',
    rates: {
      mercadolivre: { classic: 14, premium: 19 },
      amazon: { general: 15 },
      shopee: { standard: 14, free_shipping: 20 },
    },
  },
  {
    id: 'electronics',
    name: 'Eletrônicos & Informática',
    icon: '📱',
    description: 'Celulares, computadores, componentes, fones e periféricos',
    rates: {
      mercadolivre: { classic: 12, premium: 17 },
      amazon: { general: 10, electronics: 8 },
      shopee: { standard: 14, free_shipping: 20 },
    },
  },
  {
    id: 'fashion',
    name: 'Moda & Acessórios',
    icon: '👗',
    description: 'Roupas, calçados, bolsas, relógios e joias',
    rates: {
      mercadolivre: { classic: 14, premium: 19 },
      amazon: { general: 15 },
      shopee: { standard: 14, free_shipping: 20 },
    },
  },
  {
    id: 'beauty',
    name: 'Beleza & Cuidados Pessoais',
    icon: '💄',
    description: 'Maquiagem, perfumes, skincare e cuidados diários',
    rates: {
      mercadolivre: { classic: 13, premium: 18 },
      amazon: { general: 13 },
      shopee: { standard: 14, free_shipping: 20 },
    },
  },
  {
    id: 'home',
    name: 'Casa, Móveis & Cozinha',
    icon: '🏠',
    description: 'Decoração, eletroportáteis, utensílios e organização',
    rates: {
      mercadolivre: { classic: 14, premium: 19 },
      amazon: { general: 15 },
      shopee: { standard: 14, free_shipping: 20 },
    },
  },
  {
    id: 'books',
    name: 'Livros & Papelaria',
    icon: '📚',
    description: 'Livros físicos, materiais escolares e de escritório',
    rates: {
      mercadolivre: { classic: 12, premium: 17 },
      amazon: { general: 15 },
      shopee: { standard: 14, free_shipping: 20 },
    },
  },
  {
    id: 'toys',
    name: 'Brinquedos & Bebês',
    icon: '🧸',
    description: 'Jogos, brinquedos educativos, carrinhos e puericultura',
    rates: {
      mercadolivre: { classic: 13, premium: 18 },
      amazon: { general: 14 },
      shopee: { standard: 14, free_shipping: 20 },
    },
  },
  {
    id: 'automotive',
    name: 'Automotivo & Ferramentas',
    icon: '🚗',
    description: 'Peças automotivas, ferramentas manuais e elétricas',
    rates: {
      mercadolivre: { classic: 14, premium: 19 },
      amazon: { general: 14 },
      shopee: { standard: 14, free_shipping: 20 },
    },
  },
];

export function getCategoryById(id: string): ProductCategory {
  return productCategories.find(c => c.id === id) || productCategories[0];
}

export function getCategoryPercentage(
  categoryId: string,
  marketplaceId: string,
  conditionId: string
): number | null {
  const cat = getCategoryById(categoryId);
  const mktRates = (cat.rates as any)?.[marketplaceId];
  if (!mktRates) return null;

  // Se conditionId existir no mapa de rates da categoria, use-o
  if (typeof mktRates[conditionId] === 'number') {
    return mktRates[conditionId];
  }

  // Fallback para 'general' ou primeira chave numérica
  if (typeof mktRates.general === 'number') {
    return mktRates.general;
  }

  const values = Object.values(mktRates).filter(v => typeof v === 'number') as number[];
  return values.length > 0 ? values[0] : null;
}
