'use client'

import { useState } from 'react'
import {
  HelpCircle,
  MessageCircle,
  Mail,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
  Zap,
  Shield,
  CreditCard,
  Users,
  Calendar,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FaqItem {
  question: string
  answer: string
  category: string
  icon: React.ReactNode
}

const faqs: FaqItem[] = [
  {
    category: 'Geral',
    icon: <Zap size={13} />,
    question: 'O que é o Meu Sócio?',
    answer:
      'O Meu Sócio é uma plataforma de gestão completa para profissionais autônomos e MEIs. Ele ajuda você a controlar agendamentos, clientes, finanças e muito mais, tudo em um só lugar.',
  },
  {
    category: 'Geral',
    icon: <Zap size={13} />,
    question: 'Posso usar no celular?',
    answer:
      'Sim! O Meu Sócio foi feito com design mobile-first. Você pode acessar pelo navegador do celular ou instalar como aplicativo (PWA) na tela inicial do seu smartphone.',
  },
  {
    category: 'Agenda',
    icon: <Calendar size={13} />,
    question: 'Como agendar um atendimento?',
    answer:
      'Vá em "Agenda" e clique no botão "+ Novo Atendimento". Selecione o cliente, o serviço, data e horário. Você também pode agendar diretamente pela ficha do cliente.',
  },
  {
    category: 'Agenda',
    icon: <Calendar size={13} />,
    question: 'Como remarcar um atendimento?',
    answer:
      'Na agenda, clique no atendimento que deseja alterar. No modal que abrir, selecione "Remarcar", escolha a nova data e horário, e confirme.',
  },
  {
    category: 'Agenda',
    icon: <Calendar size={13} />,
    question: 'O que é "retorno gratuito"?',
    answer:
      'Ao finalizar um atendimento, você pode agendar um retorno e marcar como cortesia. Isso registra o atendimento sem gerar receita — útil para retoques ou correções.',
  },
  {
    category: 'Clientes',
    icon: <Users size={13} />,
    question: 'O que significa cliente "recorrente"?',
    answer:
      'Um cliente é considerado recorrente quando atinge o número mínimo de visitas configurado nas suas configurações (padrão: 3 visitas). Eles aparecem com a tag "Recorrente" na lista.',
  },
  {
    category: 'Clientes',
    icon: <Users size={13} />,
    question: 'Como funciona a reativação de clientes?',
    answer:
      'Clientes que não visitam há mais de X dias (configurável) aparecem na lista "Para reativar". Você recebe notificações e pode contatá-los diretamente pelo WhatsApp.',
  },
  {
    category: 'Finanças',
    icon: <BarChart3 size={13} />,
    question: 'As finanças são calculadas automaticamente?',
    answer:
      'Sim! Ao finalizar um atendimento, a receita é registrada automaticamente. O CMV (custo dos produtos) também é calculado se você cadastrou o custo no serviço.',
  },
  {
    category: 'Finanças',
    icon: <BarChart3 size={13} />,
    question: 'Posso cadastrar despesas fixas?',
    answer:
      'Sim! Vá em "Despesas" e cadastre suas despesas fixas mensais (aluguel, internet, etc). O sistema avisa quando elas estão perto do vencimento.',
  },
  {
    category: 'Plano',
    icon: <CreditCard size={13} />,
    question: 'Qual a diferença entre os planos?',
    answer:
      'O plano Gratuito permite funcionalidades básicas. O Starter adiciona relatórios. O Pro desbloqueia todas as funcionalidades, incluindo exportação de dados e suporte prioritário.',
  },
  {
    category: 'Segurança',
    icon: <Shield size={13} />,
    question: 'Meus dados estão seguros?',
    answer:
      'Absolutamente. Seus dados são armazenados com criptografia no Supabase (infraestrutura AWS). Cada usuário só pode acessar seus próprios dados através de Row Level Security (RLS).',
  },
]

const categories = ['Todas', 'Geral', 'Agenda', 'Clientes', 'Finanças', 'Plano', 'Segurança']

export default function SupportPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [category, setCategory] = useState('Todas')

  const filtered =
    category === 'Todas' ? faqs : faqs.filter((f) => f.category === category)

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mb-2 text-4xl">💬</div>
        <h2 className="text-lg font-semibold">Central de Ajuda</h2>
        <p className="mt-1 text-[13px] text-gray-400">
          Encontre respostas para as dúvidas mais comuns
        </p>
      </div>

      {/* Canais de contato */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <a
          href="https://wa.me/5521997302942?text=Olá! Preciso de ajuda com o Meu Sócio"
          target="_blank"
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-green-300 hover:bg-green-50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <MessageCircle size={18} className="text-green-600" />
          </div>
          <div>
            <div className="text-[13px] font-semibold">WhatsApp</div>
            <div className="text-[10px] text-gray-400">Resposta rápida</div>
          </div>
        </a>
        <a
          href="mailto:meusocio.apps@gmail.com"
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-300 hover:bg-blue-50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <Mail size={18} className="text-blue-600" />
          </div>
          <div>
            <div className="text-[13px] font-semibold">E-mail</div>
            <div className="text-[10px] text-gray-400">meusocio.apps@gmail.com</div>
          </div>
        </a>
      </div>

      {/* Filtro por categoria */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setCategory(cat)
              setOpenIndex(null)
            }}
            className={cn(
              'flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors',
              category === cat
                ? 'bg-brand-900 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ Accordion */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
          <HelpCircle size={14} className="text-brand-900" />
          <h3 className="text-[13px] font-semibold">
            Perguntas frequentes ({filtered.length})
          </h3>
        </div>
        <div>
          {filtered.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <div
                key={i}
                className="border-b border-gray-50 last:border-0"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50"
                >
                  <span className="text-gray-400">{faq.icon}</span>
                  <span className="flex-1 text-[13px] font-medium">
                    {faq.question}
                  </span>
                  {isOpen ? (
                    <ChevronUp size={14} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={14} className="text-gray-400" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pl-10">
                    <p className="text-[12px] leading-relaxed text-gray-500">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 p-5 text-center">
        <BookOpen size={20} className="mx-auto mb-2 text-brand-900" />
        <h4 className="text-[13px] font-semibold">Não encontrou sua resposta?</h4>
        <p className="mt-1 text-[11px] text-gray-500">
          Fale diretamente com nosso suporte pelo WhatsApp
        </p>
        <a
          href="https://wa.me/5521997302942?text=Olá! Preciso de ajuda com o Meu Sócio"
          target="_blank"
          className="mt-3 inline-flex items-center gap-1 rounded-lg bg-brand-900 px-4 py-2 text-xs font-medium text-white"
        >
          Falar com suporte
          <ExternalLink size={11} />
        </a>
      </div>
    </div>
  )
}
