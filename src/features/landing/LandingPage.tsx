import { ArrowRight, Calculator, PieChart, TrendingUp, ShieldCheck } from 'lucide-react';

export function LandingPage() {
  const navigateToCalculator = () => {
    window.history.pushState({}, '', '/calculadora');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="py-6 px-6 md:px-12 flex justify-between items-center border-b border-border/40">
        <div className="flex items-center gap-2">
          <Calculator className="w-7 h-7 text-primary" />
          <span className="text-xl font-bold tracking-tight">QuantoVende</span>
        </div>
        <button 
          onClick={navigateToCalculator}
          className="text-sm font-medium bg-primary text-primary-foreground px-5 py-2.5 rounded-full hover:bg-primary/90 transition-colors shadow-sm"
        >
          Acessar Calculadora
        </button>
      </header>

      <main className="flex-1 flex flex-col">
        {/* HERO SECTION */}
        <section className="py-24 px-6 md:px-12 flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-semibold mb-8 border border-success/20">
            <TrendingUp className="w-4 h-4" />
            V1.1 Comercial Liberada
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6 text-foreground">
            Venda mais.<br />
            <span className="text-primary">Saiba quanto realmente sobra.</span>
          </h1>
          <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mb-10 leading-relaxed">
            Calcule o preço certo considerando comissão, taxas, frete, impostos, anúncios e outros custos antes de vender nos maiores marketplaces.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button 
              onClick={navigateToCalculator}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full text-lg font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Calcular meu preço <ArrowRight className="w-5 h-5" />
            </button>
            <a 
              href="#como-funciona"
              className="flex items-center justify-center px-8 py-4 rounded-full text-lg font-medium border border-border/50 hover:bg-foreground/5 transition-colors"
            >
              Como funciona
            </a>
          </div>
        </section>

        {/* PROBLEMA & PROPOSTA SECTION */}
        <section id="como-funciona" className="py-20 px-6 md:px-12 bg-foreground/[0.02] border-y border-border/30">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">Você sabe quanto realmente sobra de cada venda?</h2>
              <p className="text-foreground/70 text-lg mb-8">
                O preço de venda raramente é o que cai no seu bolso. Taxas fixas, comissões por categoria, custos de logística e impostos ocultos corroem sua margem se não forem antecipados.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-danger/10 flex items-center justify-center text-danger">✕</div>
                  <span className="text-foreground/80">Achismo na hora de precificar</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success">✓</div>
                  <span className="text-foreground/80">Decisões baseadas em números reais</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" /> Tudo que afeta seu lucro
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Custo do Produto", value: "R$ 50,00", type: "neutral" },
                  { label: "Comissão Marketplace", value: "- R$ 15,40", type: "negative" },
                  { label: "Taxas e Frete", value: "- R$ 6,00", type: "negative" },
                  { label: "Venda", value: "R$ 110,00", type: "positive", bold: true },
                ].map((item, i) => (
                  <div key={i} className={`flex justify-between p-3 rounded-lg ${item.bold ? 'bg-foreground/5 font-bold mt-6' : 'hover:bg-foreground/5'}`}>
                    <span className="text-foreground/80">{item.label}</span>
                    <span className={
                      item.type === 'negative' ? 'text-danger' : 
                      item.type === 'positive' ? 'text-success' : 'text-foreground'
                    }>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* MARKETPLACES SECTION */}
        <section className="py-24 px-6 md:px-12 max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Compare antes de decidir onde vender.</h2>
          <p className="text-foreground/70 text-lg mb-12 max-w-2xl mx-auto">
            O QuantoVende possui um motor inteligente atualizado com as regras comerciais (comissões em faixas e limites) do Mercado Livre, Shopee e Amazon*.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              { mkt: "Mercado Livre", desc: "Regras de Clássico, Premium e descontinuidade de taxas fixas para itens acima de R$79." },
              { mkt: "Shopee", desc: "Motor atualizado sem teto máximo (Cap) e aplicação de percentuais em múltiplas faixas de preço." },
              { mkt: "Amazon", desc: "Estimativas estruturadas por categoria geral ou eletrônicos, cobrindo comissões variadas." }
            ].map((item, i) => (
              <div key={i} className="bg-card border border-border/40 rounded-xl p-6 hover:border-primary/50 transition-colors shadow-sm">
                <ShieldCheck className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">{item.mkt}</h3>
                <p className="text-foreground/70 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-foreground/50 mt-8">* As regras de marketplaces são aplicadas com rigor, mas custos de logística dinâmicos requerem entrada manual para exatidão.</p>
        </section>

        {/* CTA FINAL */}
        <section className="py-24 px-6 bg-primary text-primary-foreground text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Pare de descobrir o prejuízo depois da venda.</h2>
          <p className="text-primary-foreground/80 text-xl mb-10 max-w-2xl mx-auto">
            Descubra seu preço mínimo, simule margens de lucro e tenha clareza financeira imediata. Totalmente no seu navegador.
          </p>
          <button 
            onClick={navigateToCalculator}
            className="bg-background text-foreground px-10 py-5 rounded-full text-xl font-bold hover:bg-background/90 transition-transform hover:scale-105 shadow-xl"
          >
            Calcular meu preço agora
          </button>
        </section>
      </main>

      <footer className="py-8 text-center text-foreground/50 text-sm border-t border-border/30">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Calculator className="w-5 h-5" />
          <span className="font-bold text-base text-foreground">QuantoVende</span>
        </div>
        <p>Precifique melhor. Venda com mais clareza.</p>
        <p className="mt-4 text-xs">© {new Date().getFullYear()} QuantoVende. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
