import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Select, NumberInput } from '../components/FormControls'
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

  // Chained option lists.
  const makeOptions = form.fuelType ? makesFor(form.fuelType) : []
  const modelOptions = form.fuelType && form.make
    ? modelsFor(form.fuelType, form.make).map((v) => v.model)
    : []

  // Update a field; reset dependent fields when a parent changes.
  function set(field, value) {
    const touched = [field] // fields whose errors should clear
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
          next.msrp = String(v.msrp) // pre-fill, user can override
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
    if (!form.fuelType) e.fuelType = 'Select a fuel type.'
    if (!form.make) e.make = 'Select a make.'
    if (!form.model) e.model = 'Select a model.'
    if (!form.year) e.year = 'Select a model year.'

    const mileage = Number(form.mileage)
    if (form.mileage === '' || Number.isNaN(mileage)) e.mileage = 'Enter current mileage.'
    else if (mileage < 0 || mileage > 300000) e.mileage = 'Enter a value between 0 and 300,000.'

    const annual = Number(form.annualMiles)
    if (form.annualMiles === '' || Number.isNaN(annual)) e.annualMiles = 'Enter annual miles.'
    else if (annual <= 0 || annual > 100000) e.annualMiles = 'Enter a value between 1 and 100,000.'

    const msrp = Number(form.msrp)
    if (form.msrp === '' || Number.isNaN(msrp)) e.msrp = 'Enter a purchase price.'
    else if (msrp < 5000 || msrp > 500000) e.msrp = 'Enter a value between $5,000 and $500,000.'

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

    // Brief pause so the loading state reads as intentional work.
    await new Promise((r) => setTimeout(r, 900))
    navigate('/results', { state: { vehicle } })
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">Your vehicle</h1>
        <p className="mt-2 text-ink-muted">
          Tell us about the car. We&apos;ll model its depreciation and run the
          buy-vs-lease numbers.
        </p>
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
            placeholder="Select fuel type"
            error={errors.fuelType}
          />
        </motion.div>

        <motion.div variants={item} className="grid gap-6 sm:grid-cols-2">
          <Select
            label="Make"
            value={form.make}
            onChange={(v) => set('make', v)}
            options={makeOptions}
            placeholder={form.fuelType ? 'Select make' : 'Pick fuel type first'}
            error={errors.make}
            disabled={!form.fuelType}
          />
          <Select
            label="Model"
            value={form.model}
            onChange={(v) => set('model', v)}
            options={modelOptions}
            placeholder={form.make ? 'Select model' : 'Pick make first'}
            error={errors.model}
            disabled={!form.make}
          />
        </motion.div>

        <motion.div variants={item}>
          <Select
            label="Model year"
            value={form.year}
            onChange={(v) => set('year', v)}
            options={MODEL_YEARS.map((y) => ({ value: String(y), label: String(y) }))}
            placeholder="Select year"
            error={errors.year}
          />
        </motion.div>

        <motion.div variants={item} className="grid gap-6 sm:grid-cols-2">
          <NumberInput
            label="Current mileage"
            value={form.mileage}
            onChange={(v) => set('mileage', v)}
            placeholder="0"
            suffix="mi"
            error={errors.mileage}
          />
          <NumberInput
            label="Annual miles driven"
            value={form.annualMiles}
            onChange={(v) => set('annualMiles', v)}
            placeholder="12000"
            suffix="mi/yr"
            error={errors.annualMiles}
          />
        </motion.div>

        <motion.div variants={item}>
          <NumberInput
            label="Purchase price (MSRP)"
            value={form.msrp}
            onChange={(v) => set('msrp', v)}
            placeholder="40000"
            prefix="$"
            error={errors.msrp}
          />
        </motion.div>

        <motion.div variants={item}>
          <button
            type="submit"
            disabled={submitting}
            className="group flex w-full items-center justify-center gap-2 rounded-lg bg-teal px-6 py-4 text-base font-semibold text-navy transition hover:bg-teal-400 disabled:cursor-wait disabled:opacity-80"
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
                  Calculating…
                </motion.span>
              ) : (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Calculate projection →
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </motion.div>
      </motion.form>
    </section>
  )
}
