'use client'

import type { Step } from '@/types/form'
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

interface StepManagerProps {
  steps: Step[]
  onChange: (steps: Step[]) => void
  isDarkMode: boolean
}

export function StepManager({ steps, onChange, isDarkMode }: StepManagerProps) {
  const [editingStep, setEditingStep] = useState<Step | null>(null)
  const [showModal, setShowModal] = useState(false)

  const handleAdd = () => {
    const newStep: Step = {
      id: uuidv4(),
      title: '',
      description: '',
    }
    setEditingStep(newStep)
    setShowModal(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Bu adımı silmek istediğinize emin misiniz?')) {
      onChange(steps.filter(s => s.id !== id))
    }
  }

  const handleSaveStep = (step: Step) => {
    if (!step.title.trim()) {
      toast.error('Adım başlığı zorunludur')
      return
    }

    const exists = steps.some(s => s.id === step.id)
    if (exists) {
      onChange(steps.map(s => (s.id === step.id ? step : s)))
    } else {
      onChange([...steps, step])
    }
    setShowModal(false)
    setEditingStep(null)
  }

  const moveStep = (index: number, delta: -1 | 1) => {
    const newSteps = [...steps]
    const newIndex = index + delta
    if (newIndex >= 0 && newIndex < newSteps.length) {
      ;[newSteps[index], newSteps[newIndex]] = [
        newSteps[newIndex],
        newSteps[index],
      ]
      onChange(newSteps)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3
          className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
        >
          Adımlar ({steps.length})
        </h3>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
        >
          <Plus className="h-3 w-3" />
          Adım Ekle
        </button>
      </div>

      {steps.length === 0 ? (
        <div
          className={`rounded-lg border border-dashed p-6 text-center text-sm ${
            isDarkMode
              ? 'border-slate-700 text-slate-500'
              : 'border-gray-300 text-gray-400'
          }`}
        >
          Henüz adım eklenmedi. &quot;Toplu (Wizard)&quot; modu için en az bir
          adım ekleyin.
        </div>
      ) : (
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center justify-between rounded-lg border p-3 ${
                isDarkMode
                  ? 'border-slate-700 bg-slate-800/50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    isDarkMode
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'bg-violet-100 text-violet-600'
                  }`}
                >
                  {index + 1}
                </span>
                <div>
                  <div
                    className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {step.title}
                  </div>
                  {step.description && (
                    <div
                      className={`text-xs ${
                        isDarkMode ? 'text-slate-500' : 'text-gray-500'
                      }`}
                    >
                      {step.description}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveStep(index, -1)}
                  disabled={index === 0}
                  className={`p-1 text-gray-400 hover:text-violet-500 disabled:opacity-30 ${
                    index === 0 ? 'invisible' : ''
                  }`}
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveStep(index, 1)}
                  disabled={index === steps.length - 1}
                  className={`p-1 text-gray-400 hover:text-violet-500 disabled:opacity-30 ${
                    index === steps.length - 1 ? 'invisible' : ''
                  }`}
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <div
                  className={`mx-1 h-4 w-px ${isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setEditingStep(step)
                    setShowModal(true)
                  }}
                  className={`rounded p-1 transition-colors ${
                    isDarkMode
                      ? 'text-slate-400 hover:bg-slate-700 hover:text-white'
                      : 'text-gray-500 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(step.id)}
                  className="rounded p-1 text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && editingStep && (
        <StepModal
          step={editingStep}
          onSave={handleSaveStep}
          onClose={() => {
            setShowModal(false)
            setEditingStep(null)
          }}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  )
}

interface StepModalProps {
  step: Step
  onSave: (step: Step) => void
  onClose: () => void
  isDarkMode: boolean
}

function StepModal({ step, onSave, onClose, isDarkMode }: StepModalProps) {
  const [title, setTitle] = useState(step.title)
  const [description, setDescription] = useState(step.description || '')

  const inputClass = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
    isDarkMode
      ? 'border border-slate-700/50 bg-slate-800/50 text-white placeholder-slate-500 focus:border-violet-500'
      : 'border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-violet-500'
  }`

  const labelClass = `block text-sm font-medium mb-2 ${
    isDarkMode ? 'text-slate-300' : 'text-gray-700'
  }`

  return (
    <div className="z-60 fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-2xl p-6 ${
          isDarkMode
            ? 'border border-slate-700 bg-slate-900'
            : 'border border-gray-200 bg-white'
        }`}
      >
        <h3
          className={`mb-4 text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          {step.title ? 'Adımı Düzenle' : 'Yeni Adım'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Başlık *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={inputClass}
              placeholder="Adım Başlığı (Örn: Kişisel Bilgiler)"
              autoFocus
            />
          </div>

          <div>
            <label className={labelClass}>Açıklama</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={inputClass}
              placeholder="Adım Açıklaması (İsteğe bağlı)"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            İptal
          </button>
          <button
            type="button"
            onClick={() => onSave({ ...step, title, description })}
            className="bg-linear-to-r flex-1 rounded-xl from-violet-500 to-purple-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  )
}
