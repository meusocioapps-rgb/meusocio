import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/login" className="mb-6 inline-block text-xs font-medium text-brand-900">
        ← Voltar
      </Link>

      <h1 className="mb-2 text-xl font-bold text-gray-900">Termos de Uso</h1>
      <p className="mb-6 text-xs text-gray-400">Ultima atualizacao: 23 de marco de 2026</p>

      <div className="space-y-6 text-[13px] leading-relaxed text-gray-700">
        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-gray-900">1. Aceitacao dos termos</h2>
          <p>
            Ao criar uma conta e utilizar a plataforma <strong>Meu Socio</strong>, voce concorda com
            estes Termos de Uso e com nossa Politica de Privacidade. Caso nao concorde, nao utilize o
            servico.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-gray-900">2. Descricao do servico</h2>
          <p>
            O Meu Socio e uma plataforma SaaS de gestao para profissionais autonomos e
            Microempreendedores Individuais (MEI), oferecendo funcionalidades de agenda, gestao de
            clientes, controle financeiro e relatorios.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-gray-900">3. Cadastro e conta</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Voce e responsavel por manter a confidencialidade de suas credenciais de acesso;</li>
            <li>As informacoes fornecidas devem ser verdadeiras e atualizadas;</li>
            <li>Cada conta e pessoal e intransferivel;</li>
            <li>Voce e responsavel por todas as atividades realizadas em sua conta.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-gray-900">4. Planos e pagamento</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>O servico oferece periodo de teste gratuito de 7 dias;</li>
            <li>Apos o periodo de teste, o acesso requer assinatura ativa;</li>
            <li>Os valores e condicoes dos planos estao disponiveis na plataforma;</li>
            <li>O cancelamento pode ser feito a qualquer momento, sem multa;</li>
            <li>Nao ha reembolso por periodos parciais ja pagos.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-gray-900">5. Uso aceitavel</h2>
          <p>Voce concorda em nao:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Utilizar o servico para fins ilegais ou nao autorizados;</li>
            <li>Tentar acessar dados de outros usuarios;</li>
            <li>Interferir no funcionamento da plataforma;</li>
            <li>Compartilhar suas credenciais com terceiros;</li>
            <li>Reproduzir, copiar ou revender o servico sem autorizacao.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-gray-900">6. Propriedade dos dados</h2>
          <p>
            Os dados que voce insere na plataforma (clientes, agendamentos, financas) sao de sua
            propriedade. Voce pode solicitar a exportacao ou exclusao dos seus dados a qualquer
            momento, conforme previsto na LGPD.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-gray-900">7. Disponibilidade</h2>
          <p>
            Nos esforçamos para manter a plataforma disponivel 24/7, mas nao garantimos
            disponibilidade ininterrupta. Manutencoes programadas serao comunicadas com antecedencia
            quando possivel.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-gray-900">8. Limitacao de responsabilidade</h2>
          <p>
            O Meu Socio e uma ferramenta de gestao e nao substitui consultoria contabil, juridica ou
            financeira. Nao nos responsabilizamos por decisoes tomadas com base nas informacoes
            apresentadas na plataforma.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-gray-900">9. Cancelamento e exclusao</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Voce pode cancelar sua conta a qualquer momento;</li>
            <li>Apos o cancelamento, seus dados serao mantidos por 30 dias e depois excluidos;</li>
            <li>Nos reservamos o direito de suspender contas que violem estes termos.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-gray-900">10. Alteracoes</h2>
          <p>
            Podemos atualizar estes termos periodicamente. Alteracoes significativas serao
            comunicadas por e-mail ou pela plataforma. O uso continuado apos a alteracao constitui
            aceitacao dos novos termos.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-gray-900">11. Legislacao aplicavel</h2>
          <p>
            Estes termos sao regidos pelas leis da Republica Federativa do Brasil. Eventuais
            controversias serao resolvidas no foro da comarca de domicilio do usuario.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-gray-900">12. Contato</h2>
          <p>
            Para duvidas sobre estes termos, entre em contato pelo e-mail:{' '}
            <strong>meusocio.apps@gmail.com</strong>
          </p>
        </section>
      </div>
    </div>
  )
}
