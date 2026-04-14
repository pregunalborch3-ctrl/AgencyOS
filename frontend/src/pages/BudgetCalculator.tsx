import { useState } from 'react'
import { Plus, Trash2, Download, Calculator, ChevronDown, ChevronUp } from 'lucide-react'
import Header from '../components/Layout/Header'
import type { Budget, BudgetLineItem, BudgetCategory } from '../types'

const categories: BudgetCategory[] = [
  'Estrategia', 'Creatividad', 'Producción', 'Medios', 'Influencers', 'Tecnología', 'Gestión', 'Otro',
]

const categoryColors: Record<BudgetCategory, string> = {
  Estrategia: 'bg-indigo-100 text-indigo-700',
  Creatividad: 'bg-violet-100 text-violet-700',
  Producción: 'bg-purple-100 text-purple-700',
  Medios: 'bg-sky-100 text-sky-700',
  Influencers: 'bg-pink-100 text-pink-700',
  Tecnología: 'bg-cyan-100 text-cyan-700',
  Gestión: 'bg-amber-100 text-amber-700',
  Otro: 'bg-gray-100 text-gray-600',
}

const newItem = (category: BudgetCategory = 'Creatividad'): BudgetLineItem => ({
  id: Date.now().toString(),
  description: '',
  category,
  quantity: 1,
  unitPrice: 0,
  total: 0,
})

const initialBudget: Budget = {
  id: '1',
  projectName: '',
  client: '',
  currency: 'EUR',
  items: [
    { id: '1', description: 'Estrategia de contenido', category: 'Estrategia', quantity: 1, unitPrice: 1500, total: 1500 },
    { id: '2', description: 'Diseño gráfico (pack 10 piezas)', category: 'Creatividad', quantity: 10, unitPrice: 120, total: 1200 },
    { id: '3', description: 'Gestión redes sociales (1 mes)', category: 'Gestión', quantity: 1, unitPrice: 800, total: 800 },
  ],
  agencyFeePercent: 15,
  taxPercent: 21,
  notes: '',
  createdAt: new Date().toISOString(),
}

export default function BudgetCalculator() {
  const [budget, setBudget] = useState<Budget>(initialBudget)
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set())

  const updateItem = (id: string, field: keyof BudgetLineItem, value: string | number) => {
    setBudget((b) => ({
      ...b,
      items: b.items.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        updated.total = updated.quantity * updated.unitPrice
        return updated
      }),
    }))
  }

  const addItem = (category: BudgetCategory) => {
    setBudget((b) => ({ ...b, items: [...b.items, newItem(category)] }))
  }

  const removeItem = (id: string) => {
    setBudget((b) => ({ ...b, items: b.items.filter((x) => x.id !== id) }))
  }

  const toggleCat = (cat: string) => {
    setCollapsedCats((s) => {
      const ns = new Set(s)
      ns.has(cat) ? ns.delete(cat) : ns.add(cat)
      return ns
    })
  }

  const subtotal = budget.items.reduce((s, i) => s + i.total, 0)
  const agencyFee = subtotal * (budget.agencyFeePercent / 100)
  const taxBase = subtotal + agencyFee
  const tax = taxBase * (budget.taxPercent / 100)
  const total = taxBase + tax

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: budget.currency }).format(n)

  const groupedItems = categories
    .map((cat) => ({ cat, items: budget.items.filter((i) => i.category === cat) }))
    .filter((g) => g.items.length > 0)

  const printBudget = () => window.print()

  return (
    <div className="flex-1">
      <Header
        title="Calculadora de Presupuesto"
        subtitle="Genera presupuestos detallados para tus campañas"
      />
      <div className="p-6 space-y-6">
        {/* Project info */}
        <div className="card p-6">
          <h2 className="section-title mb-4">Información del proyecto</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Nombre del proyecto</label>
              <input
                className="input"
                placeholder="ej. Campaña Verano 2026"
                value={budget.projectName}
                onChange={(e) => setBudget((b) => ({ ...b, projectName: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Cliente</label>
              <input
                className="input"
                placeholder="ej. Zara Home"
                value={budget.client}
                onChange={(e) => setBudget((b) => ({ ...b, client: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Moneda</label>
              <select
                className="select"
                value={budget.currency}
                onChange={(e) => setBudget((b) => ({ ...b, currency: e.target.value }))}
              >
                <option value="EUR">EUR — Euro</option>
                <option value="USD">USD — Dólar</option>
                <option value="MXN">MXN — Peso mexicano</option>
                <option value="COP">COP — Peso colombiano</option>
                <option value="ARS">ARS — Peso argentino</option>
              </select>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="section-title">Partidas del presupuesto</h2>
            <div className="flex gap-2">
              {categories.slice(0, 3).map((cat) => (
                <button key={cat} className="btn-secondary text-xs py-1.5" onClick={() => addItem(cat)}>
                  <Plus size={13} /> {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <div className="col-span-5">Descripción</div>
            <div className="col-span-2">Categoría</div>
            <div className="col-span-1 text-right">Cant.</div>
            <div className="col-span-2 text-right">Precio unit.</div>
            <div className="col-span-1 text-right">Total</div>
            <div className="col-span-1" />
          </div>

          {/* Grouped items */}
          {groupedItems.map(({ cat, items }) => (
            <div key={cat}>
              <button
                className="w-full flex items-center justify-between px-6 py-2.5 bg-gray-50/80 hover:bg-gray-100 transition-colors border-b border-gray-100"
                onClick={() => toggleCat(cat)}
              >
                <div className="flex items-center gap-2">
                  <span className={`badge text-xs ${categoryColors[cat]}`}>{cat}</span>
                  <span className="text-xs text-gray-500">{items.length} partida{items.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700">
                    {fmt(items.reduce((s, i) => s + i.total, 0))}
                  </span>
                  {collapsedCats.has(cat) ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </div>
              </button>

              {!collapsedCats.has(cat) && items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 px-6 py-2.5 border-b border-gray-50 items-center hover:bg-gray-50/50">
                  <div className="col-span-5">
                    <input
                      className="input text-sm py-1.5"
                      placeholder="Descripción"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <select
                      className="select text-xs py-1.5"
                      value={item.category}
                      onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                    >
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <input
                      className="input text-sm py-1.5 text-right"
                      type="number"
                      min={0}
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      className="input text-sm py-1.5 text-right"
                      type="number"
                      min={0}
                      step={10}
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-1 text-right text-sm font-semibold text-gray-700">
                    {fmt(item.total)}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {!collapsedCats.has(cat) && (
                <button
                  className="w-full flex items-center gap-2 px-6 py-2 text-xs text-indigo-500 hover:bg-indigo-50 transition-colors border-b border-gray-50"
                  onClick={() => addItem(cat)}
                >
                  <Plus size={13} /> Añadir partida a {cat}
                </button>
              )}
            </div>
          ))}

          {budget.items.length === 0 && (
            <div className="px-6 py-10 text-center">
              <Calculator size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-400">No hay partidas. Añade una para comenzar.</p>
            </div>
          )}
        </div>

        {/* Totals + settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fee/Tax settings */}
          <div className="card p-6 space-y-4">
            <h2 className="section-title">Configuración de cálculo</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Honorarios agencia (%)</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={100}
                  value={budget.agencyFeePercent}
                  onChange={(e) => setBudget((b) => ({ ...b, agencyFeePercent: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="label">IVA / Impuesto (%)</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={100}
                  value={budget.taxPercent}
                  onChange={(e) => setBudget((b) => ({ ...b, taxPercent: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div>
              <label className="label">Notas internas</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Observaciones para el equipo..."
                value={budget.notes}
                onChange={(e) => setBudget((b) => ({ ...b, notes: e.target.value }))}
              />
            </div>
          </div>

          {/* Totals */}
          <div className="card p-6">
            <h2 className="section-title mb-4">Resumen</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal partidas</span>
                <span className="font-medium">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Honorarios agencia ({budget.agencyFeePercent}%)</span>
                <span className="font-medium">{fmt(agencyFee)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-dashed border-gray-200 pt-3">
                <span className="text-gray-600">Base imponible</span>
                <span className="font-medium">{fmt(taxBase)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">IVA ({budget.taxPercent}%)</span>
                <span className="font-medium">{fmt(tax)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="font-bold text-gray-900 text-lg">TOTAL</span>
                <span className="font-bold text-indigo-600 text-xl">{fmt(total)}</span>
              </div>
            </div>
            <button className="btn-primary w-full justify-center mt-5" onClick={printBudget}>
              <Download size={16} /> Exportar presupuesto
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
