import { describe, it, expect } from 'vitest';
import { estimateShipping, weightTiers } from './index';

describe('Freight Intelligence Engine', () => {
  it('Deve listar as faixas de peso oficiais pré-configuradas', () => {
    expect(weightTiers.length).toBeGreaterThan(0);
    expect(weightTiers.some(w => w.id === 'up_to_300g')).toBe(true);
  });
  it('Mercado Livre: < R$ 79 deve cobrar R$ 0 de frete do vendedor (comprador paga)', () => {
    const est = estimateShipping('mercadolivre', 50, 'up_to_300g');
    expect(est.estimatedCost).toBe(0);
    expect(est.isMandatoryFreeShipping).toBe(false);
  });

  it('Mercado Livre: >= R$ 79 deve calcular frete grátis obrigatório de acordo com a faixa de peso', () => {
    const estLight = estimateShipping('mercadolivre', 79, 'up_to_300g');
    expect(estLight.estimatedCost).toBe(18.95);
    expect(estLight.isMandatoryFreeShipping).toBe(true);

    const estMed = estimateShipping('mercadolivre', 120, '500g_1kg');
    expect(estMed.estimatedCost).toBe(22.95);
    expect(estMed.isMandatoryFreeShipping).toBe(true);

    const estHeavy = estimateShipping('mercadolivre', 150, '2kg_5kg');
    expect(estHeavy.estimatedCost).toBe(28.95);
    expect(estHeavy.isMandatoryFreeShipping).toBe(true);
  });

  it('Amazon: Deve cobrar tabela oficial de logística FBA/DBA baseada no peso', () => {
    const estLight = estimateShipping('amazon', 50, 'up_to_300g');
    expect(estLight.estimatedCost).toBe(13.95);

    const est1kg = estimateShipping('amazon', 100, '1kg_2kg');
    expect(est1kg.estimatedCost).toBe(20.95);
  });

  it('Shopee: Produtos leves até 1kg têm frete subsidiado (R$ 0), pesados têm coparticipação', () => {
    const estLight = estimateShipping('shopee', 40, 'up_to_300g');
    expect(estLight.estimatedCost).toBe(0);

    const estHeavy = estimateShipping('shopee', 120, '1kg_2kg');
    expect(estHeavy.estimatedCost).toBe(3.50);
  });

  it('Custom / Próprio: Deve respeitar valor manual informado', () => {
    const estCustom = estimateShipping('mercadolivre', 100, 'custom', 32.50);
    expect(estCustom.estimatedCost).toBe(32.50);
  });
});
