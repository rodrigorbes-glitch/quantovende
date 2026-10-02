import { useState } from 'react';
import { ArrowRight, PieChart, TrendingUp, ShieldCheck, ArrowRightLeft, Sparkles, MessageSquare, Package, CheckCircle2 } from 'lucide-react';
import { Logo } from '../../ui/components/Logo';
import { InstallPwaBanner } from '../../ui/components/InstallPwa';
import { ProPlansModal } from '../subscription/ProPlansModal';
import { usePricingStore } from '../../store/usePricingStore';

export function LandingPage() {
  const store = usePricingStore();
  const [isProOpen, setIsProOpen] = useState(false);

  const navigateToCalculator = () => {
    window.history.pushState({}, '', '/calculadora');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <InstallPwaBanner />
      <ProPlansModal isOpen={isProOpen} onClose={() => setIsProOpen(false)} />

      {/* HEADER */}
      <header className="py-3 px-3 sm:px-6 md:px-12 flex justify-between items-center border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="cursor-pointer shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="block sm:hidden">
            <Logo size="sm" />
          </div>
          <div className="hidden sm:block">
            <Logo size="md" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={() => setIsProOpen(true)}
            className="text-[11px] sm:text-sm font-bold text-amber-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 rounded-full shadow-xs flex items-center gap-1 sm:gap-1.5 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 fill-amber-950" />
            <span>{store.isProUser ? 'PRO Ativo' : 'Planos PRO'}</span>
          </button>
          <button 
            onClick={navigateToCalculator}
            className="text-xs sm:text-sm font-semibold bg-primary text-primary-foreground px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full hover:bg-primary/90 transition-all shadow-xs shrink-0"
          >
            <span>{store.isProUser ? 'Acessar Calculadora' : 'Calculadora Grátis'}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* HERO SECTION */}
        <section className="py-20 md:py-28 px-6 md:px-12 flex flex-col items-center text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-8 border border-primary/20 animate-in fade-in slide-in-from-top-2">
            <Sparkles className="w-4 h-4" />
            <span>Motor com Conexão Oficial Amazon & Mercado Livre</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 text-foreground">
            Venda mais nos marketplaces.<br />
            <span className="text-primary">Saiba exatamente quanto sobra no bolso.</span>
          </h1>

          <p className="text-lg md:text-xl text-foreground/70 max-w-3xl mb-10 leading-relaxed">
            Chega de planilhas desatualizadas e surpresas no extrato. O QuantoVende calcula taxas oficiais por categoria, custos ocultos e compara onde seu produto dá mais lucro em tempo real.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">
            <button 
              onClick={navigateToCalculator}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full text-lg font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <span>{store.isProUser ? 'Acessar Minha Calculadora PRO' : 'Calcular meu preço agora'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <a 
              href="#recursos"
              className="w-full sm:w-auto flex items-center justify-center px-8 py-4 rounded-full text-lg font-medium border border-border/60 hover:bg-foreground/5 transition-colors"
            >
              Conhecer os recursos
            </a>
          </div>

          {/* BADGES PROVA SOCIAL / SEGURANÇA */}
          <div className="mt-12 pt-8 border-t border-border/40 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-foreground/60">
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span>Taxas Oficiais em Tempo Real</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span>100% Gratuito no Navegador</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span>Sem necessidade de cadastro prévio</span>
            </div>
          </div>
        </section>

        {/* DEMO SHOWCASE SECTION */}
        <section className="py-12 px-6 md:px-12 max-w-5xl mx-auto w-full">
          <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 blur-3xl rounded-full -z-10 pointer-events-none"></div>
            
            <div className="grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-6 space-y-4">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-success/10 text-success">
                  <span>📱 Eletrônicos & Informática</span>
                  <span>•</span>
                  <span>Mercado Livre Clássico</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Transparência total em cada centavo da sua venda
                </h3>
                <p className="text-foreground/70 text-sm leading-relaxed">
                  Veja exatamente o que é comissão de canal, taxa fixa de embalagem, frete obrigatório e impostos antes de publicar qualquer anúncio.
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-foreground/5 font-medium">Calculadora de Preço Ideal</span>
                  <span className="px-2.5 py-1 rounded-lg bg-foreground/5 font-medium">Preço Mínimo Anti-Prejuízo</span>
                  <span className="px-2.5 py-1 rounded-lg bg-foreground/5 font-medium">Envio no WhatsApp</span>
                </div>
              </div>

              <div className="md:col-span-6 bg-background rounded-2xl p-6 border border-border/80 shadow-md space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-border/60">
                  <div>
                    <span className="text-xs text-foreground/50 block">Preço de Venda</span>
                    <span className="text-2xl font-bold text-foreground">R$ 120,00</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-foreground/50 block">Lucro Líquido Real</span>
                    <span className="text-2xl font-bold text-success">R$ 50,80</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-foreground/70">
                    <span>Custo do Produto</span>
                    <span className="font-semibold text-foreground">R$ 50,00</span>
                  </div>
                  <div className="flex justify-between text-foreground/70">
                    <span>Comissão Oficial (12%)</span>
                    <span className="font-semibold text-danger">- R$ 14,40</span>
                  </div>
                  <div className="flex justify-between text-foreground/70">
                    <span>Impostos & Outros</span>
                    <span className="font-semibold text-danger">- R$ 4,80</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-success font-semibold bg-success/10 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Margem Líquida: 42.3%</span>
                  </div>
                  <button 
                    onClick={navigateToCalculator}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    Simular meu produto <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RECURSOS / GRID SECTION */}
        <section id="recursos" className="py-24 px-6 md:px-12 bg-foreground/[0.02] border-y border-border/30">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Tudo o que você precisa para precificar como os grandes sellers
              </h2>
              <p className="text-foreground/70 text-base sm:text-lg">
                Desenvolvido pensando na rotina de quem vende de verdade no comércio eletrônico brasileiro.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:border-primary/40 transition-all space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Taxas Oficiais Automatizadas</h3>
                <p className="text-foreground/70 text-sm leading-relaxed">
                  Monitoramento contínuo das regras comerciais do Mercado Livre, Amazon e Shopee diretamente das APIs oficiais para você nunca calcular com taxas antigas.
                </p>
              </div>

              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:border-primary/40 transition-all space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Comparador em Tempo Real</h3>
                <p className="text-foreground/70 text-sm leading-relaxed">
                  Descubra com 1 clique onde seu produto deixa mais dinheiro no bolso e qual marketplace entrega a maior margem percentual para o mesmo produto.
                </p>
              </div>

              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:border-primary/40 transition-all space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Calculadora de Preço Ideal</h3>
                <p className="text-foreground/70 text-sm leading-relaxed">
                  Defina a sua meta de lucro (ex: 20% no bolso) e o QuantoVende calcula o preço exato de venda necessário para cobrir custos e taxas.
                </p>
              </div>

              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:border-primary/40 transition-all space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Catálogo de Produtos Salvos</h3>
                <p className="text-foreground/70 text-sm leading-relaxed">
                  Guarde suas simulações no navegador para consultar a qualquer momento, carregar com 1 clique e acompanhar a saúde do seu portfólio.
                </p>
              </div>

              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:border-primary/40 transition-all space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <PieChart className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Nicho & Categorias</h3>
                <p className="text-foreground/70 text-sm leading-relaxed">
                  Taxas reduzidas para Eletrônicos, Informática, Livros, Moda, Beleza e Decoração aplicadas automaticamente de acordo com as regras de cada canal.
                </p>
              </div>

              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:border-primary/40 transition-all space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Compartilhamento no WhatsApp</h3>
                <p className="text-foreground/70 text-sm leading-relaxed">
                  Copie resumos limpos ou envie o raio-X completo da precificação direto no WhatsApp para fornecedores, sócios e contadores.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="py-24 px-6 md:px-12 bg-primary text-primary-foreground text-center relative overflow-hidden">
          <div className="max-w-4xl mx-auto space-y-8 relative z-10">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Pare de descobrir o prejuízo depois da venda.
            </h2>
            <p className="text-primary-foreground/80 text-lg sm:text-xl max-w-2xl mx-auto">
              Descubra seu preço ideal, simule margens seguras e venda com a confiança de quem conhece os números.
            </p>
            <button 
              onClick={navigateToCalculator}
              className="bg-background text-foreground px-10 py-5 rounded-full text-lg sm:text-xl font-bold hover:bg-background/90 transition-transform hover:scale-105 shadow-2xl inline-flex items-center gap-2"
            >
              <span>Calcular meu preço gratuitamente</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="py-10 px-6 md:px-12 text-center text-foreground/50 text-sm border-t border-border/40 bg-card">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-xs">Precifique com precisão. Venda com clareza nos maiores marketplaces do Brasil.</p>
          <p className="text-xs">© {new Date().getFullYear()} QuantoVende. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
