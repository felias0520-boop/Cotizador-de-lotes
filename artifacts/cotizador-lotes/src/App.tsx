import { type CSSProperties, type ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Calculator, Check, CircleHelp, MapPinned, MessageCircle, ShieldCheck } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Home() {
  const [price, setPrice] = useState(20000);
  const [downPayment, setDownPayment] = useState(2000);
  const [months, setMonths] = useState(24);
  const [monthlyRate, setMonthlyRate] = useState(0);

  const calculations = useMemo(() => {
    const financed = Math.max(0, price - downPayment);
    const rate = monthlyRate / 100;
    const installment = financed === 0
      ? 0
      : rate === 0
        ? financed / months
        : financed * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    const financedTotal = installment * months;
    return {
      financed,
      installment,
      interestTotal: Math.max(0, financedTotal - financed),
      finalTotal: downPayment + financedTotal,
      initialPercent: price > 0 ? Math.round((downPayment / price) * 100) : 0,
    };
  }, [price, downPayment, months, monthlyRate]);

  const money = (amount: number) =>
    `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const wholeMoney = (amount: number) => `S/ ${amount.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`;

  const updatePrice = (value: number, resetInitial = false) => {
    const nextPrice = Math.max(1, Number.isFinite(value) ? value : 1);
    setPrice(nextPrice);
    setDownPayment((current) => resetInitial
      ? Math.round(nextPrice * 0.1)
      : Math.min(current, nextPrice));
  };
  const updateDownPayment = (value: number) =>
    setDownPayment(Math.min(price, Math.max(0, Number.isFinite(value) ? value : 0)));
  const chooseInitialPercent = (percent: number) =>
    updateDownPayment(Math.round(price * percent / 100));

  const shareQuote = () => {
    const text = [
      '*COTIZACIÓN DE LOTE*',
      '',
      `Precio del lote: ${money(price)}`,
      `Cuota inicial: ${money(downPayment)} (${calculations.initialPercent}%)`,
      `Saldo a financiar: ${money(calculations.financed)}`,
      `Plazo: ${months} meses`,
      `Tasa mensual: ${monthlyRate.toLocaleString('es-PE')}%`,
      `Cuota mensual estimada: ${money(calculations.installment)}`,
      `Total de intereses: ${money(calculations.interestTotal)}`,
      `Monto total final: ${money(calculations.finalTotal)}`,
      '',
      'Estimación referencial; no incluye costos no especificados.',
    ].join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="app-shell">
      <div className="app-frame">
        <header className="topbar">
          <div className="brand-lockup">
            <div className="brand-mark" aria-hidden="true"><MapPinned size={20} strokeWidth={1.8} /></div>
            <div>
              <div className="brand-name">Lotes · Cotizador</div>
              <div className="brand-subtitle">Simulación de financiamiento</div>
            </div>
          </div>
          <div className="top-note"><ShieldCheck size={15} /> Claro desde el primer número</div>
        </header>

        <section className="intro" aria-labelledby="page-heading">
          <div className="eyebrow">Tu próximo terreno, con claridad</div>
          <h1 id="page-heading">Pon tus números.<br /><span>Visualiza tu plan.</span></h1>
          <p>Ajusta el precio, la inicial y el plazo para entender cuánto pagarías cada mes.</p>
        </section>

        <div className="calculator-layout">
          <section className="controls-stack" aria-label="Datos para calcular tu financiamiento">
            <article className="control-card">
              <div className="control-head">
                <h2 className="control-title">Precio del lote</h2>
                <span className="control-step">01 / 04</span>
              </div>
              <div className="preset-grid" aria-label="Precios frecuentes">
                {[15000, 20000, 25000].map((amount) => (
                  <button
                    className={`preset-button ${price === amount ? 'is-selected' : ''}`}
                    type="button"
                    key={amount}
                    aria-pressed={price === amount}
                    data-testid={`button-price-${amount}`}
                    onClick={() => updatePrice(amount, true)}
                  >
                    {wholeMoney(amount)}
                  </button>
                ))}
              </div>
              <label className="money-input-wrap">
                <span className="money-prefix">S/</span>
                <input
                  className="money-input"
                  type="number"
                  min="1"
                  step="1"
                  value={price}
                  aria-label="Precio personalizado del lote en soles"
                  data-testid="input-lot-price"
                  onChange={(event) => updatePrice(Number(event.currentTarget.value))}
                />
              </label>
              <p className="input-helper">También puedes ingresar otro monto en soles.</p>
            </article>

            <article className="control-card">
              <div className="control-head">
                <h2 className="control-title">Cuota inicial</h2>
                <span className="range-current" data-testid="text-initial-percent">{calculations.initialPercent}% del precio</span>
              </div>
              <label className="money-input-wrap">
                <span className="money-prefix">S/</span>
                <input
                  className="money-input"
                  type="number"
                  min="0"
                  max={price}
                  step="1"
                  value={downPayment}
                  aria-label="Monto de la cuota inicial en soles"
                  data-testid="input-down-payment"
                  onChange={(event) => updateDownPayment(Number(event.currentTarget.value))}
                />
              </label>
              <div className="range-meta" style={{ marginTop: 17 }}>
                <span>Sin inicial</span><span>{wholeMoney(price)}</span>
              </div>
              <input
                className="range-input"
                type="range"
                min="0"
                max={price}
                step="1"
                value={downPayment}
                style={{ '--range-progress': `${(downPayment / price) * 100}%` } as CSSProperties}
                aria-label="Ajustar cuota inicial"
                data-testid="slider-down-payment"
                onChange={(event) => updateDownPayment(Number(event.currentTarget.value))}
              />
              <div className="preset-grid" style={{ marginTop: 11 }}>
                {[0, 10, 20].map((percent) => (
                  <button
                    className={`preset-button ${downPayment === Math.round(price * percent / 100) ? 'is-selected' : ''}`}
                    type="button"
                    key={percent}
                    aria-pressed={downPayment === Math.round(price * percent / 100)}
                    data-testid={`button-initial-${percent}`}
                    onClick={() => chooseInitialPercent(percent)}
                  >
                    {percent === 0 ? 'Sin inicial' : `${percent}%`}
                  </button>
                ))}
              </div>
            </article>

            <article className="control-card">
              <div className="control-head">
                <h2 className="control-title">Plazo de financiamiento</h2>
                <span className="control-step">03 / 04</span>
              </div>
              <div className="preset-grid">
                {[12, 24, 36].map((term) => (
                  <button
                    className={`preset-button ${months === term ? 'is-selected' : ''}`}
                    type="button"
                    key={term}
                    aria-pressed={months === term}
                    data-testid={`button-term-${term}`}
                    onClick={() => setMonths(term)}
                  >
                    {term} meses
                  </button>
                ))}
              </div>
            </article>

            <article className="control-card">
              <div className="control-head">
                <h2 className="control-title">Tasa de interés mensual</h2>
                <span className="range-current" data-testid="text-monthly-rate">{monthlyRate.toLocaleString('es-PE')}%</span>
              </div>
              <div className="range-meta"><span>0%</span><span>5%</span></div>
              <input
                className="range-input"
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={monthlyRate}
                style={{ '--range-progress': `${(monthlyRate / 5) * 100}%` } as CSSProperties}
                aria-label="Tasa de interés mensual"
                data-testid="slider-monthly-rate"
                onChange={(event) => setMonthlyRate(Math.min(5, Math.max(0, Number(event.currentTarget.value))))}
              />
              <div className="range-labels"><span>Sin interés</span><span>5% mensual</span></div>
            </article>
          </section>

          <aside className="result-panel" aria-label="Resumen de la cotización">
            <div className="result-kicker"><Calculator size={15} /> Tu estimación</div>
            <p className="installment-label">Cuota mensual aproximada</p>
            <div className="installment-value" data-testid="text-monthly-installment">
              {money(calculations.installment)}
            </div>
            <p className="term-caption">durante {months} meses, con una tasa mensual de {monthlyRate.toLocaleString('es-PE')}%</p>
            <div className="result-divider" />
            <dl className="result-list">
              <div className="result-row">
                <dt>Precio del lote</dt><dd data-testid="text-result-price">{money(price)}</dd>
              </div>
              <div className="result-row">
                <dt>Cuota inicial</dt><dd data-testid="text-result-down-payment">{money(downPayment)}</dd>
              </div>
              <div className="result-row">
                <dt>Saldo a financiar</dt><dd data-testid="text-financed-amount">{money(calculations.financed)}</dd>
              </div>
              <div className="result-row">
                <dt>Total de intereses</dt><dd data-testid="text-total-interest">{money(calculations.interestTotal)}</dd>
              </div>
              <div className="result-row">
                <dt>Plazo</dt><dd data-testid="text-result-term">{months} meses</dd>
              </div>
              <div className="result-row total">
                <dt>Monto total final</dt><dd data-testid="text-final-total">{money(calculations.finalTotal)}</dd>
              </div>
            </dl>
            <button className="share-button" type="button" data-testid="button-share-whatsapp" onClick={shareQuote}>
              <MessageCircle size={18} strokeWidth={2.1} />
              Compartir cotización por WhatsApp
            </button>
            <p className="share-note">Se abrirá WhatsApp con el resumen completo listo para enviar.</p>
          </aside>
        </div>

        <footer className="page-footer">
          <span><strong>Una referencia para comparar con calma.</strong></span>
          <span className="footer-disclaimer"><CircleHelp size={13} style={{ verticalAlign: '-2px', marginRight: 5 }} />Estimación referencial; no incluye costos no especificados.</span>
        </footer>
      </div>
    </main>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
