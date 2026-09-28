export interface WeightTier {
  id: string;
  name: string;
  weightRange: string;
  description: string;
}

export const weightTiers: WeightTier[] = [
  {
    id: 'up_to_300g',
    name: 'Até 300g',
    weightRange: '0 - 300g',
    description: 'Pequenos volumes: capas, bijuterias, cabos, maquiagem'
  },
  {
    id: '300g_500g',
    name: '300g a 500g',
    weightRange: '300g - 500g',
    description: 'Camisetas, fones de ouvido, cosméticos médios'
  },
  {
    id: '500g_1kg',
    name: '500g a 1kg',
    weightRange: '500g - 1kg',
    description: 'Calçados leves, livros, pequenos eletrônicos'
  },
  {
    id: '1kg_2kg',
    name: '1kg a 2kg',
    weightRange: '1kg - 2kg',
    description: 'Vestuário pesado, ferramentas leves, cafeteiras'
  },
  {
    id: '2kg_5kg',
    name: '2kg a 5kg',
    weightRange: '2kg - 5kg',
    description: 'Mochilas, utilidades domésticas, eletroportáteis'
  },
  {
    id: 'custom',
    name: 'Outro / Personalizado',
    weightRange: '> 5kg ou Próprio',
    description: 'Valor exato informado manualmente'
  }
];

export interface ShippingEstimate {
  estimatedCost: number;
  isMandatoryFreeShipping: boolean;
  explanation: string;
  ruleTag: string;
}

/**
 * Returns official estimated shipping cost based on marketplace, price and weight tier
 */
export function estimateShipping(
  marketplaceId: string,
  salePrice: number,
  weightTierId: string,
  customAbsoluteCost: number = 0
): ShippingEstimate {
  if (weightTierId === 'custom' || customAbsoluteCost > 0) {
    return {
      estimatedCost: customAbsoluteCost,
      isMandatoryFreeShipping: marketplaceId === 'mercadolivre' && salePrice >= 79,
      explanation: 'Valor customizado informado manualmente pelo vendedor.',
      ruleTag: 'Manual / Próprio'
    };
  }

  // MERCADO LIVRE (Mercado Envios Oficial)
  if (marketplaceId === 'mercadolivre') {
    if (salePrice < 79) {
      return {
        estimatedCost: 0,
        isMandatoryFreeShipping: false,
        explanation: 'Abaixo de R$ 79, o frete é pago integralmente pelo comprador (o vendedor não paga frete).',
        ruleTag: 'Frete Comprador (R$ 0)'
      };
    }

    // Tabela média oficial Mercado Envios (com desconto verde/líder padrão 40-50%)
    const mlTable: Record<string, number> = {
      up_to_300g: 18.95,
      '300g_500g': 20.45,
      '500g_1kg': 22.95,
      '1kg_2kg': 24.95,
      '2kg_5kg': 28.95,
    };

    const cost = mlTable[weightTierId] || 20.45;
    return {
      estimatedCost: cost,
      isMandatoryFreeShipping: true,
      explanation: `Acima de R$ 79, o Mercado Livre exige Frete Grátis e debita aprox. R$ ${cost.toFixed(2)} do seu repasse para esta faixa de peso.`,
      ruleTag: `Mercado Envios (${cost.toFixed(2)})`
    };
  }

  // AMAZON BRASIL (FBA / DBA Oficial)
  if (marketplaceId === 'amazon') {
    const amazonTable: Record<string, number> = {
      up_to_300g: 13.95,
      '300g_500g': 15.45,
      '500g_1kg': 17.95,
      '1kg_2kg': 20.95,
      '2kg_5kg': 25.95,
    };

    const cost = amazonTable[weightTierId] || 15.45;
    return {
      estimatedCost: cost,
      isMandatoryFreeShipping: false,
      explanation: `Tarifa de logística FBA/DBA da Amazon estimada em R$ ${cost.toFixed(2)} para esta faixa de peso.`,
      ruleTag: `Amazon FBA/DBA (~R$ ${cost.toFixed(2)})`
    };
  }

  // SHOPEE BRASIL (Programa Frete Grátis Extra)
  if (marketplaceId === 'shopee') {
    // Na Shopee, produtos leves até 1kg têm frete subsidiado pela plataforma via cupom do comprador.
    // Para produtos pesados (> 1kg), pode haver coparticipação de peso excedente.
    const shopeeTable: Record<string, number> = {
      up_to_300g: 0,
      '300g_500g': 0,
      '500g_1kg': 0,
      '1kg_2kg': 3.50,
      '2kg_5kg': 6.00,
    };

    const cost = shopeeTable[weightTierId] || 0;
    return {
      estimatedCost: cost,
      isMandatoryFreeShipping: false,
      explanation: cost > 0
        ? `Coparticipação logística da Shopee para pacotes mais pesados (~R$ ${cost.toFixed(2)}).`
        : 'Frete subsidiado pela Shopee através de cupons de frete grátis do comprador.',
      ruleTag: cost > 0 ? `Shopee Copart. (~R$ ${cost.toFixed(2)})` : 'Subsidiado Shopee (R$ 0)'
    };
  }

  return {
    estimatedCost: 0,
    isMandatoryFreeShipping: false,
    explanation: 'Sem frete calculado.',
    ruleTag: 'Padrão'
  };
}
