import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Select, NumberInput } from '../components/FormControls'
import SearchableSelect from '../components/SearchableSelect'
import {
  FUEL_TYPES,
  MODEL_YEARS,
  makesFor,
  modelsFor,
  findVehicle,
} from '../data/vehicles'
import { DEFAULT_ANNUAL_MILES } from '../data/constants'

const empty = {
  fuelType: '',
  make: '',
  model: '',
  year: '',
  mileage: '',
  annualMiles: String(DEFAULT_ANNUAL_MILES),
  msrp: '',
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
}

export default function InputForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const makeOptions = form.fuelType ? makesFor(form.fuelType) : []
  const modelOptions = form.fuelType && form.make
    ? modelsFor(form.fuelType, form.make).map((v) => v.model)
    : []

  // Update a field; reset dependent fields when a parent changes.
  function set(field, value) {
    const touched = [field]
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'fuelType') {
        next.make = ''
        next.model = ''
        next.msrp = ''
        touched.push('make', 'model', 'msrp')
      }
      if (field === 'make') {
        next.model = ''
        next.msrp = ''
        touched.push('model', 'msrp')
      }
      if (field === 'model') {
        const v = findVehicle(next.fuelType, next.make, value)
        if (v) {
          next.msrp = String(v.msrp)
          touched.push('msrp')
        }
      }
      return next
    })
    setErrors((e) => {
      const cleared = { ...e }
      for (const f of touched) cleared[f] = undefined
      return cleared
    })
  }

  function validate() {
    const e = {}
    if (!form.fuelType) e.fuelType = 'Pick a fuel type first.'
    if (!form.make) e.make = 'Pick a make.'
    if (!form.model) e.model = 'Pick a model.'
    if (!form.year) e.year = 'Which year is it?'

    const mileage = Number(form.mileage)
    if (form.mileage === '' || Number.isNaN(mileage)) e.mileage = 'How many miles are on it?'
    else if (mileage < 0 || mileage > 300000) e.mileage = 'That should be between 0 and 300,000.'

    const annual = Number(form.annualMiles)
    if (form.annualMiles === '' || Number.isNaN(annual)) e.annualMiles = 'Roughly how far do you drive a year?'
    else if (annual <= 0 || annual > 100000) e.annualMiles = 'That should be between 1 and 100,000.'

    const msrp = Number(form.msrp)
    if (form.msrp === '' || Number.isNaN(msrp)) e.msrp = 'What did it cost new?'
    else if (msrp < 5000 || msrp > 500000) e.msrp = 'That should be between $5,000 and $500,000.'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(evt) {
    evt.preventDefault()
    if (!validate()) return
    setSubmitting(true)

    const vehicle = {
      fuelType: form.fuelType,
      make: form.make,
      model: form.model,
      year: Number(form.year),
      mileage: Number(form.mileage),
      milesPerYear: Number(form.annualMiles),
      msrp: Number(form.msrp),
      age: Math.max(0, new Date().getFullYear() - Number(form.year)),
    }

    await new Promise((r) => setTimeout(r, 900))
    navigate('/results', { state: { vehicle } })
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">Tell us about your car</h1>
        <p className="mt-2 text-ink-muted">Just the basics. We will handle the math.</p>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        variants={container}
        initial="hidden"
        animate="show"
        className="mt-10 space-y-6 rounded-2xl border border-border bg-surface-raised/60 p-6 sm:p-8"
        noValidate
      >
        <motion.div variants={item}>
          <Select
            label="Fuel type"
            value={form.fuelType}
            onChange={(v) => set('fuelType', v)}
            options={FUEL_TYPES}
            placeholder="Electric or gas?"
            error={errors.fuelType}
          />
        </motion.div>

        <motion.div variants={item} className="grid gap-6 sm:grid-cols-2">
          <SearchableSelect
            label="Make"
            value={form.make}
            onChange={(v) => set('make', v)}
            options={makeOptions}
            placeholder={form.fuelType ? 'Type to search' : 'Pick a fuel type first'}
            error={errors.make}
            disabled={!form.fuelType}
          />
          <SearchableSelect
            label="Model"
            value={form.model}
            onChange={(v) => set('model', v)}
            options={modelOptions}
            placeholder={form.make ? 'Type to search' : 'Pick a make first'}
            error={errors.model}
            disabled={!form.make}
          />
        </motion.div>

        <motion.div variants={item}>
          <Select
            label="Year"
            value={form.year}
            onChange={(v) => set('year', v)}
            options={MODEL_YEARS.map((y) => ({ value: String(y), label: String(y) }))}
            placeholder="Model year"
            error={errors.year}
          />
        </motion.div>

        <motion.div variants={item} className="grid gap-6 sm:grid-cols-2">
          <NumberInput
            label="Miles on it now"
            value={form.mileage}
            onChange={(v) => set('mileage', v)}
            placeholder="0"
            suffix="mi"
            error={errors.mileage}
          />
          <NumberInput
            label="Miles you drive a year"
            value={form.annualMiles}
            onChange={(v) => set('annualMiles', v)}
            placeholder="12000"
            suffix="mi/yr"
            error={errors.annualMiles}
          />
        </motion.div>

        <motion.div variants={item}>
          <NumberInput
            label="What it cost new"
            value={form.msrp}
            onChange={(v) => set('msrp', v)}
            placeholder="40000"
            prefix="$"
            error={errors.msrp}
          />
        </motion.div>

        <motion.div
          variants={item}
          className="sticky bottom-0 z-10 -mx-6 border-t border-border bg-navy/90 px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none"
        >
          <button
            type="submit"
            disabled={submitting}
            className="group flex min-h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-teal px-6 py-4 text-base font-semibold text-navy transition hover:bg-teal-400 disabled:cursor-wait disabled:opacity-80"
          >
            <AnimatePresence mode="wait" initial={false}>
              {submitting ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy/40 border-t-navy" />
                  Crunching the numbers…
                </motion.span>
              ) : (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Show me the numbers →
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </motion.div>
      </motion.form>
    </section>
  )
}
